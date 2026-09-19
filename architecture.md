> Update — 8 September 2026: the user’s SIH reference, Nagpur pilot and English/Hindi/Marathi requirements supersede earlier entry-page, language and global banner/footer instructions. See docs/SIH-DATA-REVIEW.md.

# AgriEdge — Technical Architecture

Version 2.0 | 6 September 2026
Read alongside prd.md. This is a proposed implementation blueprint; it does not describe an already deployed system.

## 1. Structure in plain language

The browser shows screens. The application server checks permissions and business rules. PostgreSQL stores authoritative records. A background worker processes CSV files, notifications and reconciliation. A separate Python service runs price and image models. External providers supply OTP, chatbot, maps and payment functions through replaceable adapters.

Use a modular monolith for trading and operations, plus an isolated ML service. This keeps one reliable transaction boundary for bids, reservations and allocations without forcing Python models into the web runtime.

## 2. Technology decisions

| Area | Choice | Boundary |
|---|---|---|
| Web | Next.js App Router, React, strict TypeScript | Responsive PWA and HTTP API |
| Styling | Tailwind, selected accessible headless primitives | No heavy template/dashboard dependency |
| Forms | React Hook Form + Zod | Server repeats validation |
| Database | PostgreSQL + Prisma | Durable business truth |
| Authentication | Server-managed opaque sessions and OTP adapter | HTTP-only secure session cookies; hashed tokens |
| Jobs | PostgreSQL-backed queue, e.g. pg-boss | Independently running worker |
| Files | S3-compatible private object storage | Signed uploads/downloads |
| ML | Python, FastAPI, scikit-learn; PyTorch for CNN | Versioned internal inference API |
| Localisation | next-intl | Hindi/English messages |
| Tests | Vitest, Testing Library, Playwright, pytest | Domain, database and complete journeys |
| Deployment | Docker web/worker/ML; managed PostgreSQL | Replaceable hosting |
| Realtime | Incremental polling first; optional event-stream adapter | Durable records survive disconnect |

At implementation kickoff select supported compatible versions, verify official documentation, and lock dependencies. Do not assume a major version from these documents is permanently current. No provider is selected by an unidentified key.

## 3. Repository

~~~text
app/[locale]/             pages and layouts
app/api/v1/               thin HTTP handlers
components/ui/            accessible shared controls
components/features/      domain display components
modules/auth/             sessions and OTP
modules/verification/     role-dependent approvals
modules/markets/          CSV observations
modules/lots/             supply and quantity reservations
modules/bids/              bidding rounds and agreements
modules/circles/           member contributions
modules/fpo/              staff and collection
modules/warehouses/       requests and capacity
modules/inventory/        stock ledger
modules/transport/        jobs, checkpoints and GPS
modules/payments/         orders, events, ledger, settlement
modules/messaging/        authorised threads
modules/notifications/    inbox and delivery
modules/schemes/          official-source catalogue
modules/disputes/         evidence and resolution
modules/ai/               permissions and model/chat adapters
lib/providers/            external provider implementations
worker/                   scheduled and asynchronous jobs
ml/                       datasets manifests, training, evaluation, API
prisma/                   schema and migrations
messages/                 translations
tests/                    integration and end-to-end tests
docs/                     decisions and operation guides
~~~

Handlers authenticate → validate → call domain service → return safe DTO. Repositories handle queries. UI never imports the ORM. ML cannot directly alter a bid, transaction, stock record or payment.

## 4. Domain entities and constraints

Common fields: UUID id, creation/update timestamps in UTC, actor where needed. Format local dates in Asia/Kolkata. Quantity: Decimal(18,3) kg; allow only supported precision. Monetary totals: bigint paise. Unit rates use exact decimal paise per quoted unit; round once at documented total/allocation boundary.

