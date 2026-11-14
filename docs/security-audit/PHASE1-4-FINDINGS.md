# Groway Platform — Security Audit Findings Report
**Phases 1–4 (sandbox-actionable portion of the Mandatory Security Audit)**
Generated: 2026-04-19 · Auditor: Z.ai Code (automated static + dynamic analysis)
Scope: `/home/z/my-project` — 685 API route files, 49 pages, 75 runtime dependencies

---

## Executive Summary

| Phase | Scope | CRITICAL | HIGH | MEDIUM | LOW |
|---|---|---|---|---|---|
| 1. Secrets | source + env | **1** | 1 | 1 | 1 |
| 2. Backdoor / routes | 685 routes, proxy | **2** (1 live-verified) | 3 | 3 | 1 |
| 3. Dummy data | 85 files | 0 | 1 | 2 | 1 |
| 4. Dependencies | 75 deps | **2** | 25 (mostly transitive) | 9 | 2 |
| **Total** | | **5** | **30** | **15** | **5** |

**Verdict: NOT release-ready.** The most serious finding is a **live-verified, environment-independent authentication bypass** in `src/proxy.ts` (F2.1). One strong recommendation: do not expose the platform beyond the sandbox until F1.1, F2.1, and F2.2 are remediated and re-verified.

---

## Phase 1 — Secrets Audit

### F1.1 CRITICAL — Hardcoded JWT fallback secret signing active tokens (13 files)
`process.env.JWT_SECRET || 'your-secret-key-change-in-production'`
- `.env` contains **no JWT_SECRET**, so **every token issued right now uses this public constant**. Anyone who reads the open-source-typical string can forge valid merchant tokens (7-day expiry, full merchant claims).
- Files (all verified by grep):
  - `src/proxy.ts` (gateway verification — single point of failure)
  - `src/lib/auth-middleware.ts`
  - `src/app/merchant-os/api/auth/login/route.ts`
  - `src/app/merchant-os/api/auth/register/route.ts`
  - `src/app/merchant-os/api/auth/session/route.ts`
  - `src/app/merchant-os/api/auth/set-pin/route.ts`
  - `src/app/api/auth/refresh/route.ts`, `src/app/api/auth/session/route.ts`, `src/app/api/auth/admin/login/route.ts`
  - `src/app/api/wallet/balance/route.ts`, `src/app/api/wallet/transactions/route.ts`
  - `src/app/api/gopay/merchants/route.ts`
  - `src/app/api/consumer/auth/login/route.ts` (variant: `'groway-consumer-wallet-secret-key-2024'`)
- **Contrast (good example)**: `src/app/merchant-os/api/_lib/auth-middleware.ts` + `env.ts` correctly throw when JWT_SECRET is missing and enforce ≥32 chars. Extend this pattern everywhere.

### F1.2 HIGH — Consumer wallet uses a *different* hardcoded secret
`src/app/api/consumer/auth/login/route.ts` uses its own constant, so merchant and consumer token spaces share no verification boundary; both are forgeable.

### F1.3 MEDIUM — Demo credentials hardcoded in production source
`src/lib/auth-hybrid.ts` embeds `demo@groway.co.za` / `demo1234` / PIN `1234` (5 accounts). Intentional for demo, must be stripped/gated for release (see Phase 3).

### F1.4 LOW — Placeholder webhook secrets
`whsec_abc123def456` (grosupply supplier portal), `EAAxxxx...` (WhatsAppBusinessView), `demo_access_token_*` (integrations/accounting). Not real secrets, but they normalize the practice of hardcoding credentials in UI code.

**Clean results**: no vendor API keys (sk-/ghp_/AKIA/AIza/xox…) anywhere in `src`; `.env` is gitignored and contains only the local SQLite `DATABASE_URL`; `.env.example` contains placeholders only; **no private keys committed**; no `-----BEGIN PRIVATE KEY-----` blocks in any source file.

---

## Phase 2 — Backdoor / Route Review

