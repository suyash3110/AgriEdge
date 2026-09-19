# Release readiness — updated 8 September 2026

## Verified implementation

The original folder contained six planning Markdown documents and no application. The current application uses Next.js 16.3.4, React 19.2.8, strict TypeScript, Prisma 7.10.0, PostgreSQL adapters, Tailwind, next-intl, Vitest, Playwright and a separate Python service. Exact resolved dependencies are locked.

The local application connects five roles to bidding, circle collection, storage, transport, simulated payment, notifications, private messaging and dispute records. It follows the supplied government-portal visual direction.

Recorded verification (8 September 2026):
- 47 TypeScript domain/database tests, 8 Python tests and all 9 browser tests passed.
- Production compilation, TypeScript checking and ESLint passed. The packaged Nagpur preview runs at http://127.0.0.1:3001 using `npm run preview:nagpur`.
- Browser checks cover three-language landing/login, all five Marathi role dashboards, Hindi/Marathi form validation and canonical values, voice permission fallback, access control and sale through simulated payment/OTP delivery.
- Desktop and 360px screenshots were inspected. Synthetic mobile performance: 1,408 ms LCP, 336,017 encoded bytes total, 177,306 script bytes, no horizontal overflow; all configured budgets passed. This is one local Windows Edge run, not Android field evidence.
- Four image research candidates have held-out evaluations and offline inference smoke checks. No model is approved for automatic lot grading.
- The user selected a zero-cost setup for now. Local OTP and payment simulators remain enabled; no external provider account is connected, real SMS is not sent and money is not moved.

## External launch gates — not complete

1. Select and implement the actual SMS OTP provider; test delivery, throttling, expiry, resend and sender registration.
2. Select an onboarded payment provider and implement hosted checkout, signed real-provider events, independent reconciliation, refunds, recipient onboarding and supported payouts. Current payment provider is a labelled local simulator.
3. Configure a current operational price feed. A licensed historical Nagpur source is now prepared (9,261 observations through April 2026); the fallback fixture CSV is still explicitly fictional.
4. Complete external field validation and production approval of the trained research candidates. Tomato, potato, rice, groundnut and price evaluations are available; other requested datasets require suitable quality labels or replacements. See SIH-DATA-REVIEW.md. No trained candidate is automatically approved for production.
5. Configure and test private production object storage, encryption policy, retention, backup and restoration.
6. Run PostgreSQL integration tests against the intended managed database and rehearse multi-process worker recovery. Local tests use embedded PostgreSQL; Docker daemon was not available during initial implementation.
7. Perform Hindi and Marathi field testing, accessibility review, basic-phone/slow-network performance measurement and operational support review before a pilot launch.
8. Provision hosting, HTTPS, secret management, monitoring and backup ownership. No external deployment has been performed.

## Remaining product work — not silently omitted

- The landing, login, role navigation, service labels/dialogs, schemes, guided voice help and loading/error views now have Hindi and Marathi translations. Audit remaining dynamically generated server notices and operator records; obtain regional language review. User-entered text, record identifiers and technical audit codes preserve their original content.
- Expand profile crop editing, multi-organization staff/member lifecycle and staff revocation beyond the implemented grants.
- Complete member withdrawal/replacement/shortfall consent and aggregate cancellation/exception workflows for every lifecycle branch.
- Extend warehouse scheduling, transfers/reversing corrections and actual-intake weight controls beyond the implemented request/confirm/check-in/out/loss path.
- Complete transport scheduling/cancellation/reassignment, automatic consented foreground GPS sampling and separate transport payable settlement.
- Complete provider reconciliation, partial refunds, financially onboarded member payouts and settlement failure/reversal flows.
- Extend dispute statements/evidence history and comprehensive administrative moderation/role grants.
- Expand scheme catalogue coverage/review ownership and scheme-change notifications; current official-source directory is a starting set.
- Add calibrated image suitability/CNN inference, image-group evaluation and externally connected grounded chat.
- Expand list pagination, large CSV batch staging and full operational analytics beyond the implemented bounded views and exports.

These are implementation and release gaps, not merely missing credentials. The repository must not be represented as a fully production-ready application while these remain open.


## SIH continuation evidence

See SIH-DATA-REVIEW.md for actual sources, permission record, model limitations and assets. The current frontend removes the global demonstration banner/footer and uses the supplied new logo and first-page farmer reference. New browser checks cover all three landing/login languages, five Marathi role dashboards, speech permission fallback and canonical Marathi form submission. Final recheck results are appended to memory.md. The verification numbers above apply to the latest packaged build.


## 9 September follow-up

The new supplied Gemini farmer image replaces the former watermarked reference in the homepage component. Photo checks are now connected to new listing creation and yield disclosed provisional A/B/C grades; unsupported cases remain pending manual review. Authorized independent FPO assessment updates the buyer-visible grade while preserving history and invalidating bids on grade changes. The assistant now runs a free local conversational model instead of fixed keyword replies. See ADR-023/024 and the latest acceptance record. Earlier statements about offline-only model wiring and fixed-menu chat are superseded for this local build; field validation and broader production gates remain open.
