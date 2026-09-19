# AgriEdge

Independent agriculture-market portal for the Nagpur pilot. The interface follows the supplied lightweight government-portal design: navy service navigation, restrained green accents, labelled forms, tables and English/Hindi/Marathi navigation. It does not use a government emblem or claim government affiliation.

**Release status: working, tested local demonstration; not approved for live trading or real-money deployment.** A successful production build is not the same as completing the startup-launch gates. See `docs/READINESS.md`.

## Run locally

Use Node.js 24 LTS. No Docker, SMS credential or payment credential is needed for the local demonstration.

```powershell
cd D:\Desktop\AgriEdge
npm ci
npm run db:generate
npm run db:seed
npm run build
npm start
```

Open http://127.0.0.1:3000. For development, use `npm run dev` instead. Do not run two processes against the same embedded database directory. Use a managed PostgreSQL database for multiple application/worker processes.

The local database is persisted in `work/database`. Evidence is private under `work/private-files`. Do not put either directory in Git. Configuration names and placeholders are in `.env.example`; enter actual credentials only in a private environment file or secret manager.

## Fictional accounts

Choose an account on the sign-in page, request an OTP, then enter the short-lived code from the explicitly labelled demo inbox. No SMS is sent.

| Role | Mobile | Fictional identity |
|---|---|---|
| Farmer | 9000000001 | Ram Prasad |
| Farmer | 9000000002 | Savitri Devi |
| FPO | 9000000003 | Nagpur Kisan FPO |
| Buyer | 9000000004 | Vindhya Foods |
| Buyer | 9000000005 | Narmada Agro |
| Transporter | 9000000006 | Ravi Transport |
| Administrator | 9000000007 | Pilot Administrator |

New mobile numbers create pending accounts. Profile onboarding selects an external role; approval is enforced by the server. Demo OTPs and simulated payments are never production authentication or live-money evidence.

## Connected services

- Produce/residue drafts, publishing, pausing and withdrawal.
- Full-lot competitive bids, highest/latest distinction, seller choice, atomic acceptance, frozen agreements and stock commitments.
- FPO circles, consented reservations, actual intake/grade, aggregate lots and exact member allocation.
- Warehouse directory/request/confirmation, capacity checks, check-in/out and append-only stock-loss records.
- Transport quotes and assignment, separate expiring pickup/delivery OTPs, consented foreground location updates.
- Separate delivery inspection, mock payment capture, event replay handling, ledger reversals and settlement status.
- Role-dependent verification with evidence, FPO staff grants, private threads, reporting/blocking, notifications, disputes and audited reported-message review.
- Configured CSV ingestion with validation/quarantine, replay protection, source provenance, revisions and raw-file archive.
- Authorized evidence upload/download; official scheme links; rules-based help; honest model-unavailable/manual-review paths.

Some extended workflows remain incomplete; the readiness report lists them explicitly rather than treating menu availability as acceptance evidence.

## Verification

```powershell
npm run typecheck
npm run lint
npm test
npm run build
# Start the app in another terminal before browser tests:
npm run test:e2e
```

Playwright uses installed Microsoft Edge in headless mode. Override `E2E_BASE_URL` to test another local port. Screenshots and traces are saved under `work/screenshots` and `test-results`.

Optional Python service:

```powershell
python -m venv work/ml-venv
.\work\ml-venv\Scripts\python -m pip install -r ml/requirements.txt
.\work\ml-venv\Scripts\python -m pytest ml -q
```

See `docs/OPERATIONS.md` for PostgreSQL/Docker setup and `docs/ACCEPTANCE.md` for test coverage. Never mark all phases complete solely because a build succeeds.


## SIH Nagpur preview and model training

The prepared historical Nagpur CSV is available in this working folder. After `npm run build`, use `npm run preview:nagpur` to seed/use a separate local preview database and open http://127.0.0.1:3001. This launcher always uses local simulated providers and an isolated embedded database; it does not connect to managed production PostgreSQL. Stop it before starting another process on the same directory or rebuilding on Windows.

The landing page has the supplied farmer reference, historical market cards, national/Maharashtra scheme cards, and the new logo. Sign-in opens a separate login window. The interface supports English, Hindi and Marathi; browser voice assistance includes a typed fallback.

For reproducible CPU training, install `ml/requirements-training.txt`. Training scripts, exact dataset reviews, permission record, per-model limitations and asset sources are described in `docs/SIH-DATA-REVIEW.md`. Offline inference: `work/ml-venv/Scripts/python ml/predict_quality.py --crop tomato --image path/to/image.png`. This returns a research appearance label, never a certified lot grade.


### Photo grades and conversational voice help

New listings require a JPEG/PNG assessment. A/B/C grades are provisional appearance categories, with manual FPO review available from the listing. The original photo/model label and review history are retained; authorized FPO corrections update buyer-visible grades. Unsupported crops need manual inspection. See docs/DECISIONS.md for the rubric.

`npm run preview:nagpur` also starts the prepared free local assistant on loopback port 8089. Its Qwen3 model and llama.cpp runtime reside under ignored work/assistant; they are not bundled into public assets. The model answers typed or recognized speech questions with recent conversation context. Browser microphone permission and a suitable installed voice are needed for speech input/output. Other machines need the model/runtime files before this local assistant can run. See work/assistant/source.json for exact sources and hashes.
