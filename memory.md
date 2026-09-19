# AgriEdge — Project Memory and Handoff

Updated: 6 September 2026
Documentation version: 2.0
Actual status: planning documents updated. Application implementation, deployment, provider integration and trained models have not been verified.

## 1. Read this first

The product is AgriEdge, previously described as KrishiSetu. The user expanded the scope. Old exclusions of competitive bidding and gateway payments are superseded. Use the current six documents together.

Core journey: farmer/verified FPO lists produce or residue → competing buyers bid → seller selects → quantity committed → transporter hands over with OTP/GPS/evidence → gateway payment and settlement → dispute if needed.

Group journey: buyer demand → FPO Harvest Circle → member reservations → collection/grade → aggregate sale → member allocation/settlement.

## 2. Confirmed user decisions

| Topic | Confirmed choice |
|---|---|
| Product | AgriEdge |
| Purpose | Hackathon plus startup |
| Appearance | Lightweight Indian government-portal style |
| Pilot | Rewa, Madhya Pradesh |
| Roles | Farmer, FPO, Buyer, Transporter, Admin |
| Crops | Wheat, paddy, maize, tomato, onion, potato, mustard, sorghum, gram, groundnut |
| Extra category | Crop residues for cattle rearers, biogas plants and other suitable buyers |
| Sign-in | Mobile OTP, interpreted from yes to the proposed OTP question |
| Admin verification | Farmer, FPO, buyer, transporter |
| FPO verification | Farmer, buyer, transporter |
| Farmer/buyer verification | Transporter |
| Prices | CSV-only; user does not want manual data upload/entry |
| AI | Chatbot key later; public datasets initially, user datasets if needed |
| Price model | Best-time guidance must respect crop spoilage |
| Quality | CNN assessment and manual FPO office fallback |
| Harvest Circle | FPO managed, member contributions/quality/payment allocation |
| Bids | Open competitive higher bids until seller accepts |
| Warehouses | Information and booking requests |
| Transport | Pickup/delivery OTP, GPS; farmer/buyer coordinate arranger and payer |
| Schemes | Catalogue with official links |
| Payments | UPI/payment gateway |
| Stack | Easy-to-replace services and mocks for unavailable integrations |

## 3. Explicit defaults and interpretations

These are current design choices, not additional facts supplied by the user:
- Hindi and English first.
- Responsive PWA, Next.js/TypeScript/PostgreSQL and Python ML service.
- Configured CSV path/URL read by worker; no manual price UI. Actual CSV source/schema awaits provision.
- Full-lot comparable bids initially; split lots for partial buyer quantities.
- Bid increment default ₹1/quintal equivalent, configurable.
- Competing buyers see rate/alias, not identity; seller sees verified identity.
- FPO circle nearby default 25 km when coordinates exist.
- Farmer/buyer transporter approvals carry issuer labels and evidence.
- Public datasets support only validated model subsets; all listed crops still trade.
- Warehouse requests require reviewed confirmation, not instant booking.
- Sandbox/mock payments for demonstration; provider live settlement after onboarding.
- Optional location updates while PWA active; no guaranteed background tracking.
- Scheme coverage begins with relevant central/MP entries; no unsupported claim of completeness.
- No provider selected from the credential pasted in chat.

Adjust these through a documented decision if real pilot requirements differ. Ordinary implementation can proceed with these defaults.

## 4. Credential handling

A credential-like value was supplied in chat. Its provider and scope are unknown. It must not be copied to these documents, source code, logs, seed data or test output, and has not been used by this documentation task. If live, the owner should rotate it.

No actual keys are needed to write or begin local mock implementation. Request exact credentials at the integration phase through secure configuration:
- Chat: provider name, model, base URL if applicable, API credential.
- OTP: selected service credentials and sender configuration.
- Payments: provider, sandbox keys, webhook secret, account/recipient support.
- Maps: provider key if paid service is used.
- Hosting/database/storage: deployment credentials at deployment stage.

