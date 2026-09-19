> Update — 8 September 2026: the user’s SIH reference, Nagpur pilot and English/Hindi/Marathi requirements supersede earlier entry-page, language and global banner/footer instructions. See docs/SIH-DATA-REVIEW.md.

# AgriEdge — Product Requirements Document

Version: 2.0 | Updated: 6 September 2026 | Problem statement: 26132
Purpose: Explain what we are building, who uses it, and how we know it works.
This document replaces the earlier KrishiSetu scope. The expanded features below are part of AgriEdge.

## 1. Product and pilot

AgriEdge connects farmers, Farmer Producer Organisations (FPOs), buyers, transporters, and administrators. It helps people compare prices, combine small quantities, negotiate through competitive bids, arrange transport and storage, and complete traceable payments.

The first pilot is Nagpur, Maharashtra, India. The product serves a hackathon demonstration and later startup operation. These are different operating environments: a demonstration can use labelled fixtures and payment sandboxes; real transactions need verified participants, configured providers, and tested models.

Supported produce: wheat, paddy, maize, tomato, onion, potato, mustard, sorghum, gram, and groundnut. Paddy is unprocessed rice; do not silently substitute rice prices. Gram may be displayed as gram/chana and sorghum as sorghum/jowar, with one canonical identifier.

Residue is also a first-class listing category: straw, stalks, husks, and other crop residues. Buyers may include cattle rearers, biogas plants, and processors. Every residue listing states its source crop, material, intended use, loose/baled form, weight, availability, moisture if measured, and contamination information. Do not describe every residue as suitable cattle feed.

Assumed defaults, adjustable through configuration: Hindi and English; INR; kilograms as the internal quantity unit; Rewa district as the default search area; nearby Harvest Circle search within 25 km where coordinates exist. These are design defaults, not additional confirmed user decisions.

## 2. Main journeys

Individual sale: register → verification → list produce/residue → receive competing bids → compare earnings and terms → accept → arrange transport → verify pickup → deliver and inspect → pay through gateway → track settlement.

Group sale: buyer posts demand → FPO opens Harvest Circle → nearby farmers reserve contributions → FPO weighs and grades at collection hub → eligible quantity forms one lot → buyer agreement → transport → payment → member allocation and settlement.

Storage: search FPO-listed warehouses → compare cost and suitability → request space and dates → warehouse/FPO confirms capacity → check in → track inventory → check out.

These journeys must connect. A bid, transport job, warehouse record, invoice, payment, and dispute must link to the relevant lot or transaction.

## 3. Five roles and verification authority

| Role | Main responsibilities | May verify |
|---|---|---|
| Farmer | Own profile, crops, lots, bids, circles, bookings, evidence, payments and disputes | Transporters |
| FPO | Member support, aggregation, grading, hub, inventory, warehouse requests, transactions and staff | Farmers, buyers and transporters |
| Buyer | Demand, discovery, competitive bids, purchasing, delivery evidence and disputes | Transporters |
| Transporter | Vehicles, jobs, pickup/delivery evidence, GPS, earnings | No account-verification power |
| Admin | Platform-wide operational oversight, verification, configuration and investigations | Farmers, FPOs, buyers and transporters |

Verification is a recorded assessment, distinct from mobile OTP ownership, physical pickup confirmation, and provider financial onboarding.

Only an active, verified verifier may approve another user within its allowed scope. No self-verification; FPO staff need an explicit delegated permission. Farmer/buyer transporter approvals require an evidence checklist and are labelled with issuer type: “Verified by farmer,” “Verified by FPO,” etc. Never relabel community verification as government certification. Admin may review, revoke, or suspend with a recorded reason.

Verification states: pending, approved, rejected, expired, revoked. Suspension overrides active privileges regardless of previous approval. Do not allow circular unverified accounts to approve each other. Admin bootstraps the first verified FPOs/users.

## 4. Farmer requirements

- Create and maintain profile, mobile number, village, preferred language, crops and optional location.
- Create produce/residue drafts, upload photos, declare quality, specify quantity/unit, harvest date, availability dates and expected price.
- Publish, pause or withdraw an uncommitted lot; display available versus reserved quantity.
- View CSV-backed market observations and recent trends with dates, units and source.
- Receive and compare offers; accept or reject; keep the lot open after the first bid until acceptance, closure or expiry.
- Track transactions, pickup, delivery, quality evidence, payment and settlement.
- Join nearby Harvest Circles, track contribution status, withdraw before commitment and see personal allocations.
- Search warehouses, request storage, see confirmed booking and stock.
- Chat with authorised buyers, transporters and FPO staff; report/block messages.
- Use AI assistance, scheme discovery and perishable-aware selling guidance.
- Open/respond to disputes and verify transporters under the verification rules.

