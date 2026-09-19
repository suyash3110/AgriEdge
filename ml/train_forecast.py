"""Offline training, gated by an approved dataset manifest. Never trains on demo fixtures."""
import argparse
import csv
import hashlib
import json
from pathlib import Path
from datetime import date
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
import joblib

def chronological_features(rows):
    series = sorted(rows, key=lambda r: r["observed_date"])
    x, y, dates = [], [], []
    for i in range(7, len(series)):
        previous = [float(series[j]["modal_price"]) for j in range(i-7, i)]
        x.append([previous[-1], sum(previous)/7, min(previous), max(previous)])
        y.append(float(series[i]["modal_price"]))
        dates.append(series[i]["observed_date"])
    return np.asarray(x), np.asarray(y), dates

def train(csv_path, manifest_path, output):
    manifest = json.loads(Path(manifest_path).read_text(encoding="utf-8"))
    required = ["source_url","licence","licence_evidence","retrieval_date","geography","task","time_range","transformations","limitations","sha256"]
    if manifest.get("review_status") != "approved" or any(not manifest.get(k) for k in required):
        raise ValueError("An approved, complete dataset provenance and licence manifest is required")
    content = Path(csv_path).read_bytes()
    if hashlib.sha256(content).hexdigest() != manifest["sha256"]:
        raise ValueError("Dataset checksum does not match manifest")
    groups = {}
    for row in csv.DictReader(content.decode("utf-8-sig").splitlines()):
        if "fictional" in row.get("source","").lower():
            raise ValueError("Fictional fixtures cannot train a release model")
        date.fromisoformat(row["observed_date"])
        if row["unit"] != "quintal" or float(row["modal_price"]) <= 0:
            continue
        key = (row["commodity"],row["market"],row["district"],row["variety"])
        groups.setdefault(key,[]).append(row)
    output = Path(output)
    output.mkdir(parents=True,exist_ok=True)
    report = []
    for key, rows in groups.items():
        if len({r["observed_date"] for r in rows}) != len(rows):
            raise ValueError("Resolve duplicate/revised daily observations before training")
        if len(rows) < 120:
            report.append({"coverage":key,"status":"unsupported","reason":"fewer than 120 observations"})
            continue
        x, y, dates = chronological_features(rows)
        split = int(len(x)*0.8)
        model = RandomForestRegressor(n_estimators=100,max_depth=6,min_samples_leaf=3,random_state=26132,n_jobs=1)
        model.fit(x[:split],y[:split])
        predicted = model.predict(x[split:])
        baseline = x[split:,0]
        mae = float(mean_absolute_error(y[split:],predicted))
        baseline_mae = float(mean_absolute_error(y[split:],baseline))
        residual = float(np.quantile(np.abs(y[split:]-predicted),0.9))
        eligible = mae < baseline_mae
        item = {"coverage":key,"status":"candidate_passed" if eligible else "unsupported",
                "training_cutoff":dates[split-1],"test_start":dates[split],"test_end":dates[-1],
                "test_n":len(y)-split,"mae":mae,"persistence_mae":baseline_mae,
                "empirical_90_percent_absolute_error":residual,
                "limitations":["One-observation-ahead evaluation; not automatic production approval",
                    "No future rows used in lag features; irregular calendar gaps require review",
                    "Evaluation residual band is descriptive, not calibrated coverage"]}
        if eligible:
            name = hashlib.sha256("|".join(key).encode()).hexdigest()[:16]+".joblib"
            joblib.dump(model,output/name)
            item["artifact"] = name
            item["artifact_sha256"] = hashlib.sha256((output/name).read_bytes()).hexdigest()
        report.append(item)
    (output/"evaluation.json").write_text(json.dumps({"dataset":manifest,"results":report},indent=2),encoding="utf-8")
    return report

if __name__ == "__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--csv",required=True)
    parser.add_argument("--manifest",required=True)
    parser.add_argument("--output",required=True)
    args=parser.parse_args()
    train(args.csv,args.manifest,args.output)