| Entities | Key data and constraints |
|---|---|
| User, Session, RoleMembership | Phone, active role, verification/suspension; opaque session token hash |
| Fpo, FpoStaff, FpoMember | Organisation membership, staff permission grants, farmer consent |
| VerificationCase, VerificationDecision | Subject, evidence, issuer role, status, expiry; no self-approval |
| Commodity, ResidueType | Canonical crop, aliases, category and supported units |
| Market, CsvSource, ImportBatch, PriceObservation | File checksum, source, market/date/unit/variety, original row reference |
| Lot, LotPhoto, QuantityReservation | Owner, crop/category, ready date, total kg, active reserved kg |
| QualityAssessment | Declared/measured/AI/manual, grade, evidence, assessor/model version |
| BuyerDemand, BidRound, Bid | Required basis, full-lot quantity, exact rate, costs, terms, deadline |
| SaleAgreement, FulfilmentEvent | Frozen accepted terms, parties and separate fulfilment lifecycle |
| HarvestCircle, Contribution | Demand, FPO, pledged/received/accepted kg, member consent |
| Warehouse, PriceSchedule, BookingRequest | Crop/type, price basis, date range, status and capacity |
| InventoryBatch, StockMovement | Farmer ownership, location and append-only in/out/loss ledger |
| Vehicle, TransportJob, JobQuote | Capacity, arranger, payer, accepted quote, assigned transporter |
| CheckpointChallenge, JobEvidence, LocationPing | Bound action OTP hash, time/accuracy/consent |
| PaymentOrder, PaymentAttempt, ProviderEvent | Unique provider reference/event id and verified status |
| LedgerEntry, MemberAllocation, Settlement, Refund | Source funds, payee, balanced entries and reconciliation |
| Thread, ThreadMember, Message, Attachment | Explicit membership, report state and attachment visibility |
| Notification, DeliveryAttempt | Event id, recipient, channel, preference and retry |
| Scheme, SchemeRevision | Official URL, applicable region, last reviewed, validity |
| Forecast, ModelVersion, DatasetManifest | Coverage, training cutoff, horizon, intervals and evaluation |
| Dispute, DisputeEvent, AuditEvent | Parties, evidence, immutable decision/event history |

Use foreign keys, unique event ids, positive quantity constraints and indexed relations. Ownership and permissions must not depend solely on a UUID being difficult to guess.

## 5. Quantity, inventory and financial invariants

Available listing kg = listed kg minus active reservations and committed/dispatched portions according to lifecycle. Maintain an explicit reservation ledger, not independent unchecked totals.

Circle pledge reserves its source lot. Intake records actual accepted weight. Sellable aggregate is backed by accepted compatible stock, except clearly marked pre-harvest agreements with their own commitment rules deferred from initial bidding. Rejection releases or reclassifies quantity through a recorded movement.

Inventory balances derive from immutable movements. Corrections create reversing entries; never silently replace history. One stock batch cannot be committed to two lots or dispatched twice.

A payment is never inferred from a message/photo. Unique provider events and ledger references prevent duplicate credits. Allocations sum exactly to distributable money, with a deterministic residual-paise rule.

## 6. Bidding and concurrency

Bids use the published round's full quantity, delivery basis and unit. Different terms are labelled and compared separately for net estimates. Public highest bid is highest active valid rate on the common bid basis.

In one database transaction: lock bid round/lot reservation → validate seller authority, buyer approval, bid validity and deadline → create unique accepted agreement → commit quantity → close round/remaining bids → write audit and outbox event.

Use consistent lock order and bounded retries for serialization/deadlock conflicts. Require idempotency key scoped to actor/action. Acceptance and bid withdrawal both lock the relevant bid/round. The losing request gets a conflict response and refreshed state.

A submitted bid remains durable if notification delivery fails. Broadcast/poll only after commit.

## 7. State models

Account verification: pending → approved/rejected; approved → expired/revoked. Suspension is a separate account state.

Lot: draft → open ↔ paused → committed → fulfilled; open/paused → withdrawn/expired. Bidding ends at commitment.

Bid: active → accepted/rejected/withdrawn/expired. Accepted cannot return to active after payment cancellation without a new reviewed round.