## 5. Buyer requirements and bidding

Verified buyers create demand with crop/residue category, quantity, quality, location, availability window and payment terms. They discover individual lots and Harvest Circles, place bids, withdraw active bids, track purchases, arrange/pay transport when agreed, submit delivery/quality evidence and participate in disputes.

Competitive bidding is required, not sealed bidding. An initial offer must not close the listing. Show the latest bid and highest active eligible bid; inform competing buyers when outbid.

For comparable bids use the same listed quantity, unit, grade basis, and delivery/payment terms. MVP lots and aggregated lots accept bids for the full offered lot quantity. Partial buyer orders require separately reserved child lots with independent bidding; never rank different quantities as though they were identical.

Default minimum increase: ₹1 per quintal equivalent, configurable per category. Validate using exact decimal/rational calculations. A later lower offer cannot be submitted as a higher bid. The current highest active bid may decrease after withdrawal; keep the audit history.

Show bidder aliases to competitors, exact price and own rank; hide competitor identity/contact. Seller sees verified buyer identity, payment terms, costs and all bids.

Farmer/FPO may accept any valid bid, including a lower one with better transport or payment terms. Show gross value, known farmer-paid costs, estimates, missing costs, and estimated net return. Do not call an incomplete-cost offer the “best profit.”

Acceptance requires a confirmation summary, locks quantity and closes the round atomically. Expired, withdrawn or suspended-buyer bids cannot win. A race between two acceptances creates only one agreement. Withdrawal and acceptance must resolve in server order. No automatic award; default bidding deadline has no automatic extension.

## 6. FPO requirements

The FPO sidebar must contain, in this order:

Dashboard; Farmers; Produce & Lots; Quality Verification; Harvest Circles; Collection Hub; Warehouse; Inventory; Buyer Demand; Transport; Transactions; Messages; Notifications; Reports & Analytics; FPO Staff.

- Dashboard: action queues, collection due, quality pending, circle shortfalls, storage requests, dispatch and payments.
- Farmers: enrol members with consent, support profiles and verify eligible accounts.
- Produce & Lots: create/manage authorised member or FPO lots, retaining actual farmer ownership.
- Quality Verification: review poor images, book manual office checks, record measurements, grade, photos, assessor and expiry.
- Harvest Circles: create/manage against buyer demand, recruit nearby contributions and track target/deadline.
- Collection Hub: record expected/received weight, rejected weight, grade, farmer receipt, packing and dispatch.
- Warehouse: maintain nearby facility details/prices and respond to booking requests with facility authority.
- Inventory: farmer-owned batches, bin/location, quantity, reservations, losses, transfers and release.
- Buyer Demand: discover/respond to demand and negotiate within recorded member authorisation.
- Transport: create/assign jobs and inspect pickup/delivery status.
- Transactions: agreements, gateway payments, member allocations and settlement records.
- Reports: sales, member quantities, earnings, losses, occupancy, outstanding payments and disputes; CSV exports.
- FPO Staff: manager, verifier, collection operator, warehouse operator and accountant permission sets. These are staff permissions under the FPO role, not extra public roles.

## 7. Harvest Circle rules

FPO manages every circle. Start from a buyer demand and specify crop/variety, compatible grade, target kg, minimum viable quantity, deadline, collection location and allocation rules.

Farmer pledges reserve quantity from a lot; the same quantity cannot be pledged/sold elsewhere. Track pledged, physically received, quality-accepted, rejected, committed and dispatched quantities separately. Reaching pledged target produces “target pledged”; reaching accepted target produces “ready for sale.” Do not confuse them.

Allow withdrawal before the stated contribution lock. After a buyer agreement, changes need an FPO-managed exception and affected-party consent. If target is missed, notify participants; FPO may request extension, seek replacements or propose a revised quantity to buyer and members. No silent substitution or forced sale.

Different grades are separate sub-lots unless the buyer accepts an explicit mixed-grade specification. Record farmer consent when FPO accepts a sale on their behalf.

Allocation uses actual accepted/dispatched member weights and agreed grade rates, then the pre-agreed member share of transport/handling. Show the calculation and rounding adjustment. Total member allocations plus disclosed costs must equal the allocatable received amount. Allocation on screen is not proof of bank settlement.

