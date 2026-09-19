import csv,io,json,zipfile,hashlib
from pathlib import Path
import numpy as np
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.impute import SimpleImputer
from sklearn.pipeline import make_pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.dummy import DummyClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import f1_score,classification_report
import joblib
z=zipfile.ZipFile('work/dataset-review/onion-seed.zip');raw=z.read('onion_seed_quality_dataset.csv');rows=list(csv.DictReader(io.StringIO(raw.decode('utf-8',errors='replace'))));features=[k for k in rows[0] if k not in ('Seed_ID','Seed_Quality','Germination_Rate (%)')]
X=np.array([[r[k] for k in features] for r in rows],dtype=object);y=np.array([r['Seed_Quality'] for r in rows]);train,test=train_test_split(np.arange(len(rows)),test_size=.2,random_state=26132,stratify=y)
cat=[features.index('Seed_Color')];num=[i for i in range(len(features)) if i not in cat]
pre=ColumnTransformer([('numeric',SimpleImputer(strategy='median'),num),('categorical',OneHotEncoder(handle_unknown='ignore'),cat)])
model=make_pipeline(pre,RandomForestClassifier(n_estimators=150,min_samples_leaf=5,class_weight='balanced',random_state=26132,n_jobs=2));model.fit(X[train],y[train]);pred=model.predict(X[test]);baseline=DummyClassifier(strategy='most_frequent').fit(X[train],y[train]).predict(X[test]);score=float(f1_score(y[test],pred,average='macro'));base=float(f1_score(y[test],baseline,average='macro'))
out=Path('work/models/onion-seed');out.mkdir(parents=True,exist_ok=True);joblib.dump(model,out/'seed-properties.joblib')
report={'task':'onion_seed_properties_auxiliary_not_bulb_image_quality','source_url':'https://www.kaggle.com/datasets/ziya07/onion-seed-quality-dataset','source_sha256':hashlib.sha256(raw).hexdigest(),'licence':'CC0: Public Domain','rows':len(rows),'features':features,'excluded':['Seed_ID','Germination_Rate (%)'],'exclusion_reason':'Identifier and downstream germination outcome are excluded from predictors','split':'80/20 stratified by label with seed 26132; no provenance batch identifiers available','test_n':len(test),'test_macro_f1':score,'majority_macro_f1':base,'classification_report':classification_report(y[test],pred,output_dict=True,zero_division=0),'status':'research_auxiliary_not_production_approved','limitations':['Not an onion bulb image model','Dataset generation and external representativeness not established','No independent Nagpur field validation']};(out/'evaluation.json').write_text(json.dumps(report,indent=2));print(json.dumps({'rows':len(rows),'macro_f1':score,'baseline':base}))