Use names defined in architecture.md. Do not ask for unrelated keys.

## 5. Progress

| Area | Status | Evidence |
|---|---|---|
| Six planning documents v2 | Prepared | outputs/prd.md, architecture.md, rules.md, phases.md, design.md, memory.md |
| App scaffold | Not verified / not started in this task | No build performed |
| Role implementation | Not started | Specification only |
| CSV dataset | Not supplied/configured | Reference source and schema defined |
| Chat provider | Not selected | Adapter contract only |
| Gateway | Not selected | Sandbox/live boundaries specified |
| ML datasets | Not selected/downloaded | Provenance and evaluation rules specified |
| Forecast/CNN training | Not started | No accuracy claimed |
| Deployment | Not performed | No live site claimed |

These documents are planning deliverables; do not infer software features are complete from a detailed description.

## 6. Decisions superseding v1

- ADR-001: Rename product to AgriEdge, five first-class roles.
- ADR-002: Enable competitive bidding; first offer does not close lot.
- ADR-003: UPI/gateway in scope; track payment capture and recipient settlement separately.
- ADR-004: FPO manages Harvest Circles and preserves member ownership/consent.
- ADR-005: CSV-only market ingestion, automated from configured source.
- ADR-006: Separate Python inference service; trading remains functional if it fails.
- ADR-007: Deterministic usable-life guard can overrule ML waiting advice.
- ADR-008: CNN results limited to visible supported properties; FPO manual fallback.
- ADR-009: Verification authority exactly follows user matrix, with provenance/audit.
- ADR-010: Government-style lightweight layout without claiming official affiliation.
- ADR-011: Warehouse requests and real inventory are separate states.
- ADR-012: GPS is job-scoped and truthful about browser limitations.

## 7. Data and provider dependencies

Actual CSV file/source and column definitions are still needed for real market observations. Until then use labelled fixtures. Determine whether the source is replaced on a schedule and how revisions are published.

Public ML datasets need task/licence review before use. No dataset has been demonstrated to cover all ten crops, Rewa forecasting and residue quality. The honest fallback is unsupported/manual, not invented predictions.

Choose a payment provider supporting the intended marketplace/recipient settlement before enabling live member payouts. Provider decision does not block ledger and sandbox adapter development.

Scheme catalogue needs an assigned reviewer and official source dates. No complete catalogue has been compiled in this task.

## 8. Required invariants for the next developer

- No double sale or double-reserved circle contribution.
- No bid acceptance after expiry/withdrawal/round close.
- No self-verification or approval by unverified issuer.
- No reuse of pickup code for delivery.
- No admin/browser payment-success override.
- No duplicate webhook double-credit.
- Member allocations preserve total paise.
- No storage recommendation from unconfirmed warehouse availability.
- No waiting beyond conservative usability including travel.
- No unsupported CNN grade presented as verified.
- No public/private cross-user attachment, message or GPS access.
- No stale CSV data labelled current/live.

## 9. Known bugs and debt

No software bugs verified because no application was tested in this task.

Open planning/integration dependencies are not evidence of working functionality:
- Concrete CSV source unavailable.
- Provider selection and credentials deferred to implementation.
- Model datasets/coverage/accuracy unverified.
- Exact crop-condition/storage rules need validated sources.
- Real settlement and operational support not configured.
- No deployment or performance measurements.

For each future issue record id, severity, reproduction, owner, impact, next action and regression test.

## 10. Verification record

2026-09-06: Documentation rewrite task. Verify six files exist, contain the AgriEdge title, retain all required role/features, have valid Markdown structure and contain no credential value. This is document validation, not software acceptance.

When application work begins record command, environment, pass/fail, relevant scenarios and unrun checks. Never write “all tests pass” without actual execution.

## 11. Next action