## 8. Transporter requirements

Transporters maintain profile, verification, vehicle type, registration evidence, capacity and availability. They see appropriate jobs, submit/accept quotes, see crop/quantity/pickup/destination after authorisation, verify pickup by OTP, upload evidence, share GPS, update status, confirm delivery with separate OTP/evidence, see earnings and message transaction participants.

Farmer or buyer can arrange/pay according to their agreement; FPO can coordinate authorised group sales. Store arranger and payer separately. Accepted quote records vehicle, route, capacity, fee, payer, schedule and cancellation terms.

Pickup and delivery OTPs are separate, short-lived, single-use and tied to job/action. Pickup OTP goes to releasing farmer/FPO; delivery OTP goes to receiving buyer/FPO. Never show the code to the transporter before verification.

GPS is shared only during assigned active jobs with participant consent. The PWA displays timestamp, accuracy and “last known” when tracking stops. Reliable background tracking on a locked phone is a future native-app capability; never promise continuous tracking from a browser.

## 9. Warehouses

FPOs list nearby warehouses with address, contact, authorised manager, storage type, supported commodities, price/unit/time basis, minimum charge, indicative capacity, facilities and last update.

Farmers submit quantity, crop, dates and requirements. States: requested → reviewed → confirmed/rejected → checked in → checked out; cancellation is available under recorded terms. Submission is not a confirmed slot. FPO checks capacity for overlapping dates before confirmation.

No separate warehouse-owner role in this release. Actual accepted stock creates inventory records; confirmed reservations and physical stock are different. AI guidance cannot assume storage exists merely because a directory listing appears.

## 10. AI assistant

Chat topics: crop information, CSV market prices, selling guidance, quality guidance, government schemes, warehouses, Harvest Circles, transport and platform help.

Use the user's later-selected chatbot provider through a replaceable adapter. Answers grounded in platform data display observation date and source. Scheme answers link to official entries. Private answers obey the same permissions as normal screens.

Default first release: Hindi/English text chat; voice can follow. Suggestions may prefill forms but require user confirmation before a sale, booking, payment or message. External pages and user messages are data, not instructions that can override system rules. No secret or identity-document content is sent to a model unnecessarily.

## 11. Price fluctuation and selling guidance

Use licensed/public historical datasets now and user datasets later. Market ingestion remains CSV-only. Do not promise a trained model for every crop merely because trading supports that crop.

For each crop/market with adequate data, show short-horizon price range, trend, forecast issue date, uncertainty and model version. Compare with simple baseline forecasts using time-based held-out data. Unsupported crop/market combinations show “prediction unavailable.”

Each recommendation needs harvest date, crop condition, conservative usable-life limit, expected collection/travel time and verified storage conditions if any. If missing, ask for the missing information or provide current-price comparison without a waiting recommendation.

Only consider sale dates whose collection AND delivery occur before the conservative usable-life deadline. Reduce remaining quantity for expected spoilage only when a validated estimate exists. Compare expected proceeds minus storage, handling, transport and disclosed loss assumptions. Waiting should only be suggested when the gain exceeds uncertainty/cost margin and the farmer's required payment deadline permits it.

Example: tomato usable-life deadline is day 3 and the model peaks on day 7. Day 7 is excluded even if its price is highest. A confirmed cold-storage booking can change the deadline only with an appropriate validated crop/storage rule.

Residue gets separate condition/storage rules; do not reuse food freshness models.

## 12. CNN image assessment

Run an image-suitability check before crop/defect assessment: blur, lighting, framing, crop identity and supported class. Poor/unsupported photos receive retake instructions or an FPO office referral.

Public datasets need licence/provenance review and crop/label relevance. A leaf disease dataset is not automatically a harvested-grain grading dataset. Start with supported subsets; other crops remain manually verified.

Output: visible characteristics, confidence/calibration status, model version, assessed date, limitations and evidence. A photograph cannot establish hidden moisture, pesticide residue, chemical contamination or internal condition without measurements. Use separate declared, measured, AI-assessed and FPO-verified fields.

Manual assessor records actual observations, measurements and reason for any override; preserve the previous result. Buyers see verification method. AI assessment never silently replaces an accepted transaction's agreed grade.

## 13. Schemes

Build a searchable catalogue intended to cover relevant central and Madhya Pradesh farmer schemes, with expansion across India. Do not claim completeness until an inventory audit demonstrates it.

