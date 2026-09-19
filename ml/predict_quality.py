"""Offline research inference. Never writes a lot grade or a production recommendation."""
import argparse, hashlib, json
from pathlib import Path
import numpy as np
from PIL import Image, ImageOps
import torch
from train_quality import TomatoCNN

def infer(crop, image_path, models_root):
    if crop == 'validate':
        with Image.open(image_path) as im:
            if im.format not in ('JPEG','PNG') or min(im.size)<64 or im.width*im.height>20_000_000:raise ValueError('UNSUPPORTED_IMAGE')
            im.verify()
        return {'status':'manual_pending','label':None,'grade':None}
    if crop not in ('tomato','potato','rice','groundnut'): raise ValueError('UNSUPPORTED_CROP')
    path=Path(image_path)
    if path.stat().st_size>5*1024*1024:raise ValueError('IMAGE_TOO_LARGE')
    directory=Path(models_root)/crop
    report=json.loads((directory/'evaluation.json').read_text())
    artifact=directory/(crop+'-cnn.pt')
    if hashlib.sha256(artifact.read_bytes()).hexdigest()!=report['artifact_sha256']:raise ValueError('ARTIFACT_CHECKSUM_MISMATCH')
    Image.MAX_IMAGE_PIXELS=20_000_000
    with Image.open(path) as im:
        if im.format not in ('JPEG','PNG') or min(im.size)<(16 if crop=='groundnut' else 64) or im.width*im.height>20_000_000:raise ValueError('UNSUPPORTED_IMAGE')
        pixels=np.asarray(ImageOps.exif_transpose(im).convert('RGB').resize((64,64)),dtype=np.float32).copy()/255
    torch.set_num_threads(2);model=TomatoCNN(len(report["classes"]))
    model.load_state_dict(torch.load(artifact,map_location='cpu',weights_only=True));model.eval()
    with torch.inference_mode():scores=model(torch.from_numpy(pixels).permute(2,0,1).unsqueeze(0)).softmax(1)[0].tolist()
    return {'status':'research_only','crop':crop,'label':report['classes'][int(np.argmax(scores))],'scores':dict(zip(report['classes'],scores)),'scores_are_calibrated_probabilities':False,'grade':None,'limitations':report['limitations'],'artifact_sha256':report['artifact_sha256']}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--crop',required=True);p.add_argument('--image',required=True);p.add_argument('--models-root',default='work/models');a=p.parse_args();print(json.dumps(infer(a.crop,a.image,a.models_root),indent=2))
