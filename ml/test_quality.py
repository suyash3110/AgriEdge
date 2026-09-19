import json
from pathlib import Path
import numpy as np
import pytest
pytest.importorskip('torch')
from PIL import Image
from train_quality import prepare, TomatoCNN
from predict_quality import infer

def test_grouped_split_keeps_repeated_images_together(tmp_path):
    rng=np.random.default_rng(42)
    for label in ['Damaged','Old','Ripe','Unripe']:
        for index in range(8):
            folder=tmp_path/'train'/label;folder.mkdir(parents=True,exist_ok=True)
            pixels=rng.integers(0,255,(70,70,3),dtype=np.uint8)
            Image.fromarray(pixels).save(folder/f'{index}.png')
            if index==0:
                repeated=tmp_path/'validation'/label;repeated.mkdir(parents=True,exist_ok=True)
                Image.fromarray(pixels).save(repeated/f'{index}.png')
    _,_,_,manifest,review=prepare(tmp_path)
    membership={}
    for row in manifest:membership.setdefault(row['group'],set()).add(row['split'])
    assert all(len(splits)==1 for splits in membership.values())
    assert review['independent_groups']==32
    assert {row['split'] for row in manifest}=={'train','validation','test'}

def test_insufficient_groups_are_rejected(tmp_path):
    for label in ['Damaged','Old','Ripe','Unripe']:
        folder=tmp_path/label;folder.mkdir()
        Image.new('RGB',(70,70),(10,20,30)).save(folder/'one.png')
    with pytest.raises(ValueError,match='Insufficient independent groups'):
        prepare(tmp_path)

def test_inference_refuses_unsupported_crop(tmp_path):
    with pytest.raises(ValueError,match='UNSUPPORTED_CROP'):
        infer('mustard',tmp_path/'missing.png',tmp_path)

def test_inference_rejects_tampered_artifact(tmp_path):
    image=tmp_path/'sample.png';Image.new('RGB',(70,70)).save(image)
    model=tmp_path/'tomato';model.mkdir();(model/'evaluation.json').write_text(json.dumps({'artifact_sha256':'incorrect'}));(model/'tomato-cnn.pt').write_bytes(b'not a trusted model')
    with pytest.raises(ValueError,match='ARTIFACT_CHECKSUM_MISMATCH'):
        infer('tomato',image,tmp_path)