**Inventory**: 685 `route.ts` files (411 under `/api`, 255 under `/merchant-os/api`, 2 under `/grosupply`), 49 pages. Auth architecture: `src/proxy.ts` (Next.js 16 proxy) performs central JWT + rate-limit enforcement for protected path prefixes; individual merchant-os routes rely on it centrally (only 10 use the strict in-route `getMerchantId`, 28 use `getMerchantIdWithDevFallback`, 221 have no in-route auth and depend fully on the proxy).

### F2.1 🔴 CRITICAL — LIVE-VERIFIED auth bypass via spoofed "internal service" headers (backdoor class)
`src/proxy.ts` trusts client-supplied headers `X-Tenant-ID` + `X-Merchant-ID` + `X-User-ID` as "service-to-service calls" and sets `x-authenticated: true` **with no shared secret and no NODE_ENV gate**.
Dynamic verification performed during this audit:

| Test | Result |
|---|---|
| `GET /merchant-os/api/customers` (no auth) | **401** ✓ |
| Same request + `X-Tenant-ID: t1` + `X-Merchant-ID: merchant-001` + `X-User-ID: attacker` | **200** ✗ (bypassed) |
| `X-Dev-Bypass: true` (dev mode) | **200** ✗ (dev-only bypass active in sandbox) |

Any external attacker who can reach the server can impersonate any merchant and read/modify any tenant's data. **Fix**: require a shared secret header (e.g. `X-Internal-Api-Key` validated against an env var) before honoring those headers, or delete the pass-through entirely. Verified safe to gate: no code in `src/`, `mini-services/`, or `scripts/` legitimately sends these headers outbound.

### F2.2 HIGH — 5 unauthenticated seed endpoints create users/data
Zero auth references in: `/api/seed`, `/api/seed-demo`, `/api/auth/seed-demo`, `/merchant-os/api/auth/seed`, `/merchant-os/api/pos/seed`. Anyone can POST to create accounts (with known passwords) or wipe/reseed data. `proxy.ts` explicitly allowlists `/api/seed*` as "dev bypass routes" — but only when `isDevelopment`; the merchant-os seed routes are **not** gated there and are reachable always. Also unauthenticated: `/merchant-os/api/auto-seed`, `/api/data-status` (POST → DB restore/backup trigger, uses `execSync` on a **fixed** command — no injection, but an unauthenticated DB-manipulation trigger).

### F2.3 HIGH — Dev-fallback merchant ID in 28 routes
`getMerchantIdWithDevFallback()` returns hardcoded `merchant-001` whenever `NODE_ENV=development` and no auth context exists. Current sandbox runs in dev mode, so all 28 routes operate without authentication right now. Each route is a latent IDOR if the flag ever reaches production.

### F2.4 MEDIUM — IDOR-prone helpers exported but unused (footguns)
`requireMerchantId()` and `getOptionalMerchantId()` (`src/lib/auth-context.ts`) take `merchantId` straight from query params with **no validation against the authenticated context**, unlike the strict `getMerchantId()`. Currently 0 usages — recommend deletion.

### F2.5 MEDIUM — Rate limiter is in-memory, per-process
`proxy.ts` rate limiting uses a module-local Map (documented "use Redis in production"). Restart-resistant attacks and multi-instance deployments defeat it. Acceptable for sandbox; blocked for release.

### F2.6 MEDIUM — CORS `Access-Control-Allow-Origin: *` on public booking endpoints
`/api/public/booking/[merchantId]/*` (GET/OPTIONS only). Low impact for public read data; tighten to an origin allowlist for release.

### F2.7 LOW — CSP weakened for preview panel
`proxy.ts` deletes CSP and sets `frame-ancestors *` — acceptable for the sandbox preview, must be reverted before production.

### F2.8 LOW — Payment integrations are mocks (safe today)
MTN MoMo / PayShap "integrations" contain commented external URLs and fabricated share links (`https://payshap.co.za/pay/${id}` — not a real endpoint). No live money movement, no exfiltration found. `auto-reorder` calls `localhost` only.

