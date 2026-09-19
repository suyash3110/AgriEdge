import argparse, hashlib, json, random, re, zipfile
from pathlib import Path
import numpy as np
from PIL import Image
import torch
from torch import nn
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from train_quality import TomatoCNN, predict

def train(archive, output, epochs=12):
    rng=random.Random(26132);torch.manual_seed(26132);np.random.seed(26132);torch.set_num_threads(2)
    z=zipfile.ZipFile(archive); names=sorted(n for n in z.namelist() if re.search(r'/(FreshPotato|RottenPotato)/',n) and n.lower().endswith(('.png','.jpg','.jpeg')))
    arrays=[];labels=[];groups=[];manifest=[];seen={}
    for name in names:
        label=int('/RottenPotato/' in name)
        with z.open(name) as f, Image.open(f) as im:
            im=im.convert('RGB');digest=hashlib.sha256(im.tobytes()+str(im.size).encode()).hexdigest();a=np.asarray(im.resize((64,64))).copy()
        if digest in seen:
            if seen[digest]!=label: raise ValueError('Conflicting pixel labels')
            continue
        seen[digest]=label
        # All lighting and angle frames of one physical potato belong to a single group.
        m=re.match(r'\d+_Potato_(\d+)_',Path(name).name,re.I)
        group=f'{label}/physical-{m[1]}' if m else f'{label}/source-image-{Path(name).stem.lower()}'
        arrays.append(a);labels.append(label);groups.append(group);manifest.append({'path':name,'group':group,'label':['fresh','rotten'][label],'pixel_sha256':digest})
    split_groups=[set(),set(),set()]
    for label in range(2):
        # Stratify by lab vs other images to preserve both sources in held-out sets.
        for source in ['physical','source-image']:
            gs=sorted({g for g,y in zip(groups,labels) if y==label and '/'+source+'-' in g});rng.shuffle(gs)
            a=int(.7*len(gs));b=int(.85*len(gs))
            for dest,items in zip(split_groups,[gs[:a],gs[a:b],gs[b:]]):dest.update(items)
    splits=[[i for i,g in enumerate(groups) if g in gs] for gs in split_groups]
    assert all(split_groups[i].isdisjoint(split_groups[j]) for i in range(3) for j in range(i))
    for split,ids in enumerate(splits):
        for i in ids:manifest[i]['split']=['train','validation','test'][split]
    out=Path(output);out.mkdir(parents=True,exist_ok=True);(out/'split-manifest.json').write_text(json.dumps(manifest,indent=2))
    x=torch.from_numpy(np.stack(arrays)).permute(0,3,1,2).contiguous();y=torch.tensor(labels)
    model=TomatoCNN();model.layers[-1]=nn.Linear(64,2);optim=torch.optim.AdamW(model.parameters(),lr=.001,weight_decay=.001);loss_fn=nn.CrossEntropyLoss();best=-1;history=[]
    for epoch in range(epochs):
        model.train();ids=np.random.permutation(splits[0])
        for pos in range(0,len(ids),64):
            batch=ids[pos:pos+64];inputs=x[batch].float()/255
            if rng.random()<.5:inputs=inputs.flip(3)
            optim.zero_grad();loss=loss_fn(model(inputs),y[batch]);loss.backward();optim.step()
        score=float(f1_score(y[splits[1]].numpy(),predict(model,x,splits[1]).argmax(1),average='macro',zero_division=0));history.append({'epoch':epoch+1,'validation_macro_f1':score});print(history[-1],flush=True)
        if score>best:best=score;torch.save(model.state_dict(),out/'potato-cnn.pt')
    model.load_state_dict(torch.load(out/'potato-cnn.pt',weights_only=True));truth=y[splits[2]].numpy();pred=predict(model,x,splits[2]).argmax(1)
    report={'task':'potato_visible_freshness','source_url':'https://www.kaggle.com/datasets/filipemonteir/fresh-and-rotten-fruits-and-vegetables','permission':'User explicitly authorized download and training on 2026-09-08; source licence listed Unknown','source_sha256':hashlib.sha256(Path(archive).read_bytes()).hexdigest(),'classes':['fresh','rotten'],'seed':26132,'split_policy':'70/15/15 by physical potato ID for lab images, filename for other source images; exact decoded duplicates removed; stratified by class and source','source_images':len(names),'decoded_unique_images':len(arrays),'split_counts':dict(zip(['train','validation','test'],map(len,splits))),'group_counts':list(map(len,split_groups)),'history':history,'selected_by':'validation macro F1 only','test_macro_f1':float(f1_score(truth,pred,average='macro',zero_division=0)),'classification_report':classification_report(truth,pred,target_names=['fresh','rotten'],output_dict=True,zero_division=0),'confusion_matrix':confusion_matrix(truth,pred).tolist(),'artifact_sha256':hashlib.sha256((out/'potato-cnn.pt').read_bytes()).hexdigest(),'status':'research_candidate_not_production_approved','limitations':['Small number of independent physical potatoes in lab source','Other images lack farm and batch identifiers; near duplicates may remain','No external Nagpur field holdout or calibrated out-of-distribution detector','Visible freshness is not food safety, chemical residue, moisture or market-grade certification']}
    (out/'evaluation.json').write_text(json.dumps(report,indent=2));print('Held-out macro F1:',report['test_macro_f1'],flush=True)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--archive',required=True);p.add_argument('--output',required=True);p.add_argument('--epochs',type=int,default=12);a=p.parse_args();train(a.archive,a.output,a.epochs)
