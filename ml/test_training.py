from train_forecast import chronological_features, train
import pytest

def test_features_contain_only_previous_observations():
    rows=[{"observed_date":f"2026-01-{i:02d}","modal_price":str(i*100)} for i in range(1,11)]
    x,y,dates=chronological_features(rows)
    assert x[0,0] == 700
    assert y[0] == 800
    rows[-1]["modal_price"]="999999"
    changed,_,_=chronological_features(rows)
    assert (x == changed).all()

def test_training_rejects_unreviewed_manifest(tmp_path):
    m=tmp_path/"manifest.json"
    m.write_text('{"review_status":"pending"}')
    with pytest.raises(ValueError,match="approved"):
        train("missing.csv",str(m),str(tmp_path/"out"))

