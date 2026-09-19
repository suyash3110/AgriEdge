# Zero-cost provider decision — 8 September 2026

The user requested a free setup now and deferred a better SMS provider. The working local preview therefore retains `APP_ENV=demo`, `OTP_PROVIDER=mock`, `PAYMENT_PROVIDER=mock` and `PAYMENT_MODE=sandbox`. No billing account, subscription or paid resource has been created. OTP codes are displayed in the local test inbox; payment actions simulate capture/refund and never transfer money. These boundaries are labelled where used, without restoring the removed global banner/footer.

This is not a free live SMS integration. Production authentication continues to fail closed when no implemented SMS provider is available. Merely changing provider environment variables does not implement an adapter.

Options checked against provider documentation:
- [Twilio trial](https://www.twilio.com/docs/usage/trials): limited 30-day trial with recipient/country restrictions; an account is required.
- [2Factor signup](https://2factor.in/v3/signup/): advertises a trial account; account access and provider conditions still apply.
- [Razorpay test mode](https://razorpay.com/docs/payments/dashboard/test-live-modes/?preferred-country=IN): uses simulated money and separate test credentials. It is not connected in this app.

Live-provider integration, signed event verification, reconciliation, refunds and settlement remain launch work. Keep future credentials in a private environment file, never in source control or chat. No unlimited free live SMS service was established by this review.
