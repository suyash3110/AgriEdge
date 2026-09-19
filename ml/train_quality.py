"""Tomato appearance CNN candidate. Evaluation is not production approval."""
import argparse, hashlib, json, random, time
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps
import torch
from torch import nn
from sklearn.metrics import classification_report, confusion_matrix, f1_score
CLASSES=['Damaged','Old','Ripe','Unripe']
class TomatoCNN(nn.Module):
    def __init__(self, num_classes=4):
        super().__init__()
        self.layers=nn.Sequential(nn.Conv2d(3,16,3,padding=1),nn.ReLU(),nn.MaxPool2d(2),nn.Conv2d(16,32,3,padding=1),nn.ReLU(),nn.MaxPool2d(2),nn.Conv2d(32,64,3,padding=1),nn.ReLU(),nn.AdaptiveAvgPool2d((4,4)),nn.Flatten(),nn.Linear(1024,64),nn.ReLU(),nn.Dropout(.25),nn.Linear(64,num_classes))
    def forward(self,x): return self.layers(x)
def prepare(root, classes=CLASSES):
    paths=sorted(p for p in root.rglob('*') if p.suffix.lower() in ['.jpg','.jpeg','.png'] and p.parent.name in classes)
    parent=list(range(len(paths)))
    def find(a):
        while parent[a]!=a: parent[a]=parent[parent[a]];a=parent[a]
        return a
    seen_names,seen_pixels={},{};arrays=[];labels=[];valid=[];errors=[]
    for i,p in enumerate(paths):
        try:
            with Image.open(p) as im:
                im=ImageOps.exif_transpose(im).convert('RGB');a=np.asarray(im.resize((64,64)),dtype=np.uint8).copy();digest=hashlib.sha256(im.tobytes()+str(im.size).encode()).hexdigest()
            key=p.parent.name+'/'+p.stem.lower()
            for mapping,k in [(seen_names,key),(seen_pixels,digest)]:
                if k in mapping: parent[find(i)]=find(mapping[k])
                mapping[k]=i
            arrays.append(a);labels.append(classes.index(p.parent.name));valid.append(i)
        except Exception as e: errors.append({'path':str(p),'error':type(e).__name__})
    groups={}
    for idx,original in enumerate(valid): groups.setdefault(find(original),[]).append(idx)
    mixed={g for g,ids in groups.items() if len({labels[i] for i in ids})>1}
    splits=[[],[],[]];rng=random.Random(26132)
    for label in range(len(classes)):
        gs=[g for g,ids in groups.items() if g not in mixed and labels[ids[0]]==label]
        if len(gs)<4:raise ValueError('Insufficient independent groups per class')
        rng.shuffle(gs);a=int(.7*len(gs));b=int(.85*len(gs))
        for split,subset in enumerate([gs[:a],gs[a:b],gs[b:]]):
            for g in subset: splits[split].extend(groups[g])
    if any(len(s)<len(classes) for s in splits): raise ValueError('Insufficient independent groups')
    manifest=[{'path':str(paths[valid[i]].relative_to(root)),'group':find(valid[i]),'label':classes[labels[i]],'split':['train','validation','test'][split]} for split,ids in enumerate(splits) for i in ids]
    return torch.from_numpy(np.stack(arrays)).permute(0,3,1,2).contiguous(),torch.tensor(labels),splits,manifest,{'source_images':len(paths),'decoded_images':len(arrays),'independent_groups':len(groups),'conflicting_groups_excluded':len(mixed),'decode_errors':errors}
def predict(model,x,ids):
    model.eval();result=[]
    with torch.inference_mode():
        for start in range(0,len(ids),128):result.append(model(x[ids[start:start+128]].float()/255).softmax(1))
    return torch.cat(result).numpy()
def train(root,output,epochs,crop='tomato',classes=CLASSES,source_url='https://www.kaggle.com/datasets/enalis/tomatoes-dataset',licence='CC0: Public Domain'):
    torch.set_num_threads(2);torch.manual_seed(26132);np.random.seed(26132);random.seed(26132)
    out=Path(output);out.mkdir(parents=True,exist_ok=True);x,y,splits,manifest,review=prepare(Path(root),classes);print(json.dumps(review),flush=True)
    (out/'split-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
    model=TomatoCNN(len(classes));optim=torch.optim.AdamW(model.parameters(),lr=.001,weight_decay=.001);counts=torch.bincount(y[splits[0]],minlength=len(classes));loss_fn=nn.CrossEntropyLoss(weight=counts.sum()/(len(classes)*counts.float()));best=-1;history=[]
    for epoch in range(epochs):
        start=time.time();model.train();ids=np.random.permutation(splits[0]);total=0.
        for pos in range(0,len(ids),64):
            batch=ids[pos:pos+64];inputs=x[batch].float()/255
            if random.random()<.5: inputs=inputs.flip(3)
            optim.zero_grad();loss=loss_fn(model(inputs),y[batch]);loss.backward();optim.step();total+=float(loss.detach())*len(batch)
        score=float(f1_score(y[splits[1]].numpy(),predict(model,x,splits[1]).argmax(1),average='macro',zero_division=0));item={'epoch':epoch+1,'train_loss':total/len(ids),'validation_macro_f1':score,'seconds':round(time.time()-start,2)};history.append(item);print(json.dumps(item),flush=True)
        if score>best:best=score;torch.save(model.state_dict(),out/(crop+'-cnn.pt'))
    model.load_state_dict(torch.load(out/(crop+'-cnn.pt'),weights_only=True));truth=y[splits[2]].numpy();pred=predict(model,x,splits[2]).argmax(1)
    report={'task':crop+'_visual_appearance','source_url':source_url,'licence':licence,'classes':classes,'seed':26132,'model':'3 convolution layers, 64px RGB, trained from scratch','split_policy':'70/15/15 connected groups: same class+filename stem or identical decoded pixels stay together; original train/val folders not trusted','review':review,'split_counts':dict(zip(['train','validation','test'],map(len,splits))),'history':history,'selected_by':'validation macro F1 only','test_macro_f1':float(f1_score(truth,pred,average='macro',zero_division=0)),'classification_report':classification_report(truth,pred,target_names=classes,output_dict=True,zero_division=0),'confusion_matrix':confusion_matrix(truth,pred,labels=list(range(len(classes)))).tolist(),'artifact_sha256':hashlib.sha256((out/(crop+'-cnn.pt')).read_bytes()).hexdigest(),'status':'research_candidate_not_production_approved','limitations':['No external Nagpur farm holdout','No farm/batch identifiers; near-duplicates may remain beyond filename/exact-pixel grouping','No calibrated out-of-distribution detector','Appearance is not sale grade, moisture, chemical safety or food-safety certification','Only '+crop+' dataset image domain supported; field and bulk images need external validation']}
    (out/'evaluation.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print('Held-out macro F1:',report['test_macro_f1'],flush=True);return report
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--root',required=True);p.add_argument('--output',required=True);p.add_argument('--epochs',type=int,default=12);p.add_argument('--crop',default='tomato');p.add_argument('--classes',nargs='+',default=CLASSES);p.add_argument('--source-url',default='https://www.kaggle.com/datasets/enalis/tomatoes-dataset');p.add_argument('--licence',default='CC0: Public Domain');a=p.parse_args();train(a.root,a.output,a.epochs,a.crop,a.classes,a.source_url,a.licence)