Store eligibility, benefit summary, required documents, region, official application link, deadline if published, official source, last checked date and archive status. Filter using farmer profile, but label eligibility as indicative. Link to official applications; no direct application submission initially. Notify relevant farmers about newly verified or materially updated schemes.

## 14. Messaging and notifications

Private one-to-one or transaction/circle threads connect farmers, buyers, FPOs and transporters. Membership is checked on every read/write and attachment access. Before acceptance, allow controlled lot enquiries; exact farm address is shared only with authorised participants. Support text, compressed images, documents, unread counts, report/block and system events.

Farmer notifications: interested buyer, higher bid, nearby circle, target reached, transport assigned, pickup scheduled, delivered, quality verified, payment received/settled, new scheme, warehouse slot and material prediction change.
Buyer notifications: matching lot, new circle, outbid, offer accepted, assigned transport, pickup, arrival update and delivery.
FPO/transporter/admin notifications cover their pending verification, collection, booking, job, dispute and payment actions.

Use durable in-app inbox first; optional push/SMS adapters. Transaction/OTP alerts and marketing preferences are distinct. Do not spam every small forecast change; batch nonurgent events. “Payment received” requires verified financial event, not an uploaded screenshot.

## 15. UPI and payments

UPI/gateway payment is in scope. Hackathon uses provider sandbox or clearly labelled mock. Production uses an onboarded provider that supports the chosen marketplace/member settlement flow.

Create order server-side from the accepted agreement. Gateway checkout handles payment credentials. Server validates signed events and independently reconciles provider status. Track attempt, authorised/captured, failed, refund and recipient settlement separately.

Buyer payment success does not necessarily mean farmer bank settlement. Show both. Harvest Circle member payouts must use the provider's supported settlement mechanism and enrolled recipient references. No homemade escrow or collection of UPI PINs. Refunds link to original payment and reason; duplicates/out-of-order events do not duplicate money or allocations.

Transport is a separate payable linked to the job and agreed payer, unless a clearly itemised supported combined order is chosen.

## 16. Admin access

Admin can inspect and manage every operational module, user, lot, demand, bid, circle, quality review, warehouse, stock, transport job, payment, scheme, model status, dispute and report needed for operations. Support, verification, finance and super-admin permissions limit who can perform particular changes.

Sensitive documents, message investigations and GPS history require justified audited access. Admin cannot reveal OTPs, private provider secrets or UPI PINs, or silently edit payment history. Financial correction uses a compensating entry; moderation/revocation records reason and actor.

## 17. Release scope and acceptance

Hackathon acceptance includes all five roles and connected demonstrations of individual sale/bidding, circle aggregation, warehouse request, manual/AI quality paths, CSV prices, chat, prediction with spoilage guard, messaging, notifications, GPS/OTP transport, sandbox UPI and disputes. Models/provider calls may be unavailable and explicitly labelled; do not fabricate live success.

Startup launch additionally requires actual CSV feed automation, provider onboarding, real model validation, payment reconciliation, recovery tests, regional user testing and reviewed operations.

Key acceptance examples:
- Publishing a residue lot works without requiring a mandi price or unsupported model.
- A second buyer can outbid the first while the lot remains active.
- Farmer chooses a valid bid; concurrent acceptance cannot oversell.
- Contributions reserved in a circle cannot be sold individually.
- Poor image routes to FPO; manual result retains audit history.
- A price peak beyond usable life cannot produce a wait recommendation.
- Duplicate payment webhook cannot double-credit a member.
- GPS denied/offline shows a truthful unavailable state.
- Disallowed verifier cannot approve an account via API.
- Hindi forms work at 360px without heavy animations.

## 18. Success and exclusions

Measure time to first bid, valid bids per lot, accepted-to-completed ratio, farmer net proceeds, circle fulfilment, spoilage recorded, on-time pickup, payment-to-settlement delay, disputes, model error and user task success. Do not invent outcome percentages before baseline pilot measurement.

Outside current scope: lending/insurance issuance, autonomous sales by AI, self-operated escrow, universal image certification, guaranteed future prices, direct scheme application filing, native apps and nationwide production launch.

## 19. Reference sources

The official OGD mandi resource identifies CSV as a data format; availability of a particular automatic download still needs validation before implementation:
https://www.data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi

Scheme discovery/reference:
https://www.myscheme.gov.in/search/state/Madhya%2520Pradesh
https://cmhelpline.mp.gov.in/entitleDashboard.aspx

These are reference sources, not proof that integration credentials or bulk download permission have already been obtained.
