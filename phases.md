> Update — 8 September 2026: the user’s SIH reference, Nagpur pilot and English/Hindi/Marathi requirements supersede earlier entry-page, language and global banner/footer instructions. See docs/SIH-DATA-REVIEW.md.

# AgriEdge — Implementation Roadmap

Version 2.0 | 6 September 2026
Build complete user journeys in stages. Every expanded feature remains in scope; staging determines order and evidence required, not permission to omit features.

## 1. Delivery modes

Hackathon: connected working journeys with fictional user records, supplied/public CSV, supported public-dataset model experiments, provider sandbox or clearly marked mock integrations. Do not advertise simulated output as a trained model or real payment.

Startup pilot: same journeys with verified participants, automated CSV sources, supported evaluated models, onboarded payment recipients, real OTP/provider services, reconciliation, recovery and field usability evidence.

No arbitrary completion dates are promised until team size and hackathon deadline are known. Track each checkbox only after demonstrated work.

## 2. Phase 0 — Approved scope and runnable data contracts

Outcome: implementation can begin without another broad questionnaire.

- [ ] Adopt AgriEdge, Rewa MP, five roles, ten crops plus residues and Hindi/English default.
- [ ] Turn PRD requirements into tracked feature ids and acceptance cases.
- [ ] Record exact verification authority and FPO staff scope.
- [ ] Define canonical CSV schema, crop aliases, quantity/rate conversions and fixture rows.
- [ ] Create provider interfaces and environment-variable names.
- [ ] Register dataset candidates, licences and supported crop/tasks before download/training.
- [ ] Record payment flow and provider capability checklist for later integration.
- [ ] Create a fictional demo script: farmer, second farmer, FPO, two buyers, transporter and admin.

Done when: product decisions in memory match all documents; no feature depends on an invented provider or dataset. Missing actual integration credentials do not block local implementation.

## 3. Phase 1 — Lightweight portal foundation

Outcome: deployed development portal with language switch and database-backed data.

- [ ] Scaffold web/worker/ML directories and strict types.
- [ ] Build simple shared header, navigation, forms, tables, badges and notices.
- [ ] Configure PostgreSQL, migrations, private storage abstraction and sample data.
- [ ] Implement error/request ids, secure environment validation and audit/outbox foundations.
- [ ] Add Hindi/English translation files and local formatting.
- [ ] Configure lint, types, tests, build and bundle-size report.
- [ ] Add local Docker setup and health checks.

Done when: clean checkout runs with documented commands; fictional data appears; no secret is required for mock mode; 360px navigation works.

## 4. Phase 2 — Five-role onboarding and verification

Outcome: all roles can sign in and carry out only permitted approvals.

- [ ] Phone OTP with mock inbox plus provider adapter, attempt limits and sessions.
- [ ] Farmer, FPO, buyer, transporter profiles and vehicle records.
- [ ] Admin verification for all four external roles.
- [ ] FPO verification for farmer/buyer/transporter.
- [ ] Farmer/buyer verification for transporter with evidence and issuer label.
- [ ] FPO staff roles, member consent and authority boundaries.
- [ ] Review/reject/revoke/suspend states and admin bootstrapping.
- [ ] Test self-approval, unverified issuer, cross-FPO access and suspended privileges.

Done when: entire permission matrix passes server-level tests; users cannot bypass it using direct API calls.

## 5. Phase 3 — CSV prices, produce and residue listing

Outcome: farmer reads dated market information and publishes a usable listing.

- [ ] Read configured CSV source; map headers, dates, units and crop aliases.
- [ ] Stage/validate/deduplicate/revise observations; record source/checksum.
- [ ] Admin import status and retry; no manual price-entry/upload screen.
- [ ] Farmer price table, optional trend and stale/missing states.
- [ ] Lot creation, photo handling, declared quality, kg conversion and readiness.
- [ ] Residue category with material/form/intended-use fields.
- [ ] Draft/publish/pause/withdraw and quantity ledger.
- [ ] Validate unsupported prices do not block residue trading.

Done when: CSV replay is idempotent; invalid rows have reasons; a residue lot and food lot both publish without fake price/model data.

## 6. Phase 4 — Buyer demand and live competitive bidding

Outcome: two buyers compete for one farmer's lot.

- [ ] Demand creation and explainable matching.
- [ ] Common full-lot bid basis, minimum increment and deadline.
- [ ] Latest/highest active bid, own rank and outbid notifications.
- [ ] Farmer comparison including costs, payment terms and missing estimates.
- [ ] Withdraw/reject/accept flows; farmer can choose any valid bid.
- [ ] Atomic acceptance, quantity commitment, agreement snapshot and outbox.
- [ ] Cursor polling with refresh/reconnect and lightweight UI.
- [ ] Race tests: simultaneous acceptance, withdrawal, bid after close and expired offer.

