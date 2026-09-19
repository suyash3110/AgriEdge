# SIH reference, language and training continuation — 8 September 2026

## Accepted changes to the original plans

The user's later SIH instructions supersede the earlier Rewa pilot, dashboard-first entry, two-language scope and global demonstration/footer requirements. The current pilot is Nagpur, Maharashtra. The public entry follows SIH Pics/Sign IN.pdf pages 1–2; role dashboards follow pages 3–4. English, Hindi and Marathi are supported. Global demonstration copy and the footer were removed; OTP and payment simulation remain clearly identified at the relevant action.

## Data review

User explicitly authorized downloading and training every supplied dataset on 8 September 2026 and permitted suitable alternatives. Public availability alone is not treated as proof of commercial licensing; the user's stated permission is recorded for supplied unknown-licence datasets.

| Requested crop/source | Review and implementation |
| --- | --- |
| [Price history](https://www.kaggle.com/datasets/khandelwalmanas/daily-commodity-prices-india) | Government Open Data Licence—India in source metadata. Prepared 9,261 valid Nagpur/Maharashtra observations from 2024-01-01 through 2026-04-20. Preserved market, variety/grade, dates, source and exact paise. Six of 100 series beat persistence on a chronological evaluation split. The other 94 are unsupported. Historical data is not a live September price feed. |
| [Tomato](https://www.kaggle.com/datasets/enalis/tomatoes-dataset) | CC0. Trained appearance CNN with damaged/old/ripe/unripe labels. Exact decoded duplicates and repeated filenames stay in one split. Held-out macro F1 0.857497. |
| [Potato](https://www.kaggle.com/datasets/filipemonteir/fresh-and-rotten-fruits-and-vegetables) | Source licence Unknown; user explicitly confirmed permission. Trained fresh/rotten potato subset. All lab lighting/angle views of a physical potato stay together; exact decoded duplicates removed. Held-out macro F1 0.894815. |
| [Paddy/rice supplied](https://www.kaggle.com/datasets/andiadityaa/rice-quality-parameter) | Downloaded all 225 photos. Archive contains no annotation files or class folders. Cannot infer ground-truth labels from descriptive website text. Retained for annotation, not silently treated as labelled data. |
| [Rice alternative](https://www.kaggle.com/datasets/cristhiansempertegui/dataset-de-arroz-peruano) | MIT per Kaggle metadata. Cristhian Sempertegui / Lambayeque mill, August–September 2023. Four milled-grain classes: entero (whole), mancha (stained), quebrado (broken), tiza (chalky). 6,599 source images; one unreadable image and 59 conflicting duplicate groups excluded. Held-out macro F1 0.730490. This is milled rice, not a field-paddy or whole-lot grade model. |
| [Wheat](https://www.kaggle.com/datasets/kushagra3204/wheat-plant-diseases) | CC0; plant disease/pest labels, not harvested-wheat quality. Metadata reviewed; not misrepresented as grain grading. |
| [Maize](https://www.kaggle.com/datasets/kaustavbiswal/maize-diseases) | CC BY-NC-SA 4.0; approximately 8.7 GB of plant disease data. Does not establish harvested-kernel quality. |
| [Onion](https://www.kaggle.com/datasets/ziya07/onion-seed-quality-dataset) | CC0; downloaded 10,000 seed-property records and associated images. Trained a separate tabular experiment excluding identifier and downstream germination outcome. Held-out macro F1 0.324704 versus majority 0.184274. Not an onion-bulb image classifier; not reliable enough for deployment. |
| [Mustard](https://data.mendeley.com/datasets/x7h34tkwcp/2) | CC BY 4.0; seed species identification, including mustard. No sound/damaged mustard grading labels. |
| [Sorghum](https://www.kaggle.com/competitions/sorghum-id-fgvc-9) | Cultivar identity competition, not grain-quality labels. Competition access/rules may require the user's account. |
| [Gram](https://www.kaggle.com/datasets/sashankgarg23/crop-images) | Apache 2.0; downloaded archive. Only 52 images across 52 crop identity categories; insufficient quality labels and independent samples. |
| [Groundnut](https://universe.roboflow.com/molds-onbk3/peanuts-mckge) | CC BY 4.0 per original project. Downloaded its RF100 copy from [Hugging Face](https://huggingface.co/datasets/Francesco/peanuts-sd4kf), with original COCO annotations, 387 photos and 19,350 peanut boxes. Training is specifically an annotated single-peanut patch classifier; it is not a full-photo detector. Original mixed image split is replaced by capture-date holdout. Held-out macro F1 0.956013; 11,250 training patches from 23 April 2022 and 8,100 held-out patches from 2 May 2022. Physical specimen identity across those dates is unknown. Final results are in work/models/groundnut/evaluation.json. |

The [GrainSet authors' dataset](https://grainnet.github.io/GrainSet.html) was investigated as an alternative for wheat, maize, sorghum and rice. The publication and current project page give different licensing statements; the preview download also failed here (API DNS failure / empty HTTP 202 page). It was not fabricated, downloaded through an access bypass, or counted as trained.

## Reproduction and evidence

Use ml/requirements-training.txt in a dedicated Python environment. CPU PyTorch 2.14.0, torchvision 0.29.0 and PyArrow 25.0.1 are training dependencies, separate from the small service requirements. Generated data/models are under ignored work/dataset-review and work/models, outside public assets and standalone packaging.

- ml/prepare_nagpur_prices.py filters and validates the yearly Parquet inputs and writes a checksum manifest and normalized CSV.
- ml/train_forecast.py performs chronological one-observation-ahead evaluation against persistence.
- ml/train_quality.py trains grouped image candidates; defaults reproduce tomato. CLI crop/classes/source/licence options support the rice alternative.
- ml/train_potato.py keeps physical-potato views together.
- ml/train_onion_seed.py evaluates the separate seed-property experiment.
- ml/train_groundnut.py holds out the latest entire capture date; six epochs are fixed before holdout evaluation.
- ml/predict_quality.py provides offline research inference with artifact checksum verification, supported-image/size checks and no automatic lot-grade write.
- Split manifests, confusion matrices, per-class metrics, model hashes and limitations accompany the candidates.

No Nagpur field holdout, calibrated image suitability/OOD detector, food-safety certification, or production approval is claimed. Uncalibrated softmax scores are not presented as reliable probabilities. Historical forecast residuals are descriptive, not calibrated future coverage intervals. Price intervals and profitable sale recommendations require further validation.

## Visual sources

- Header logo and hero: supplied files in SIH Pics, copied without alteration. The hero is the supplied Adobe Stock watermarked reference; a licensed original is still required for a public production release. No watermark was removed.
- Scheme field illustration: [Mihajlo Sivč / Unsplash](https://unsplash.com/photos/an-older-man-inspects-golden-wheat-in-a-vast-field-TP3bvMatFUc).
- Tractor illustration: [Hippopx source](https://www.hippopx.com/en/free-photo-jgsbo).
- Solar irrigation illustration: [CCAFS article](https://ccafs.cgiar.org/news/are-solar-powered-irrigation-systems-scalable-india), photo credited to A. Manik. Retain this attribution and confirm publication rights before external release.
- Scheme application links are official national portals and Maharashtra MahaDBT. Illustrative photos are not scheme endorsements or evidence of eligibility.

## Browser speech limits

Voice assistance uses the browser's speech recognition and speech synthesis, with en-IN, hi-IN or mr-IN selected explicitly. It is a guided service assistant with typed fallback. The UI explains browser-provider audio processing before microphone activation. Real recognition availability, microphone permission and installed local voices depend on the user's browser/device. Browser tests mock denied recognition; actual Marathi/Hindi audio field tests remain necessary.

## Connected image checks — 8 September 2026

The Quality Check screen now sends authenticated JPEG/PNG uploads to `/api/v1/quality-image`. The local Node runtime invokes the existing checksum-verified Python models for tomato, potato, milled rice or one groundnut kernel. Results are translated into the chosen interface language and displayed as advisory visible-appearance labels. They do not write a lot grade or certify food safety. These are the previously trained and evaluated artifacts above, not newly invented models or labels.

The endpoint enforces same-origin requests, sign-in, bounded JSON/image sizes, a two-request concurrency cap, 60-second subprocess timeout and private/no-store responses. Temporary image files are removed after inference. The image/manifest check is performed in Python. `npm start` and `npm run preview:nagpur` detect the prepared local virtual environment; other deployments must configure `ML_PYTHON` and `ML_PROJECT_ROOT` and supply model artifacts. Work/model files remain outside the public/static bundle.

The assistant now automatically requests spoken playback after answering, waits for delayed browser voice discovery, retains the active utterance, and reports playback/input failure. Typed questions and the Read aloud retry remain available. Guidance follows [browser voice discovery](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/voiceschanged_event) and [speech recognition support](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition). Device/browser language support and real microphone transcription still require field testing.


## 9 September grade and image update

The visible homepage now uses the user's SIH Pics/Gemini_Generated_Image_b0pi3wb0pi3wb0pi.png, copied unchanged to public/images/farmer-home.png. The old watermarked hero is no longer referenced by the landing page.

The trained class outputs now map to provisional A/B/C through lib/quality-grade.ts (ADR-023). The evaluated dataset tasks have not become certified grade datasets. Photo assessments are retained privately for listing/FPO review; the earlier temporary-only UI wiring description is superseded. Raw Python inference still returns the original class and no automatic grade; the server applies the disclosed rubric and records its provenance. Buyers see the latest grade/source, and FPO edits retain review history.
