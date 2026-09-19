"""Research classifier for annotated individual peanut crops, NOT a detector or food-safety test."""
import collections, hashlib, json, random, re, tarfile
from pathlib import Path
import numpy as np
from PIL import Image
import torch
from torch import nn
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from train_quality import TomatoCNN,predict

def train():
    archive=Path('work/dataset-review/groundnut.tar.gz');z=tarfile.open(archive);arrays=[];labels=[];manifest=[];excluded=0;seen_images=set()
    for name in sorted(set(z.getnames())):
        if not name.endswith('_annotations.coco.json'):continue
        data=json.load(z.extractfile(name));folder=name.rsplit('/',1)[0];annotations=collections.defaultdict(list)
        for a in data['annotations']:annotations[a['image_id']].append(a)
        categories={c['id']:c['name'] for c in data['categories']}
        for item in data['images']:
            image_name=item['file_name'];match=re.search(r'WIN_(\d{8})_',image_name)
            if not match:raise ValueError('Missing capture-date group')
            with Image.open(z.extractfile(folder+'/'+image_name)) as image:
                image=image.convert('RGB');digest=hashlib.sha256(image.tobytes()).hexdigest()
                if digest in seen_images:continue
                seen_images.add(digest)
                for a in annotations[item['id']]:
                    category=categories[a['category_id']]
                    if category not in ('with mold','without mold'):excluded+=1;continue
                    x,y,w,h=a['bbox'];box=(max(0,int(x)),max(0,int(y)),min(image.width,int(x+w)),min(image.height,int(y+h)))
                    if box[2]<=box[0] or box[3]<=box[1]:excluded+=1;continue
                    arrays.append(np.asarray(image.crop(box).resize((64,64))).copy());labels.append(int(category=='with mold'));manifest.append({'image':image_name,'capture_group':match[1],'annotation':a['id'],'label':category,'source_image_sha256':digest})
    dates=sorted({m['capture_group'] for m in manifest})
    if len(dates)<2:raise ValueError('Independent capture dates required')
    train_ids=[i for i,m in enumerate(manifest) if m['capture_group']!=dates[-1]];test_ids=[i for i,m in enumerate(manifest) if m['capture_group']==dates[-1]]
    for ids in [train_ids,test_ids]:
        if set(labels[i] for i in ids)!={0,1}:raise ValueError('Each date partition must contain both classes')
    for i,m in enumerate(manifest):m['split']='test' if m['capture_group']==dates[-1] else 'train'
    out=Path('work/models/groundnut');out.mkdir(parents=True,exist_ok=True);(out/'split-manifest.json').write_text(json.dumps(manifest,indent=2));x=torch.from_numpy(np.stack(arrays)).permute(0,3,1,2).contiguous();y=torch.tensor(labels)
    torch.set_num_threads(2);torch.manual_seed(26132);np.random.seed(26132);random.seed(26132);model=TomatoCNN(2);optim=torch.optim.AdamW(model.parameters(),lr=.001,weight_decay=.001);counts=torch.bincount(y[train_ids]);loss_fn=nn.CrossEntropyLoss(weight=counts.sum()/(2*counts.float()));history=[]
    print({'capture_dates':dates,'train_patches':len(train_ids),'test_patches':len(test_ids),'excluded_annotations':excluded},flush=True)
    # Six epochs chosen before accessing the holdout; no tuning or best-checkpoint selection on it.
    for epoch in range(6):
        model.train();ids=np.random.permutation(train_ids);loss_sum=0
        for pos in range(0,len(ids),64):
            batch=ids[pos:pos+64];inputs=x[batch].float()/255
            if random.random()<.5:inputs=inputs.flip(3)
            optim.zero_grad();loss=loss_fn(model(inputs),y[batch]);loss.backward();optim.step();loss_sum+=float(loss.detach())*len(batch)
        history.append({'epoch':epoch+1,'train_loss':loss_sum/len(ids)});print(history[-1],flush=True)
    artifact=out/'groundnut-cnn.pt';torch.save(model.state_dict(),artifact);truth=y[test_ids].numpy();pred=predict(model,x,test_ids).argmax(1);classes=['without mold','with mold']
    report={'task':'groundnut_annotated_patch_visible_mold_classification','source_url':'https://universe.roboflow.com/molds-onbk3/peanuts-mckge','download_mirror':'https://huggingface.co/datasets/Francesco/peanuts-sd4kf','licence':'CC BY 4.0 per original Roboflow project; retain source and mirror attribution','archive_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'classes':classes,'seed':26132,'split_policy':'Earlier capture dates train; latest entire capture date held out. All objects from an image stay together. Exact image duplicates removed. Original train/valid/test split not trusted.','capture_dates':dates,'test_date':dates[-1],'split_counts':{'train':len(train_ids),'test':len(test_ids)},'selected_by':'fixed six epochs; no holdout tuning','excluded_annotations':excluded,'history':history,'test_macro_f1':float(f1_score(truth,pred,average='macro',zero_division=0)),'classification_report':classification_report(truth,pred,target_names=classes,output_dict=True,zero_division=0),'confusion_matrix':confusion_matrix(truth,pred).tolist(),'artifact_sha256':hashlib.sha256(artifact.read_bytes()).hexdigest(),'status':'research_candidate_not_production_approved','limitations':['Classifies ground-truth bounding-box crops; does not locate peanuts in a full photo','Only two capture dates; physical specimen identity across dates is unknown','No Nagpur farm holdout or calibrated out-of-distribution detection','Visible mold label is not an aflatoxin or food-safety test']};(out/'evaluation.json').write_text(json.dumps(report,indent=2));print('Held-out macro F1:',report['test_macro_f1'],flush=True)
if __name__=='__main__':train()