**Clean results**: no `eval`/`new Function`; the single `child_process` use is the fixed-command `execSync` above; no dynamic requires; no other CORS wildcards; no suspicious outbound hosts in `src` (all external URLs are comments/mock constructions); no route mass-assigns raw body→Prisma without typing in the samples inspected.

---

## Phase 3 — Dummy-Data Inventory

| Item | Count / Location | Risk |
|---|---|---|
| Files containing mock/sample/demo arrays | **85** (`src/app/**`, `src/components/**`) — top: IntegrationsView (5), salesforce portal (3), NotificationCenter (3), livestock views (3+3+2), MedicalPracticeView (3), grosupply supplier portal (3+3+3+2), agent-network portal (3), GroSellView (2), ChildcareView (2), BulkImportDialog (2) | MEDIUM — screens look "live" but display fabricated numbers; must be wired to APIs or labeled DEMO before stakeholder demos |
| Demo credentials in shipped code | `auth-hybrid.ts` (5 accounts), 5 seed routes | HIGH (overlaps F1.3/F2.2) — documented demo logins with money/PII privileges |
| Hardcoded consumer wallet balance | `wallet/HomeTab.tsx`: `useState(15847.50)`; BillsModal: `J. Mokoena / 1250.50` | MEDIUM |
| Agent earnings figure | `agent-network/page.tsx`: `R125,000`; admin-console: `R2.4M` commissions | MEDIUM |
| Investor decks | `public/MerchantOS_Investor_Pitch_Deck.pptx` (11 slides) and `public/Groway_Investor_Pitch_Deck.pptx` (5 slides) scanned: **no** R125M+/R60B+ figures found in text frames — flagged figures from the earlier 39-slide deck are not present in the current files. Will be rebuilt cleanly in task (c) with SAPE content. | LOW |

---

## Phase 4 — Dependency Audit (`npm audit`, registry data as of sandbox mirror)

**Totals: 2 critical, 25 high, 9 moderate, 2 low** (direct deps marked ⚠️)

### Critical
| Package | Installed | Advisory | Notes |
|---|---|---|---|
| ⚠️ `next` | 16.1.3 | HTTP request deserialization → DoS when using insecure patterns | Verify against Next 16 release notes; registry mirror may lag. Monitor for 16.1.x patch. |
| ⚠️ `next-auth` | 4.24.13 | Auth.js email normalization flaw | v4 is in maintenance; plan migration to v5/Auth.js or remove (app uses custom JWT auth anyway — check if next-auth is actually imported anywhere before upgrade). |

### High (direct): `pptxgenjs` 4.0.1 · `prisma` 6.19.2 · `sharp` 0.34.5 (libvips CVEs) · `xlsx` 0.18.5 (prototype pollution + ReDoS — **used for imports; consider SheetJS CE update or CSV-only**) · `eslint-config-next`
### High (transitive, notable): `lodash`/`lodash-es` (prototype pollution in `_.unset`/`_.omit`), `js-yaml`, `nanoid`, `minimatch`/`picomatch`/`micromatch` (ReDoS), `braces`/`brace-expansion` (DoS), `flatted`, `defu` (prototype pollution), `js-cookie`, `postcss` (XSS in stringify), `image-size`, `browserslist`, `deepmerge-ts`, `effect`, `fast-glob`

**Recommendation**: run `npm audit fix` for the transitive tier in a branch + full regression; `xlsx` is the only direct dep feeding untrusted user input (spreadsheet import) → prioritize.

---

## Remediation Plan (prioritized)