Begin Phase 0/1: create feature tickets, canonical fixture CSV and application scaffold using these contracts. Integration questions should be raised when the relevant provider is about to be connected, not as another broad questionnaire.

The user currently requested documents; no application deployment or live-money action has been performed.

## 12. Task log template

### YYYY-MM-DD — Task name

Status: In progress / Done / Blocked
Requirement and phase:
Owner:

Outcome:
- What a user can now do.

Changes:
- Important files, schema, endpoints and configuration names.

Verification:
- Exact checks and results.
- Manual roles, language, viewport and environment.

Decisions:
- What changed and why.

Remaining:
- Missing provider/data, unverified behaviour or known issue.

Next action:
- One concrete step.

## 13. Start and finish protocol

Start: read current documents, latest entries and existing changes; identify requirement; inspect implementation; choose meaningful checks.

Finish: review scope/diff, run relevant checks, update affected documentation, append an honest entry and state limitations. Do not erase prior evidence or reproduce secrets. A new session should be able to continue using this file without asking the user to repeat settled decisions.

### 2026-09-06 — Application implementation and verification

Status: Local implementation delivered in progress toward release; **not production-ready**. The earlier planning-only status above is superseded by this entry, while the original evidence is retained.

User-visible changes:
- Added the Next.js/React application with government-style navy/green portal layout, five roles, OTP demo sign-in, bilingual navigation/common labels, forms, notices and responsive service pages.
- Connected produce/residue drafts, publication, competitive bids, seller confirmation, agreements and transport requests.
- Added FPO circles with consented source reservations, actual intake/grade and aggregate stock; warehouse request/capacity/check-in/out/loss records.
- Added quotes/assignment, separate pickup/delivery OTPs, consented location updates, delivery inspection and labelled mock payment capture.
- Added exact allocations, financial event replay/refund handling, private conversations/evidence, notices, dispute records, verification decisions and audited message review.
- Added configured CSV ingestion and archive, official scheme links, rules-based help and unsupported-model fallback.
- Added a Python safety service and provenance-gated chronological forecast training pipeline. No trained CNN or validated forecast is claimed.

Data/API/config:
- Prisma schema and two SQL migrations under prisma/. Embedded PostgreSQL for single-process local demo; DATABASE_URL selects managed PostgreSQL.
- Named server-validated mutations under /api/v1/actions; auth, records, private files, reports, investigations, health and mock-webhook routes.
- Atomic audit/outbox, exact decimals/bigint, uniqueness/check/foreign-key constraints and scoped idempotency records.
- README.md, docs/ACCEPTANCE.md, docs/READINESS.md, docs/OPERATIONS.md and docs/DECISIONS.md explain commands, traceability and remaining work.
- Standalone build/start preparation; Dockerfiles/Compose supplied but not exercised because Docker daemon was unavailable.

Verification already executed:
- 47 Vitest domain/database tests passed, including multi-farmer allocation, acceptance races, capacity overlap, stock-loss/check-out, idempotency, refund reversal and refunded-state preservation.
- Four Python tests passed on the installed/locked virtual environment.
- Four Playwright browser tests passed on the initial application: five role dashboards, Hindi 360px no horizontal overflow, connected two-buyer sale/OTP transport/mock payment, API denial and form input preservation.
- Production builds and Prisma generation passed.
- npm audit: zero known vulnerabilities after specific deepmerge-ts/mysql2 overrides.
- Desktop/mobile screenshots were inspected.

