> Update — 8 September 2026: the user’s SIH reference, Nagpur pilot and English/Hindi/Marathi requirements supersede earlier entry-page, language and global banner/footer instructions. See docs/SIH-DATA-REVIEW.md.

# AgriEdge — Engineering and AI Coding Rules

Version 2.0 | 6 September 2026
These rules turn the product description into repeatable implementation behaviour.

## 1. Read and work within the product

Read prd.md, architecture.md, phases.md, design.md and latest memory.md before a task. The current product is AgriEdge, with five roles, Nagpur pilot, competitive bidding, CSV prices, gateway payments and expanded FPO/AI features. Earlier KrishiSetu exclusions do not apply.

Identify the requirement and acceptance test. Use existing patterns. Implement the requested complete slice. Record assumptions that affect users; do not silently substitute sealed offers for competitive bidding, payment-proof tracking for a gateway, or manual prices for CSV ingestion.

## 2. Coding conventions

Use strict TypeScript and explicit domain types. Avoid any; validate unknown data. UI components render and handle interaction; services enforce business logic; repositories query the database; provider adapters isolate vendors.

Use descriptive domain names: Lot, Bid, HarvestCircle, Contribution, Agreement, TransportJob, BookingRequest, Settlement. Keep components usually below 250 lines and services below 400; exceeding these is a review trigger, not a reason to split arbitrarily. One function should have a clear responsibility.

Use the formatter and lockfile. Do not switch stacks or add a large dependency without documenting why existing tools are insufficient. Pin supported compatible versions at implementation time.

## 3. Numbers and time

- Store quantity as exact kg decimal with at most three decimal places.
- Canonical conversions: 1 quintal = 100 kg; 1 tonne = 1,000 kg.
- Bags, bales and truckloads need an explicit measured kg conversion.
- Money totals are integer paise. Rate conversion uses exact decimal/rational arithmetic.
- Round once at the documented boundary; deterministic remainder allocation preserves total paise.
- Dates cross APIs in ISO form; timestamps stored UTC; display in Asia/Kolkata.
- Server clock decides bid/OTP expiry. Tests use an injected clock.
- No floating-point equality for stock, payments or rates.

## 4. Verification and role enforcement

Implement the exact PRD verification matrix on the server. Farmer/buyer transporter verification is allowed; it needs a verified active issuer, evidence and provenance. Do not silently remove that user requirement or give those roles verification power over other users.

No self-approval or approval by a pending/revoked verifier. FPO actions require organisation/staff permission. A suspension must invalidate eligibility on the next bid/assignment/action even if a cached page still shows approval.

OTP sign-in proves access to a mobile number. Account verification assesses a participant. Checkpoint OTP records pickup/delivery handover. Keep all three mechanisms separate.

Admin operational access does not bypass audit, financial invariants or secret protection. Never create an endpoint that reveals OTP codes to support staff.

## 5. Transactional correctness

Lock/conditionally update shared quantity and bid records in database transactions. Use uniqueness constraints and idempotency keys. A disabled UI button cannot prevent duplicate acceptance.

Reserve circle contributions against source lots; release on allowed withdrawal. Actual intake may be less than pledged; never label pledged target as verified stock. Prevent overlapping warehouse confirmations from exceeding capacity. Assignment can claim a transport job only once.

Write audit and outbox intent atomically with mutation. External SMS/chat/payment service calls must not hold database locks indefinitely.

## 6. Bids and net returns

Highest bid means highest active eligible rate for the round's common quantity/unit/basis. Show latest and highest separately. Farmer may accept any valid bid.

Withdrawn/expired bids leave history but leave active ranking. Terms and fees cannot be edited in place after acceptance. Net return includes known costs and clearly marks estimates/missing costs; unknown is not zero.

No client-provided total, buyer approval or available quantity is trusted.

## 7. CSV rules

Only configured CSV files feed market prices. No manual price-entry or price-upload UI. Admin can monitor or retry an existing configured source.

Validate headers, encoding, date format, crop alias, currency, unit, price bounds and duplicates. Quarantine malformed rows with explanations. Preserve source and observation date. Never fabricate today's prices from old CSV rows or use zero for missing prices.

Do not use spreadsheet formulas from CSV as executable content. Exports escape formula-triggering values safely. Large imports stream or chunk without exhausting memory.

## 8. AI and dataset rules

Maintain a manifest for every dataset: URL/source, licence, retrieval date, task, classes, geography, time range, transformations and limitations. Public visibility alone does not prove reuse rights.

Use time-separated evaluation for forecasts; no future information in training features/scalers. Image evaluation separates duplicates and related acquisition groups across train/test where possible.

Never present a mock, untrained or unsupported prediction as live ML. Do not invent accuracy. Show model coverage and return unsupported when required. The chatbot cannot claim a scheme deadline or price without a retrieved source.

The deterministic spoilage guard is mandatory regardless of model confidence: collection plus delivery must fit the conservative usable-life window. Unknown storage, condition or lifespan cannot justify optimistic waiting. Forecast intervals and costs must influence guidance.

