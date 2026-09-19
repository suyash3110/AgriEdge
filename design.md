> Update — 8 September 2026: the user’s SIH reference, Nagpur pilot and English/Hindi/Marathi requirements supersede earlier entry-page, language and global banner/footer instructions. See docs/SIH-DATA-REVIEW.md.

# AgriEdge — Lightweight Portal Design

Version 2.0 | 6 September 2026
Goal: a simple public-service-style agricultural portal that people can use on basic phones and slow connections.

## 1. Visual direction

Use a clear header, service navigation, readable tables/forms, modest borders, concise notices and predictable pages. The look may draw on Indian government portals while remaining clearly branded AgriEdge. Do not use government emblems or claim official government affiliation.

Avoid large hero videos, animated backgrounds, carousels, decorative charts, glass effects and unnecessary illustrations. The farmer's crop, bids and next action matter more than visual decoration.

## 2. Design tokens

| Item | Default |
|---|---|
| Primary navy | #16324F — header, primary buttons |
| Agricultural green | #236B45 — positive status, selected controls |
| Page background | #F5F7F8 |
| Surface | #FFFFFF |
| Main text | #17212B |
| Secondary text | #475467 |
| Border | #D5DCE3 |
| Warning text | #8A4B08 on light amber |
| Error text | #B42318 on light red |
| Body | 16px, line-height 1.5–1.6 |
| Page title | 24px mobile, 28px desktop |
| Spacing | 4/8/12/16/24/32px |
| Corners | 4–6px |
| Touch target | Minimum 44 by 44px |
| Content width | Around 1180px maximum |

Use system fonts plus a small locally served Devanagari font subset when needed. Avoid loading multiple font families/weights. Check contrast for each actual combination. Icons always have text labels for important actions.

## 3. Shared page layout

Header: AgriEdge wordmark, “Agriculture market services,” language toggle and account menu.
Utility strip: pilot location Nagpur, Maharashtra; help; text-size/accessibility control if useful.
Navigation: role-specific sidebar on desktop and labelled collapsible menu on mobile.
Main area: breadcrumb, title, one main action, filters, content.
Footer: about AgriEdge, contact/help, privacy/terms and official source acknowledgements where used.

No implication that AgriEdge is a government department. Show “Hackathon demonstration — sample/sandbox data” persistently in demo environments.

Mobile starts at 360px. Farmer common actions may have a compact bottom bar: Home, Prices, Sell, Deals, More. Do not compress all FPO modules into bottom icons.

## 4. Navigation by role

Farmer: Dashboard, My Profile & Crops, Market Prices, My Lots, Buyer Offers, Harvest Circles, Quality Check, Warehouse, Transactions, Transport, AI Assistant, Government Schemes, Messages, Notifications, Disputes.

Buyer: Dashboard, Profile & Verification, Buyer Demand, Find Lots, Harvest Circles, My Bids, Transactions, Transport, Messages, Notifications, Disputes.

Transporter: Dashboard, Profile & Verification, Vehicles, Available Jobs, My Jobs, Earnings, Messages, Notifications.

FPO sidebar, exact order:
1. Dashboard
2. Farmers
3. Produce & Lots
4. Quality Verification
5. Harvest Circles
6. Collection Hub
7. Warehouse
8. Inventory
9. Buyer Demand
10. Transport
11. Transactions
12. Messages
13. Notifications
14. Reports & Analytics
15. FPO Staff

Admin: Overview, Users & Verification, Lots & Bids, Buyer Demand, FPOs & Circles, Quality, Warehouses & Inventory, Transport, Payments & Settlements, Schemes, CSV Imports, AI & Models, Disputes, Reported Messages, Notifications, Reports, Audit, Settings.

Modules hidden by staff permission do not become accessible through direct links.

## 5. Entry and verification flow

Choose Hindi/English → mobile number → OTP → role/profile → verification status.
Explain required documents next to upload controls, not in an unexplained error later.

Verification badge includes issuer and status: “Approved by FPO …”, “Transporter verified by buyer …”. Distinguish mobile verified, account approved, crop manually assessed and handover OTP verified.

A pending account can complete profile and permitted drafts but cannot bypass approved-only trading actions. Rejection shows reason and resubmission route.

## 6. Farmer home and prices

Home leads with pending actions: bid received, circle collection due, pickup due, payment pending. Below: “Sell produce,” “Sell residue,” watched crops and nearby demand.

Market page: crop/variety/market/date filters, current dataset date, min/modal/max prices, original unit and comparable unit if converted. Default to a readable table; optional small trend chart is loaded on demand with a table alternative.

Old data says “Latest available observation: [date]”; never “Live price” for daily/static CSV. Missing crop price says unavailable. Residue listings still work.

Prediction panel shows issue date, range, supported location, assumptions and permissible selling window. Explain “We cannot suggest waiting because your produce may not remain usable until then.” Do not show the distant peak as the primary suggested action.

## 7. Produce and residue listing

Short steps: category/crop → quantity and readiness → photos/quality → price/transport preferences → review.

Quantity includes unit and converted kg. Harvest/condition fields explain why they help safe selling guidance. Quality labels distinguish “Farmer declared,” “AI assessed” and “FPO verified.”

Residue fields replace irrelevant food grade controls with source crop, material, loose/baled form, weight, moisture if measured and intended use. Include an unknown option for unmeasured values.

