"""Prepare the user-selected GODL-India Kaggle history for Nagpur; preserve provenance."""
import csv,hashlib,json,math
from pathlib import Path
from decimal import Decimal,ROUND_HALF_UP
from datetime import date
import pyarrow.parquet as pq
import pyarrow.compute as pc
ALIASES={'wheat':'wheat','paddy(dhan)(common)':'paddy','paddy(dhan)(basmati)':'paddy','paddy':'paddy','maize':'maize','tomato':'tomato','onion':'onion','potato':'potato','mustard':'mustard','jowar(sorghum)':'sorghum','bengal gram(gram)(whole)':'gram','gram':'gram','groundnut':'groundnut'}
fields=['source','market','district','state','commodity','variety','observed_date','unit','min_price','modal_price','max_price']
source='Kaggle / Manas Khandelwal / data.gov.in / GODL-India'
root=Path('work/dataset-review');records={};conflicts=set();rejected=0;raw=[]
for year in [2024,2025,2026]:
    path=root/f'prices-{year}.download';raw.append({'path':path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
    for batch in pq.ParquetFile(path).iter_batches(batch_size=65536):
        mask=pc.and_(pc.equal(pc.utf8_lower(batch.column('District')),'nagpur'),pc.equal(pc.utf8_lower(batch.column('State')),'maharashtra'))
        for r in batch.filter(mask).to_pylist():
            crop=ALIASES.get(r['Commodity'].strip().lower())
            if not crop:continue
            try:
                when=date.fromisoformat(r['Arrival_Date'])
                values=[Decimal(str(r[k])).quantize(Decimal('.01'),rounding=ROUND_HALF_UP) for k in ['Min_Price','Modal_Price','Max_Price']]
                if when>date.today() or any(not v.is_finite() for v in values) or not Decimal(0)<values[0]<=values[1]<=values[2]<=Decimal('10000000'):raise ValueError()
                variety=(r['Variety'] or 'Unspecified')+' / '+(r['Grade'] or 'Unspecified')
                row=dict(zip(fields,[source,r['Market'],'Nagpur','Maharashtra',crop,variety,when.isoformat(),'quintal',*map(str,values)]))
                key=(crop,r['Market'],variety,when.isoformat())
                if key in records and records[key]!=row:conflicts.add(key)
                records[key]=row
            except (ValueError,ArithmeticError,TypeError):rejected+=1
    print('Read year',year,flush=True)
rows=[v for k,v in sorted(records.items()) if k not in conflicts]
if not rows:raise ValueError('No valid Nagpur observations')
output=root/'nagpur-prices.csv'
with output.open('w',newline='',encoding='utf-8') as f:
    writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(rows)
manifest={'review_status':'approved','source_url':'https://www.kaggle.com/datasets/khandelwalmanas/daily-commodity-prices-india','licence':'Government Open Data License - India (GODL-India)','licence_evidence':'Kaggle dataset description saved in priceView.json, referencing https://www.data.gov.in/Godl','retrieval_date':date.today().isoformat(),'geography':'Nagpur district, Maharashtra, India','task':'crop-market one-observation-ahead price regression','time_range':[min(r['observed_date'] for r in rows),max(r['observed_date'] for r in rows)],'transformations':['2024-2026 yearly Parquet files only','Filter State=Maharashtra and District=Nagpur','Explicit supported commodity aliases; do not substitute milled rice for paddy','Grade retained within variety to avoid blending grades','INR/quintal to two decimal places; exact duplicates removed; conflicting same-day keys excluded'],'limitations':['Historical data, not a live feed','Source attribution is not government endorsement','No completeness guarantee; irregular calendar gaps','Model review required before release'],'sha256':hashlib.sha256(output.read_bytes()).hexdigest(),'raw_files':raw,'rows':len(rows),'quarantined_invalid_rows':rejected,'conflicting_keys_excluded':len(conflicts)}
(root/'nagpur-price-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
latest={}
for r in rows:
    key=(r['commodity'],r['market'],r['variety']);latest.setdefault(key,[]).append(r)
recent=[r for series in latest.values() for r in sorted(series,key=lambda r:r['observed_date'])[-2:]]
with (root/'nagpur-public-prices.csv').open('w',newline='',encoding='utf-8') as f:
    writer=csv.DictWriter(f,fieldnames=fields);writer.writeheader();writer.writerows(recent)
print(json.dumps(manifest,indent=2))