Circle: forming → target_pledged → collecting → ready → committed → dispatched → settled; shortfall/review/cancelled branches record participant outcomes.

Booking: requested → reviewed → confirmed/rejected → checked_in → checked_out; cancellation depends on prior state.

Transport: open → quoted → assigned → pickup_scheduled → picked_up → in_transit → delivered → closed. Failed delivery/cancelled are explicit exceptions.

Separate agreement fulfilment from money:
- Fulfilment: accepted → pickup_scheduled → picked_up → delivered → inspected → completed/cancelled.
- Payment: unpaid → pending → authorised/captured or failed → partially_refunded/refunded.
- Settlement: pending → processing → settled/failed/reversed.
- Dispute: open → awaiting_response → under_review → resolved → closed.

A dispute overlays the lifecycle instead of destroying the last valid fulfilment/payment state. Completion requires fulfilment and the payment condition in accepted terms; settlement remains independently visible.

## 8. CSV-only price pipeline

Input is a configured local/object-storage CSV path or approved remote CSV URL. There is no manual price editor or application upload page. Developers/operators configure source files outside the UI; admin sees import status and may retry a configured source.

Pipeline: locate versioned file → record checksum/source → map columns → parse dates/units/aliases → validate → stage → reject/quarantine invalid rows → atomic approved batch merge → record freshness and counts.

Canonical columns: source, market, district, state, commodity, variety, observed_date, unit, min_price, modal_price, max_price. Missing optional fields remain null. Currency/unit/date format belong to source configuration, never guessed from a value.

Deduplicate by source/market/commodity/variety/date/unit plus revision strategy. Preserve changed source rows as revisions. Store raw file location/checksum for traceability. Validate negative prices and min/modal/max ordering. Do not replace missing observations with zero.

No CSV is configured yet. Ship labelled sample fixtures for the hackathon; production displays unavailable/stale if feed fails. Record market coverage instead of fabricating Rewa-specific prices.

## 9. AI and ML boundary

Chat adapter accepts a constrained prompt, current user context and permitted retrieval tools. Tools return only authorised fields. Scheme/price responses include evidence references and dates; missing evidence results in an explicit limitation.

Price training runs offline on versioned CSV data. Split by time and keep preprocessing inside the training fold. Compare persistence/seasonal baseline with candidate ML; publish only supported crop-market-horizon combinations. Store dataset licence, cutoff, metrics, uncertainty and model artifact checksum.

Prediction service returns estimates only. A deterministic policy service evaluates usable-life deadline, dispatch/travel buffer, confirmed storage, costs and liquidity requirement. It can reject every waiting date even if model prices rise. Keep the reason codes and inputs for audit.

CNN pipeline validates upload → evaluates suitability → checks supported crop/task → infers visible traits → returns calibrated/validated confidence and referral flag. Manual verification remains available across all commodities. Training datasets must match the actual harvested produce task.

Model artifacts are deployed versions, never downloaded from arbitrary user URLs or hot-swapped by prompts. Set inference timeouts and maximum image size. On failure, preserve trading and manual quality workflows.

## 10. Payment architecture

PaymentGateway interface: createOrder, fetchPayment, verifyWebhook, requestRefund, fetchSettlement; recipient onboarding and split settlement capabilities are optional explicitly advertised features.

Order price/payee comes from frozen agreement, not client amount. Use hosted provider checkout. Verify signed callback against raw payload, provider event identity and order/currency/amount. Persist event before processing; maintain reconciliation jobs when callbacks are missed or out of order.

Browser success screen only triggers a refresh. Screenshot/proof is supporting evidence, not authority to set captured/settled.

Sandbox/mock/live modes are separate. Fail production startup if payment mock is enabled for live money. Recipient eligibility and provider support must be confirmed before activating real member payouts. No invented local escrow.

## 11. Transport, GPS and messaging

Store arranger and payer separately on job. Vehicle capacity check applies to total job kg and any constraints, such as compatible loading. Assignment uses an atomic claim so two transporters cannot accept the same job.