Done when: first offer keeps bidding open; higher bid is visible; exactly one agreement wins and no stock is oversold.

## 7. Phase 5 — FPO Harvest Circle and collection

Outcome: small farmer contributions fulfil a buyer's larger demand.

- [ ] Implement the exact FPO sidebar and staff-dependent pages.
- [ ] FPO-managed circle from demand with target, grade, deadline and hub.
- [ ] Source-lot reservations and nearby discovery.
- [ ] Separate pledged target from physically accepted quantity.
- [ ] Collection intake, weight/grade, reject/reclassify and member receipt.
- [ ] Manual quality verification at FPO office with measurements/evidence.
- [ ] Aggregate compatible accepted stock into a bidding lot.
- [ ] Member consent, withdrawal/shortfall/cancellation and cost-allocation rules.
- [ ] Tests for double pledge, individual resale, shortfall and mixed grades.

Done when: member quantities are traceable from source through intake to aggregate sale; shortfall cannot silently become fulfilled.

## 8. Phase 6 — Warehouses and FPO inventory

Outcome: farmer requests storage; FPO confirms suitable capacity and tracks owned stock.

- [ ] FPO-managed facility and price schedule directory.
- [ ] Booking requests with crop, kg and date range.
- [ ] Review/confirm/reject with capacity conflict checks.
- [ ] Check-in/out, batch ownership, reservations and stock ledger.
- [ ] Transfers/losses/corrections with recorded reasons.
- [ ] Farmer booking/stock view and FPO inventory reports.
- [ ] Notification when requested suitable space becomes available.

Done when: request is visibly different from confirmation; overlapping bookings cannot overbook; stock remains tied to the farmer.

## 9. Phase 7 — Transport quotes, OTP and GPS

Outcome: assigned transporter completes a traceable handover.

- [ ] Job linked to agreement/circle, arranger, payer and vehicle requirements.
- [ ] Quote acceptance and atomic assignment.
- [ ] Capacity, schedule and cancellation checks.
- [ ] Pickup OTP to releasing party; separate delivery OTP to receiver.
- [ ] Pickup/delivery photos, weight slip and exceptions.
- [ ] Active-job GPS with consent, timestamp, accuracy and stale/offline state.
- [ ] Job earnings/payment-due view and relevant participant messages.
- [ ] Test wrong/expired/replayed OTP, reassignment and GPS denial.

Done when: authorised parties see the job route/status; browser limits are explicit; successful handover cannot be faked with reused OTP.

## 10. Phase 8 — UPI, payment ledger and settlement

Outcome: buyer pays through sandbox checkout and money records reconcile.

- [ ] Gateway interface and explicit mock/sandbox/live modes.
- [ ] Server-created order from immutable agreement.
- [ ] Hosted checkout and server-verified webhook.
- [ ] Event deduplication, reconciliation and pending/failure retry flow.
- [ ] Separate capture, member allocation and recipient settlement.
- [ ] Harvest Circle allocation by accepted quantity/grade and disclosed costs.
- [ ] Transport payable to agreed payer.
- [ ] Refund/reversal and receipt views.
- [ ] Test duplicate/out-of-order events, wrong amount, spoofed callback, fractional allocations and settlement failure.

Done when: sandbox journey is complete, ledger balances and duplicate callbacks cannot double-credit. Startup live-money gate separately requires selected provider, recipient onboarding and supported settlement capability.

## 11. Phase 9 — Messaging, notifications and disputes

Outcome: participants communicate and resolve an exception with evidence.

- [ ] Authorised lot enquiry and transaction/circle threads.
- [ ] Text/private attachments, unread status, reporting/blocking.
- [ ] In-app inbox for every PRD farmer/buyer notification.
- [ ] Worker delivery retry and optional SMS/push adapters.
- [ ] Nonurgent batching/preferences and event deduplication.
- [ ] Dispute statements, evidence, review/outcome and audit.
- [ ] Admin operational queues, reported-message review and scoped sensitive access.
- [ ] Test stranger/cross-FPO access and notification deep links.

Done when: users see only relevant private messages/evidence; an entire dispute can be demonstrated; critical notifications link to durable records.

## 12. Phase 10 — Official scheme catalogue and chatbot

Outcome: farmer discovers relevant scheme information and asks grounded questions.