Failures found and corrected (do not erase):
- Default npm cache was not writable; configured an ignored project-local cache.
- Initial Prisma release-candidate selection was replaced by matching stable 7.10.0 CLI/client.
- tsx failed on Windows OS user lookup; replaced script invocation with an esbuild runner.
- Local valid-origin comparison rejected 127.0.0.1; corrected to configured public origin while rejecting unrelated origins.
- Raw advisory-lock return type caused Prisma deserialization failure; selected a boolean result instead.
- Collection state blocked a second farmer before deadline; corrected collection-phase contributions.
- A cleanup typo caused a demand type-check failure; corrected before passing builds.
- Production-only next-intl configuration was missing after localization expansion; added the request config/plugin. Final packaged browser recheck follows below.
- Dynamic evidence path tracing included too much runtime content; added tracing exclusion/ignore and verified standalone/work is absent.
- An environment reset stopped server sessions and removed D-drive write permission. Permission was restored, source/artifacts were preserved.
- Refunded payment state could regress on another order request; now preserved and covered by regression assertion.

Remaining:
See docs/READINESS.md. Unselected OTP/payment/chat providers, actual CSV, licensed training datasets/models, full Hindi coverage, extended exception/admin workflows, real settlement/reconciliation, managed-PostgreSQL/worker recovery, field accessibility/performance and external deployment remain open. Do not mark every phase complete.

Next action:
Finish the final standalone browser/performance run, record its measured evidence, and leave a working local preview plus an accurate readiness handoff.


## Final local verification and Hindi dialog continuation — 6 September 2026

- Implemented Hindi shared service dialogs: titles, labels, static explanations, transaction amount explanations, consent checkboxes, enum display labels, common validation errors and saved-state notices.
- User-entered values and record option labels are never translated. English API enum values remain unchanged. Less common server errors keep their exact original explanation with a Hindi introduction.
- Dialog code is loaded on demand to preserve dashboard transfer budget.
- Added a real 360px Hindi form journey that intentionally triggers residue validation, verifies preserved input, corrects category and checks exact stored kg/paise/crop/category plus original Hindi user text.
- Latest production build passed; full typecheck and lint passed. Playwright: 5/5 passed against the packaged standalone app (24.7 seconds).
- Prior unchanged domain/database suite: 47/47 passed. Python service tests: 4/4 passed. Audit: zero known vulnerabilities in the recorded full dependency scan.
- Final performance at 10:40 UTC: LCP 2324 ms, total encoded transfer 178546 bytes, scripts 163017 bytes, 12 resources, no horizontal overflow. Profile: Edge 360x800, cold cache, 4x CPU, 1.6 Mbps down, 150 ms latency. All configured budgets passed; not a real Android field test.
- First measurement retry was rate-limited after repeated fictional-account test logins. Kept the OTP limit intact; made PERFORMANCE_PHONE configurable and measured with the second fictional farmer. Measurement now checks successful authentication and the dashboard heading before collecting results.
- Inspected final desktop and Hindi form screenshots.
- Current app preview: http://127.0.0.1:3001. Start command: node scripts/start.mjs --port 3001 --database-dir work/preview-database. Python service health on port 8000 reported healthy with forecast and quality explicitly unsupported.
- No external deployment or real-money readiness is claimed. docs/READINESS.md remains the open implementation/release checklist; original phase completion boxes remain conservative.


## 8 September 2026 — verified SIH/Nagpur continuation

Completed SIH landing and isolated login, five role layouts, English/Hindi/Marathi interface and guided voice fallback. Prepared 9,261 historical Nagpur price observations; trained tomato/potato/rice/groundnut image research candidates and six price-series candidates. Source/permission/evaluation limitations are in docs/SIH-DATA-REVIEW.md. Other supplied datasets are not falsely counted as trained crop-quality models.

Fixed telephone input semantics, client directive placement, cache lint exclusions and translation payload size. Only the selected interface dictionary now reaches the client. Final npm run check passed (47 tests, types, lint, packaged build); 9/9 browser tests passed; 8 Python tests and dependency check passed. Mobile synthetic result: 1,408 ms LCP, 336,017 bytes total, 177,306 script bytes, no overflow, all budgets passed. Four offline held-out-image inference smoke checks passed; these do not replace model evaluations or field validation.

