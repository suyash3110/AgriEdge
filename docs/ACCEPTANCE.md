# Acceptance evidence

Updated 8 September 2026. Test names and current test sources are the authority; this table does not turn untested requirements into completed work.

| Feature ID | Requirement | Evidence / status |
|---|---|---|
| AE-01 | Five roles and verification | 25 matrix cases, self-approval/pending/suspension/staff checks; five browser dashboards |
| AE-02 | Exact quantity and money | kg/gram conversion, rate total boundary, deterministic residual allocation |
| AE-03 | Produce and residue | Server validation and connected draft/publish flow; browser form preserves input after failure |
| AE-04 | CSV-only observations | Configured source parser; source/date display; replay test; revision archive; no manual price UI |
| AE-05 | Competitive bids | First bid keeps lot open; higher competing rate; seller may choose lower valid bid |
| AE-06 | Acceptance and withdrawal | Concurrent acceptances yield one agreement; withdrawal/acceptance race test |
| AE-07 | Circle reservation | Pledge reserves source stock; individual bid blocked against reserved quantity |
| AE-08 | Actual circle intake | Two-farmer test separates pledged/received/accepted weights and builds actual-backed aggregate |
| AE-09 | Member allocation | Net member shares plus disclosed costs equal captured amount exactly |
| AE-10 | Warehouse | Overlap confirmation race, check-in/loss/check-out zero-balance test |
| AE-11 | Transport | Browser-connected quote/assignment and distinct pickup/delivery OTP journey |
| AE-12 | GPS | Assigned-active-job permission check; browser consent/denied state; one-shot updates only |
| AE-13 | Payments | Mock capture and duplicate replay; wrong amount rejection; failed event cannot regress capture; full refund reversal |
| AE-14 | Privacy and messaging | Stranger thread mutation denied; evidence access relationship and file-signature tests; upload/download code |
| AE-15 | Disputes/admin review | Working open/resolve forms and audited reported-message endpoint; comprehensive lifecycle not fully tested |
| AE-16 | Schemes/help | Official-source directory and local conversational model with streamed answers; no external chatbot account |
| AE-17 | Forecast safety | Tomato day-7 peak excluded after day-3 usable life; missing conditions rejected |
| AE-18 | ML training boundary | Eight Python tests include chronological features, manifest approval, image-group separation and tampered-artifact rejection; four trained image research candidates, no production approval |
| AE-19 | Government-style UI | SIH landing/login in English, Hindi and Marathi; five Marathi role dashboards; Hindi/Marathi forms preserve original text and canonical values; 360px layout and voice fallback browser checks |
| AE-20 | Runtime/deployment | Production compilation/type checking; standalone packaging and browser verification tracked in memory.md |
| AE-21 | Security/dependencies | Same-origin checks, private no-store responses, opaque sessions, request limits; npm audit zero at last recorded scan |

## Test commands

- npm test: domain and embedded-PostgreSQL integration.
- npm run test:e2e: requires a running local app; tests the browser and HTTP boundaries.
- work/ml-venv/Scripts/python -m pytest ml -q: Python policy/training boundary.
- npm run typecheck, npm run lint, npm run build.
- node scripts/performance.mjs: synthetic cold-cache 360px, 4x CPU slowdown, 1.6 Mbps down, 150 ms latency; results saved to work/performance.json.

## Limits of the evidence

PGlite tests do not certify a managed PostgreSQL deployment under multi-process load. Mock payment tests do not certify UPI, real webhooks, refunds or recipient settlement. Screenshots do not replace regional field testing or a complete accessibility audit. Unavailable models are not counted as trained or accurate.


## Packaged build verification — 8 September 2026

- `npm run check`: TypeScript, ESLint, 47 domain/database tests and production standalone build passed.
- Playwright: all 9 tests passed against the packaged app, including three-language landing/login, five Marathi role dashboards, speech permission denial recovery and Marathi listing/search.
- Python: 8 tests passed; dependency consistency check passed. Offline inference smoke checks ran on one held-out image per supported image model; these are wiring checks, not accuracy estimates.
- Cold mobile synthetic performance: LCP 1,408 ms, total encoded transfer 336,017 bytes, JavaScript 177,306 bytes, no horizontal overflow. All configured budgets passed. Profile: Windows Edge, 360×800, 4× CPU slowdown, 150 ms latency, 1.6 Mbps download. This does not establish field performance.
- The selected translation dictionary now comes from the server, avoiding shipping all three interface dictionaries to every client.
- OTP/payment verification uses the local simulator. Live SMS delivery, bank settlement and real microphone recognition remain unverified.


## Photo grading and conversational assistant — 9 September 2026

The source now requires a private crop image when creating a listing. Supported image labels map to provisional A/B/C appearance grades; these are not newly trained certified grade labels. Buyers see the grade and its source. A farmer can request FPO review; authorized FPO staff can revise uncommitted stock, preserve assessment history and withdraw bids made against the previous grade. Unsupported crops remain pending physical assessment.

The supplied Gemini_Generated_Image_b0pi3wb0pi3wb0pi.png is now the homepage hero. The Page 1 / up to 20 records text was removed. Voice assistance uses a local Gemma-3-4B-it model with streamed answers and browser speech; typed input and explicit microphone/playback error recovery remain available. The smaller model was rejected after poor Hindi/Marathi answers. Excessive repetition penalties were also removed after they harmed Hindi fluency.

Final verification: full browser suite passed 13/13 (3.9 minutes). After the assistant model/prompt change, the strengthened three-language and streamed UI test passed again (47.2 seconds), and its actual answers were manually reviewed. TypeScript, lint, 47 domain/database tests, production build and 8 Python tests passed; the final prompt/context rebuild and focused lint also passed. The loopback model rejected an unauthenticated request with HTTP 401. Both Qwen candidates were rejected after semantic review, despite weak earlier tests passing. Gemma with relevant app and watering reference context produced correct answers to the checked questions. This small evaluation does not establish universal answer quality. Earlier mobile performance figures above predate these changes and are not measurements of this revision. Real microphone recognition on the farmer's device and regional field validation remain unverified.

Audio evidence: the headless Edge screenshot shows the explicit audio-playback error and Read aloud retry; it does not demonstrate audible speech. Mocked browser speech tests passed. Real microphone recognition and audible playback on the user device still require a device check.