Draft save is visible. Review shows exact quantity, location disclosure, photos and expected price. No sale happens until later acceptance.

## 8. Bid screens

Farmer lot detail shows “Bidding open,” latest bid, highest active bid, number of valid bidders and deadline. Full list shows buyer, rate, gross total, transport payer, payment timing, costs, net estimate and expiry.

Buyer screen shows highest active rate, own bid/rank and minimum next bid for the common basis. Hide competing identities. A successful bid says “Submitted; farmer has not accepted yet.”

Accept screen freezes quantity, chosen buyer, total, costs, arranger/payer and terms. Warn if another higher rate exists using factual wording, while allowing the farmer's choice. After acceptance, all participants see closed bidding.

If a race is lost, show “This lot was committed before your action completed” and refresh; do not imply success.

## 9. Harvest Circle and FPO collection

Circle card: crop, FPO, location, target, pledged kg, accepted kg, deadline and collection instructions. Use separately labelled progress bars or numeric rows; never one ambiguous progress percentage.

Join form selects source lot and quantity and explains the reservation. Contribution page shows personal pledged, received, accepted/rejected weight and allocation.

FPO hub screen supports farmer lookup, weigh-in, grading, accepted/rejected quantity and printable receipt. Final ready-for-sale summary lists grade groups and actual available stock.

Member statement displays weights × agreed rates, share of costs, final allocation, payment and settlement separately.

## 10. Quality flow

Photo guidance uses a few small examples: enough light, several angles, plain background, representative sample. Upload compresses while preserving enough detail for assessment.

Result types:
- Assessment available: supported traits, method, confidence when validated and limits.
- Photo needs improvement: specific reason and retake action.
- Unsupported/uncertain: “Visit FPO for manual verification” and nearby office/contact.
- Manual verification completed: assessor, date, measurements, grade and evidence.

Do not display a generic green “100% verified” badge for an AI classification.

## 11. Warehouse and inventory

Directory rows show location, storage type, suitable crops, price basis, minimum fee and updated date. Request form asks crop, quantity, dates and requirements.

Confirmation page initially says “Booking request sent.” Only a reviewed capacity confirmation says “Space confirmed.” Show request/booking reference, final price and contact.

FPO inventory uses filterable tables: owner farmer, batch, crop/grade, location, received, reserved, available, losses and dispatch. Stock changes require reason; previous movements remain visible.

## 12. Transport screens

Job detail shows pickup/destination, crop/residue, kg, vehicle requirements, arranger, payer, quote and timeline.

Pickup action requests OTP from the releasing party and photo/weight evidence. Delivery action uses a different OTP from receiver. Clarify that delivery confirmation and crop quality acceptance are separate.

Location sharing screen explains participants who can see it and when it stops. Keep map optional/lazy-loaded; text route and last update work without maps. Permission denied/stale GPS has a clear status. No false moving marker on a simulated route.

Earnings list distinguishes quoted, earned, payment pending and settled.

## 13. Payments and transaction detail

Shared agreement screen separates:
- Produce and accepted terms.
- Delivery/inspection timeline.
- Amount payable and payment attempts.
- Recipient/member settlement.
- Evidence and disputes.

“Pay with UPI” opens provider checkout. On return show “Checking payment” until server verification. Failed and pending attempts have safe retry instructions; do not encourage a second payment while the first remains unknown.

Sandbox UI visibly says no real money moves. Refunds show requested/processed status and reference. Member allocation table does not use “paid” until evidence supports settlement.

## 14. Chat, schemes and notifications

Messages are simple chronological threads with context link, participant list, unread count and report/block. On reconnect show queued/local draft versus server-delivered state.

AI chat offers nine topics: crops, prices, selling, quality, schemes, warehouses, Harvest Circle, transport and platform help. Answers show source/date and link to the related screen. Keep chat out of initial page bundle until opened.

Schemes: searchable list with central/MP filters, short eligibility/benefit summary, official link, deadline if known and checked date. “May be relevant” is preferable to an unverified entitlement claim.

Notification inbox groups unread and recent. Show event, crop/job, time and action link. Critical transaction events stand out through text and icon. Avoid scrolling news tickers and constant popups.

## 15. Admin and disputes

Admin pages favour tables and queues. Document/message/GPS investigation asks for a reason within the authorised workflow and logs access. Payment corrections display source event and adjustment history.

Dispute form asks transaction, category, explanation and evidence. Case page shows both parties' statements, current reviewer, history and recorded outcome. Do not promise recovery before a decision.

## 16. Performance and usability acceptance

Engineering budgets to test on a fixed mid-range Android/slow-4G profile:
- Initial non-map/non-chat route transfer target under 500 KB compressed.
- Initial route JavaScript target under 180 KB gzip, tracked in build report.
- Typical page requests paginated at 20 rows.
- Listing thumbnails around 50 KB where acceptable; full images fetched on demand.
- No video, animated background, automatic map or automatic chatbot load.
- Target LCP at or below 2.5 seconds under the documented test profile; report measured result, not assumed compliance.

All core flows work at 360px, 200% zoom, keyboard-only and Hindi text expansion. Test loading, empty, error, offline, stale, permission-denied and completed states. Preserve form input after recoverable failures. Do not cache private documents/messages in a shared public cache.