User requested free providers now. Retained clearly labelled local OTP/payment simulators with no real SMS/money; no external account is connected. Trial options and remaining implementation are in docs/PROVIDERS.md. Preview command: npm run preview:nagpur (port 3001, isolated work/nagpur-preview database, historical CSV). Production gaps remain in docs/READINESS.md, including lifecycle branches, infrastructure and provider integrations.


## 9 September 2026 — photo grades, FPO appeals and local conversational voice

Replaced homepage hero with SIH Pics/Gemini_Generated_Image_b0pi3wb0pi3wb0pi.png. Removed Page 1 / up to 20 records text. New crop listings require an owner-bound, crop/category-matched private image assessment; server assigns provisional A/B/C appearance grade from supported trained classifier labels. Images are stored privately and access checked. Unsupported crops/residue use pending FPO assessment rather than fabricated model grades. Tomato, potato, milled rice and single-groundnut classifiers remain the four trained research artifacts; this is not training on certified A/B/C ground truth.

Farmer can appeal from listing. Authorized independent FPO can inspect and revise uncommitted stock; history retained, buyer sees source and revision, previous active bids withdrawn when grade changes. Required/mismatched/reused assessments and unauthorized/invalid regrades tested. Marathi filter now waits for hydration to avoid pre-hydration fill losing state.

Replaced fixed keyword assistant with free local Qwen3-4B-Instruct-2507 Q4_K_M, llama.cpp b10867. Runtime starts with app, loopback only, generated private API key, startup lock, no model web UI/agent/MCP tools. Browser receives streamed text and speaks completed answers, with typed fallback and explicit permission/playback recovery. Do not copy work/assistant/assistant.key to outputs. Model/source hashes in work/assistant/source.json. Rejected 1.7B candidate for poor language quality; reduced sampling temperature and removed repetition penalties after actual Hindi review. No promise of universal accuracy or live facts.

Full browser suite passed 13/13 (3.9m) before the final sampling adjustment. Python 8/8 passed again. Final production rebuild and focused multilingual assistant recheck are in progress. Preview startup is npm run preview:nagpur on port 3001; isolated verification database work/verification-final0909 was seeded with the historical price CSV. All broader production gaps remain in docs/READINESS.md; SMS/payments remain local simulations.


Assistant review correction: all functional checks passed, but Qwen3-4B still produced factually wrong Hindi (including an ice claim) and reversed morning/evening in a translation trial. Do not mark this model's Hindi quality accepted based on keyword tests. A Gemma-3-4B Q4_K_M candidate is downloading from ggml-org; expected SHA256 882e8d2db44dc554fb0ea5077cb7e4bc49e7342a1f0da57901c0802ea21a0863, size 2489757856. Gemma terms/notice saved under work/assistant. The Hindi assertion now requires evaporation/drying/moisture/absorption context and rejects the ice claim. Candidate must be evaluated before switching and final handoff must name the actual selected model.


Final 9 September outcome: Gemma-3-4B-it Q4_K_M selected; source.json updated, Qwen source retained in source-qwen4b.json. Exact model file SHA256 882e8d2db44dc554fb0ea5077cb7e4bc49e7342a1f0da57901c0802ea21a0863 verified. Actual-app Hindi now correctly explains less evaporation and root watering; Marathi correctly explains FPO review; English calculation and streamed browser reply passed. Final strengthened assistant test 1/1 passed (47.2s). Earlier complete suite 13/13 passed (3.9m); final build/types and focused lint passed after prompt/model change; domain tests 47/47 and Python 8/8 passed this turn. Model replacement affects chat only; grading flows unchanged. Grounded general watering facts include the UMN Extension source in route comments and DECISIONS.md. No two-pass translation pipeline was shipped. Browser microphone/speech mocks verify wiring, not the user's actual microphone. Final preview startup session 3657 on port3001; verify liveness if session is reset. Outputs refreshed with final evidence and non-secret source record. Broader production gaps remain open.