OTP challenges bind job, action, recipient, expiry and attempt count; consume in same transaction as checkpoint event. Reissue invalidates previous challenge. An exception procedure requires FPO/admin reason and evidence and is labelled as an override.

Browser GPS default while active: configurable 30-second interval, movement threshold and backoff. Store time, accuracy and consent. Participants see authorised route only during the job; stale data is clearly marked. No claim of reliable background browser tracking.

Messages and inbox are persisted in PostgreSQL. Initial lightweight polling uses cursors, pauses when tab hidden and backs off on idle. Replaceable push/event-stream service may be added without changing membership rules. User input is plain text; uploads are private.

## 12. Representative API

All routes below are relative to /api/v1. Responses: {data, error, requestId}; errors have stable code and safe message. Paginate lists; enforce server limits.

~~~text
POST /auth/otp/request | /auth/otp/verify
POST /verification-cases
POST /verification-cases/:id/decisions
GET  /prices
GET  /admin/import-batches
POST /lots | /lots/:id/publish
POST /lots/:id/bids
POST /bids/:id/withdraw | /bids/:id/accept
POST /buyer-demands
POST /circles | /circles/:id/contributions
POST /circles/:id/intakes
POST /quality-assessments | /quality-assessments/:id/manual-review
GET  /warehouses
POST /warehouse-booking-requests
POST /bookings/:id/confirm
POST /inventory/movements
POST /transport-jobs | /transport-jobs/:id/quotes
POST /transport-jobs/:id/assign
POST /transport-jobs/:id/checkpoints | /transport-jobs/:id/locations
POST /agreements/:id/payment-orders
POST /webhooks/payments/:provider
GET  /agreements/:id/payment-status
POST /threads/:id/messages
GET  /notifications
POST /disputes
GET  /schemes | /forecasts
POST /assistant/messages
~~~

## 13. Permissions, reliability and deployment

Every request checks identity, role grant, approval/suspension, relationship to record, and action permission. FPO queries include organisation boundary. GPS, messages and evidence are protected on downloads as well as list screens.

Outbox pattern: save business event and job intent in one database transaction; worker publishes after commit. Retry with exponential backoff and maximum attempts, then operational queue. Idempotent handlers make replay safe.

Use separate development, staging and production databases/buckets. Encrypt traffic; secret manager for deployment; private uploads with size/type checks. Backups and restore rehearsal cover database and attachment references. Logs mask PII and never record OTPs or raw credentials.

Monitoring: CSV age/coverage, API failures, worker backlog, bid conflicts, GPS staleness, failed payments/reconciliation, allocation mismatch, model coverage/drift, notification failures.

## 14. Configuration contract

Documentation contains names only:

~~~dotenv
APP_ENV=
APP_URL=
DATABASE_URL=
SESSION_SECRET=
OTP_PROVIDER=mock
OTP_API_KEY=
OTP_SENDER_ID=
CHAT_PROVIDER=
CHAT_MODEL=
CHAT_API_KEY=
PRICE_CSV_URI=
PRICE_CSV_SCHEMA_VERSION=
OBJECT_STORAGE_ENDPOINT=
OBJECT_STORAGE_BUCKET=
OBJECT_STORAGE_ACCESS_KEY_ID=
OBJECT_STORAGE_SECRET_ACCESS_KEY=
PAYMENT_PROVIDER=mock
PAYMENT_MODE=sandbox
PAYMENT_PUBLIC_KEY=
PAYMENT_SECRET_KEY=
PAYMENT_WEBHOOK_SECRET=
MAPS_PROVIDER=
MAPS_API_KEY=
ML_SERVICE_URL=
ML_SERVICE_TOKEN=
~~~

Ask for provider name, official documentation and credentials through secure configuration when implementing that integration. Do not ask for every key upfront. Public browser map/payment identifiers may be exposed only when the provider explicitly designates them public and origin restrictions are set.