**P0 — fixed in this session (2026-04-19, dynamically re-verified):**
1. ✅ **F2.1 CLOSED** — `src/proxy.ts` now requires `X-Internal-Api-Key` (env `INTERNAL_API_KEY`) before honoring internal-service headers. Re-test: spoofed headers → **401** (was 200); legit login → 200 with fresh token.
2. ✅ **F1.1/F1.2 MITIGATED** — strong 48-byte `JWT_SECRET` generated into `.env`; all new tokens signed with it (rotation invalidates previously issued tokens → users re-login). `INTERNAL_API_KEY` also provisioned. Remaining follow-up: replace the 13 hardcoded `|| 'fallback'` expressions with fail-fast validation (P1).
3. ✅ **F2.2 CLOSED (dev-gate)** — new `src/lib/dev-only.ts` guard inserted into **11 handlers** across 7 routes (`/api/seed`, `/api/seed-demo`, `/api/auth/seed-demo`, `/api/data-status` GET+POST, `/merchant-os/api/auth/seed`, `/merchant-os/api/pos/seed`, `/merchant-os/api/auto-seed`): 404 outside development. In dev the handlers still run (verified — seed route reaches business logic; note: it currently 500s on a **pre-existing PrismaClientValidationError at line 114**, unrelated to the guard).

**P1 — next sprint:** delete IDOR-prone helpers (F2.4); strip demo credentials from `auth-hybrid.ts` into env-gated seeding; replace in-memory rate limiter; wire or label the 85 mock-data views; `npm audit fix` branch; fail-fast JWT_SECRET validation across the 13 files.

**P2 — release gate:** CSP restore, CORS allowlist, `xlsx` upgrade, next-auth decision, full E2E coverage per the 10-step release checklist.

---

*Verification commands for every finding are recorded in `worklog.md` Task 7. Re-run after remediation: the three P0 fixes are dynamically re-tested in this report's session.*

---

## Addendum (same session): SAPE build + keeper v6.2

**SAPE (SPZABOX Authentication & Provenance Engine) — built & E2E-verified:**
- 16 Prisma models pushed (AuthenticatedSupplier, ProductOrigin, ProductIdentity, ProductSerial, CustodyEvent, NetworkBlock, BlockchainAnchor, CustodyAnomaly, POSVerification→client `pOSVerification`, VerificationFailure, ConsumerScan, ConsumerReport, NodeTrustScore, AuthorityNotification, TipOff, GroSupplyOrderAuth)
- 9 endpoint files under `/api/sape/*` — strict auth helper (`requireSapeAuth`, no dev fallback); public endpoints allowlisted in proxy: `/api/sape/verify/`, `/api/sape/reports` (GET still in-route auth'd), `/api/sape/tipoff`
- Engine (`src/lib/sape/engine.ts`): GS1 AI(01)/(10)/(17)/(21) parser+builder, HMAC-SHA256 serial signatures (timing-safe compare), SHA-256 hash-chain + merkle roots, anomaly screening (recalled/duplicate-sale/scan-velocity/expiry/signature)
- Live results: POS verify AUTHENTIC @ 6-17ms (SLA 500ms ✓), duplicate-sale detection → SUSPECT + anomaly + failure record, public consumer verify @ 13ms with full custody trail, NCC/SAPS authority notifications queued with 1h SLA, unauth → 401
- UI: merchant `SAPEView` (KPIs, POS Verify console, Serialise console, Custody anchoring) wired into POSLayout sidebar under Customers; public `/verify` consumer page with verdict cards, provenance + custody trail, report form, mobile-responsive with sticky footer
- Config note found: `prisma/schema.prisma` hardcodes `url = "file:../dev.db"` so `.env` DATABASE_URL (db/custom.db) is ignored — runtime + CLI both use `dev.db`. Flagged as P2 hygiene; left unchanged deliberately.

**Keeper daemon v6.2 (OOM-loop fix):**
- Root cause of the 10:03-10:08 respawn loop: kernel OOM-killer killed next-server (anon-rss 2.7GB) while chromium was open; keeper's wipe-.next-on-every-respawn policy forced full recompiles (27-28s, huge memory spikes) every cycle → infinite loop.
- v6.2: cache wiped ONLY when boot log shows Turbopack panic ("Failed to restore task data"); normal respawns reuse the disk cache (fast, low-memory boots).
- Deployment: keeper now spawned by a restarted whatsapp-notification-service (port 3005, self-heal timer every 30s re-spawns the keeper if the lock dies).
- Verified: ~4 min stable, no restarts, RSS 1184-1200MB, health checks passing.
