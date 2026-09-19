# Implementation decisions

## ADR-013 — Embedded PostgreSQL for local demonstration

Docker CLI was present but its daemon was not running; PostgreSQL CLI was absent. PGlite provides a runnable local SQL database through Prisma. DATABASE_URL selects the normal PostgreSQL driver. This does not replace managed PostgreSQL for multi-process production.

## ADR-014 — Stable dependency selection

Next.js 16.3.4 and Prisma/client 7.10.0 were selected from package-registry results and checked through generation/build/tests. An initially selected Prisma release candidate was replaced. deepmerge-ts and mysql2 were overridden to patched versions after npm audit; generation and tests were rerun.

## ADR-015 — Consolidated mutation endpoint

The UI calls /api/v1/actions with a named action and validated payload. Domain modules own authorization and transactions. /api/v1/records serves bounded authorized DTOs. This consolidates the representative PRD HTTP routes without changing the domain rules.

## ADR-016 — Explicit unsupported provider/model states

No provider is inferred from an unidentified credential. Mock OTP/payment are labelled. The assistant currently uses visible records and fixed policy guidance. The ML service reports unsupported and provides a deterministic safe-window policy. The forecast training pipeline requires an approved, complete provenance manifest.

## ADR-017 — Local Windows script runner

The tsx launcher failed in this sandbox while querying operating-system user information. A small esbuild-based script runner compiles project TypeScript entry files to ignored work/runtime files and runs them with Node. Application TypeScript and normal builds remain unchanged.

## ADR-018 — Government-style visual identity

Navy header/sidebar, agricultural green accents, simple white surfaces, visible labels and tabular operational records implement design.md. The portal states that AgriEdge is independent and does not use government emblems.

## ADR-019 — Local files and authenticated evidence downloads

Demo evidence lives outside the public asset directory. Downloads use current session/record authorization rather than public permanent URLs. S3 integration is configuration-gated; live bucket validation remains pending.


## ADR-020 — SIH public entry and Nagpur pilot

Later user instructions override the initial dashboard-first entry and Rewa scope. The public page uses the supplied farmer reference, the replacement logo, historical Nagpur market cards and eight official scheme links. The national/state scheme component is shared with the signed-in directory to prevent divergent state links. New database defaults are applied by a separate migration; prior migration history is retained.

## ADR-021 — Selected-language UI payload

English, Hindi and Marathi application copy is selected in the server locale layout and passed through a client context. Other language dictionaries are not bundled into the dashboard JavaScript. Switching language uses a full route navigation so document language and server-rendered content agree. Stored enum codes, identifiers and original user text remain canonical.

## ADR-022 — Trained candidates remain research-only

Four appearance classifiers (tomato, potato, milled rice and annotated individual peanut patches), one onion seed-property experiment and six price-series candidates have actual training/evaluation artifacts. They are not automatically adopted as market grades or safe-sale recommendations. Offline inference checks artifact hashes and exposes research labels with no lot-grade write. Domain-mismatched and unlabelled supplied datasets remain unsupported for grading. See SIH-DATA-REVIEW.md.


## ADR-023 — Photo assessment and provisional grades (9 September 2026)

User requested A/B/C grades during crop listing, buyer visibility and FPO correction. Existing models were trained on appearance labels, not certified commodity grades. The app therefore uses an explicit appearance-v1 mapping: tomato ripe=A, unripe/old=B, damaged=C; potato fresh=A, rotten=C; rice whole=A, chalky/broken=B, stained=C; individual groundnut without visible mold=A, with visible mold=C. This mapping is not AGMARK or food-safety certification and must not be marketed as one. Unsupported crops/residue receive a pending manual-review result rather than invented grades.

An authenticated image assessment stores crop/category, owner, image bytes/hash, original label, model hash and provisional grade privately. A listing must claim a matching, unused assessment created in the preceding 24 hours. Submitted grades cannot override the server assessment. Changing crop/category in the form invalidates the selected assessment. Buyers see the grade source and can open the photo for published listings. FPO assessment creates an immutable new quality record and updates the editable lot's grade/source; committed/reserved lots cannot be silently regraded. Existing bids are withdrawn when the grade changes. Independent authorized FPO staff, not the lot owner, must perform manual grading.

## ADR-024 — Free local conversational assistant (9 September 2026)

The old keyword menu did not answer general questions. It is replaced by a local Gemma-3-4B-it Q4_K_M model through a loopback llama.cpp CPU server. Base model: https://huggingface.co/google/gemma-3-4b-it. Quantized distribution: https://huggingface.co/ggml-org/gemma-3-4b-it-GGUF. Gemma terms: https://ai.google.dev/gemma/terms; local terms, prohibited-use policy and notice copies are in work/assistant. This model is not Apache-2.0. Carry distribution/hosted-service obligations into launch terms before external release. Runtime: https://github.com/ggml-org/llama.cpp/releases/tag/b10867. Hashes are in work/assistant/source.json. No paid API or external chat account is used. The packaged start script starts the model if its files are present and an instance is not already healthy.

Questions use short instructions selecting English, Hindi or Marathi, recent conversation turns and relevant public scheme/dated-price data. No private account records or transaction tools are exposed to the model. Unavailable live data is not invented by policy. Recognition/playback continue to use browser speech support; typed input remains available. Small local models can still make mistakes; testing does not certify every possible answer. Non-streamed responses reject severely repetitive output. Low-temperature generation is used; token repetition penalties were removed because they harmed Hindi fluency. Streamed responses do not undergo that post-generation repetition check. Production-scale serving and wider language/agronomy evaluation remain release work.


Assistant runtime hardening: only one startup may acquire the local startup lock. The server binds loopback, requires a generated private key, disables its web UI/agent tools/MCP proxy and limits CORS. Questions and responses stay on this computer (browser speech recognition has its separately disclosed provider behavior). UI text streams during generation; spoken playback follows the completed answer. The smaller 1.7B candidate was rejected after human review found poor Hindi/Marathi answers, despite basic language-presence tests passing.


Both Qwen candidates were rejected for multilingual answer quality after direct review, including a reversed translation. Gemma uses the same isolated runtime and API. General watering context is grounded in University of Minnesota Extension: https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/gardening-in-hot-weather. This narrow reference set is not comprehensive agronomy retrieval or a guarantee of factual accuracy. Final actual-app English/Hindi/Marathi answers were reviewed and the strengthened browser test passed on 9 September.