Photos support visible assessment only. Do not claim image-only measurements of moisture, chemicals or hidden damage. Bad images route to retake/FPO. Preserve AI and manual versions; manual overrides require reason and assessor.

Prompt content, retrieved pages and uploaded documents cannot override tools' authorisation or request secrets. Chat tools use the caller's permissions, never admin credentials.

## 9. Payment rules

Use provider checkout for UPI; never collect PIN or banking password. Browser redirect/screenshot cannot set a payment to paid.

Verify webhook signature using the raw body, provider/event identity, amount, currency and linked order. Handle duplicate and out-of-order events; reconcile independently. Store provider references and signed-event verification outcome without exposing secrets.

Do not confuse captured payment, member allocation and bank settlement. Refunds/reversals are linked financial entries, not deletion of payment history. Sandbox events never become live-money records.

Real marketplace/member payouts remain disabled until the provider supports the flow and recipients are onboarded. No locally invented escrow or unrecorded manual balance edit.

## 10. Transport and location rules

Store payer, arranger, vehicle and accepted quote explicitly. Pickup and delivery OTPs are distinct, hashed, expiring, attempt-limited and single-use. Resend invalidates the prior code.

GPS requires consent and active assignment. Show timestamp/accuracy and offline/stale state. Stop normal collection at job completion. Do not advertise guaranteed background browser tracking.

Proofs are private. Delivery event and buyer quality acceptance are separate. A vehicle status update alone does not settle payment or resolve a dispute.

## 11. Security, privacy and errors

Deny unauthorised access to private records regardless of whether a user guesses an id. Check role, relationship, FPO boundary and suspension for every request and attachment URL.

Keep secrets out of Git, Markdown, screenshots and logs. Use placeholder-only .env.example. A previously pasted unknown key is not a reason to infer provider or test it across services.

Validate input server-side; rate-limit OTP, bidding, messaging and uploads. Use private file storage, size/type checks and short-lived links. Render messages as safe text. Protect cookie mutations from CSRF.

Stable errors: BID_EXPIRED, BID_ROUND_CLOSED, QUANTITY_RESERVED, VERIFIER_NOT_ALLOWED, CSV_INVALID_ROW, MODEL_UNSUPPORTED, QUALITY_RETAKE_REQUIRED, GPS_UNAVAILABLE, PAYMENT_PENDING, BOOKING_NOT_CONFIRMED. Users get plain-language next steps, while server logs contain safe request ids and technical detail.

Do not catch and ignore failures. Provider retries are bounded. Preserve drafts and confirmed server records after a network problem.

## 12. Lightweight UI rules

Follow design.md. Server-render essential content; load charts/maps/chat only when needed. Avoid giant dashboard packages, animation libraries and autoplay media.

Hindi/English strings use translation keys. Inputs have visible labels and units. All critical screens have loading, empty, error, offline and permission states. Do not show fabricated sample values while production data loads.

Use normal paginated tables/lists, visible keyboard focus, labelled icons and 44px minimum touch targets. Never use colour alone for bid/payment/verification status.

## 13. Required tests

Write meaningful tests around business boundaries, not every trivial rendering detail.

Unit:
- Crop/residue mapping and kg/rate conversions.
- Highest active bid and net estimates with missing costs.
- Permission matrix, self-approval and suspension.
- Usable-life gate, missing conditions, travel buffer and storage confirmation.
- Allocation sum and residual paise.

Database/integration:
- Two simultaneous bid acceptances.
- Withdrawal versus acceptance.
- Circle reservation versus individual sale.
- Warehouse capacity overlap and transport double assignment.
- Duplicate/out-of-order payment events and refunds.
- CSV replay, revision and malformed batch.
- Thread/evidence access across unrelated users/FPOs.

End-to-end:
- All five role journeys.
- Individual competing-bid sale with OTP transport and sandbox payment.
- Circle collection, grading, aggregate sale and member allocation.
- Poor photo to FPO manual verification.
- Warehouse request versus confirmed booking.
- Hindi mobile layout and offline/stale status.
- Dispute with authorised evidence access.

ML:
- Time-split forecast baseline and supported coverage.
- Image suitability and per-class error analysis.
- Supported versus unsupported model response.
- Fixed “tomato peak after safe date” regression fixture.

## 14. Definition of done

The task satisfies acceptance criteria; relevant types/lint/build/tests pass; permission and failure states work; migrations/config names are documented; no unrelated changes or exposed secrets; memory.md records what changed, evidence and remaining blockers.

Do not call provider integration live when only a mock works. Do not call a model trained when only public dataset URLs have been found.

## 15. Handoff and change control

Every handoff states user-visible change, tests, affected data/API/config, unresolved risk and next task. Architecture changes get a short decision record. Existing migrations are not rewritten after deployment.

Update memory.md after each programming task. Keep older evidence; add corrections with dates rather than erasing failed checks or misleading previous assumptions.