- [ ] Catalogue central/MP schemes with official sources, links and checked dates.
- [ ] Search/filter/expiry/archive and relevance indicators.
- [ ] Chat provider adapter with mock mode and Hindi/English UI.
- [ ] Implement all nine assistant topics.
- [ ] Retrieve authorised prices, warehouse, circle, transport and scheme information.
- [ ] Source/date display, unsupported answers and confirmed action handoff.
- [ ] Rate limits, private-data filtering and prompt-injection tests.
- [ ] New/materially updated scheme notifications.

Done when: chatbot cannot invent a current price or private record; scheme entries have official links; no API key appears in client or documents. Exact provider key is requested only when connecting the chosen service.

## 13. Phase 11 — Price ML and safe selling policy

Outcome: supported crop/market forecasts produce usable-life-aware advice.

- [ ] Select licensed public historical dataset and coverage manifest.
- [ ] Clean aliases, missingness and chronological features.
- [ ] Train persistence/seasonal baseline and candidate ML.
- [ ] Evaluate per crop/market/horizon on held-out dates.
- [ ] Publish versioned model with intervals/limitations; unsupported fallback.
- [ ] Collect harvest date, condition, conservative shelf-life basis, transport time and confirmed storage.
- [ ] Deterministic safe-date filter before economic ranking.
- [ ] Net expected-return comparison and liquidity deadline.
- [ ] Test tomato day-7 peak versus day-3 usable deadline, uncertain storage and missing condition.
- [ ] Material forecast-change notification with anti-spam threshold.

Done when: evaluation is reproducible, no unsupported coverage claims, and every unsafe-date fixture rejects waiting. A model that fails evaluation remains demo/unsupported and does not block ordinary bidding.

## 14. Phase 12 — CNN quality with manual fallback

Outcome: suitable supported images receive an honest assessment; others reach FPO review.

- [ ] Dataset licence/task/crop audit and labelled supported subset.
- [ ] Train/test split excluding related duplicate images.
- [ ] Blur/lighting/framing suitability gate.
- [ ] Crop/visible-defect inference and confidence evaluation.
- [ ] Unsupported/low-quality retake and FPO-office referral.
- [ ] Manual override history, assessor/measurements and buyer display.
- [ ] Evaluate false acceptances and per-class performance.
- [ ] Test unseen crop, poor photo, non-crop image and ML outage.

Done when: no image-only moisture/chemical claim; unsupported crops remain manually serviceable; actual metrics and coverage are reported.

## 15. Phase 13 — Demonstration and startup hardening

Hackathon demonstration checklist:
- [ ] Run one individual sale with two competitive buyers.
- [ ] Run one multi-farmer circle with intake differences.
- [ ] Demonstrate residue buyer demand and lot.
- [ ] Submit and confirm a warehouse request.
- [ ] Demonstrate poor image → FPO verification.
- [ ] Show forecast whose future peak is rejected due to spoilage.
- [ ] Use chat with source-backed data and scheme link.
- [ ] Complete OTP/GPS transport and sandbox UPI.
- [ ] Open dispute and inspect admin audit/report.
- [ ] Show all five dashboards and notification inboxes.

Startup readiness checklist:
- [ ] Rewa users test Hindi forms on basic phones.
- [ ] Performance budgets measured and addressed.
- [ ] CSV source automation/freshness and recovery proven.
- [ ] Real OTP/payment provider credentials configured securely.
- [ ] Recipient settlement, refund and reconciliation rehearsed.
- [ ] Dataset/model quality reviewed for claimed coverage.
- [ ] Backup restoration and incident procedures exercised.
- [ ] Access control, attachment privacy and dependency checks pass.
- [ ] Scheme review ownership and support operations assigned.
- [ ] Pilot outcome metrics captured without fabricated gains.

Done when: demo evidence is repeatable and startup status accurately identifies any remaining integration/data gate.

## 16. Traceability and global completion rule

| Requirement | Phase |
|---|---|
| Five roles and verification | 2 |
| CSV-only prices and residue | 3 |
| Competitive bids | 4 |
| FPO/Harvest Circle/manual grading | 5 |
| Warehouses/inventory | 6 |
| Transport OTP/GPS | 7 |
| Gateway/member payments | 8 |
| Messages/notifications/disputes | 9 |
| Schemes/chatbot | 10 |
| Forecast and spoilage guard | 11 |
| CNN/manual fallback | 12 |
| Full demo and launch evidence | 13 |

A phase is Done only when its user flow and meaningful failure cases work, checks pass, data/config/migrations are documented and memory.md records evidence. A mock is a valid demo component only when labelled. It does not satisfy a production integration gate.

## Implementation evidence update — 6 September 2026

Application code now exists. See docs/ACCEPTANCE.md for feature-level evidence and docs/READINESS.md for gaps. The checkboxes above remain conservative: no whole phase is marked Done merely because a module, mock or menu page exists. Final test and runtime evidence is appended in memory.md.
