# Operations and deployment

## Local development

The embedded PostgreSQL/PGlite adapter is a single-process local convenience. The managed PostgreSQL adapter is selected whenever DATABASE_URL is configured. Do not run the independent worker against a shared embedded data directory.

Environment:
- APP_ENV=demo enables local test accounts and simulated providers. OTP/payment simulations are labelled at their action; the global demonstration banner was removed at the user’s request.
- APP_ENV=production enforces startup checks. This is not sufficient to certify provider integrations.
- APP_URL is the exact public origin used by CSRF checks.
- DATABASE_DIR optionally selects a separate local demo data directory.
- PRICE_CSV_URI is an operator-configured local CSV path. There is no user price editor/upload.
- PAYMENT_WEBHOOK_SECRET authenticates the local mock webhook test interface only.
- Real secrets belong in environment configuration, never Markdown, source, screenshots or logs.

Use .env.example for the complete configuration-name contract. Next.js loads local environment files. For CLI database operations, export DATABASE_URL in the shell before running Prisma.

## Managed PostgreSQL

1. Provision an isolated PostgreSQL database; configure DATABASE_URL.
2. Run npm ci and npm run db:generate.
3. Run npm run db:migrate. Never rewrite deployed migrations.
4. Seed fictional records only in an isolated demo database with APP_ENV=demo.
5. Run npm run build, then npm start.
6. Run npm run worker in a separate process with the same managed DATABASE_URL.

The worker processes durable outbox records and configured CSV retries. In-app notifications are written transactionally. External notification delivery and real-payment reconciliation still require provider implementation; an outbox status is not proof of SMS delivery or bank settlement.

## Docker configuration

Dockerfiles and compose.yaml are supplied. The Docker daemon was unavailable during implementation, so the image/compose workflow is not marked verified.

Set POSTGRES_PASSWORD and ML_SERVICE_TOKEN privately in your shell. Then:
- docker compose build
- docker compose up -d db
- docker compose run --rm web node node_modules/prisma/build/index.js migrate deploy
- docker compose run --rm web node dist/seed.mjs
- docker compose up -d

The supplied Compose environment is a local demo, bound to 127.0.0.1. Production requires separately reviewed environment, secret storage, HTTPS ingress and actual provider integrations.

## Files and CSV

Evidence accepts JPEG/PNG/PDF up to 5 MB. Upload and download check the current user's relationship to the referenced record. Files are served as attachments with private/no-store responses. Production uses S3-compatible private object storage when configured; that path still needs provider validation and malware/retention review.

CSV ingestion validates canonical headers, crop aliases, ISO dates, quintal units and positive ordered min/modal/max values. Invalid rows are quarantined with explanations. Checksums prevent replay. Raw CSV bytes are archived for revision traceability. Files over 20 MB must be split by the operator; large-scale streaming/staging remains a launch task.

## Recovery rehearsal

Before production, prove:
- Database backup restoration into an isolated environment.
- Attachment-reference integrity after restore.
- Idempotent replay of payment events and outbox work.
- Provider-side reconciliation after lost webhooks.
- Stock/ledger invariants after competing requests.
- Session and verification revocation effectiveness.
- Manual operating procedures for disputes and delivery exceptions.

No recovery drill or live-provider settlement is claimed in this implementation.

