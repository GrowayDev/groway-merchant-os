# Groway Merchant OS — Gap Analysis & Improvement Recommendations

**Task ID:** GAP-ANALYSIS (RESEARCH-ONLY — no code changes)
**Author:** Sub-agent (general-purpose)
**Scope:** Multi-vertical Merchant OS — POS, Inventory, Accounting, GroCredit, GroSupply, SAPE (anti-counterfeit) for South African township/spaza economy.
**Codebase revision:** HEAD of `/home/z/my-project` (Next.js 16, Prisma 6, React 19, ~296 Prisma models, 100+ view components).

---

## Executive Summary

Groway Merchant OS is a deeply feature-rich platform that already spans ~13 verticals (spaza, F&B, salon, pharmacy, hardware, hotel, agriculture, professional services, etc.) with real, Prisma-backed APIs for the majority of modules. However, the platform exhibits a recurring "UI-vs-API" gap: real backend services exist (loyalty, accounting, multi-location, Jax-AI insights, supplier orders, KYC templates, notification queue) but the UIs largely render hardcoded **mock data** because they were never wired to the live APIs. The most painful missing capabilities are (1) **no real payment-gateway integration** despite fee tables for Yoco/PayFast/Ozow, (2) **no PWA / service worker / installable mobile app** even though `/manifest.json` is referenced in `layout.tsx`, (3) **SARS eFiling is a UI shell only** (no VAT return model, no actual submission), (4) **multi-tenancy IDOR risk persists** (~205/296 models still missing `merchantId`, 30+ routes still query-param IDOR-vulnerable), and (5) **notifications are stubbed** (`sendEmail`/`sendSMS` log to console, push/WhatsApp marked `TODO`). On the SA-specific integration front, **zero** of the recommended SA payment gateways, bank open-banking APIs, CIPC/Home Affairs KYC, Xero/Sage/Pastel accounting, Courier Guy/Dawn Wing, Twilio/Africa's Talking, or PostHog/Mixpanel integrations are wired. The fastest high-impact wins are: ship the SKU/product image feature (Section 8 — schema already supports `image`/`images`), wire the existing Jax-AI LLM endpoint to the JaxAIView, replace mock data in the 10–15 most-used views with the existing real APIs, add PayFast + Yoco as the first two real gateways, and install a service worker so the offline IndexedDB sync (already implemented) becomes a true installable PWA.

---

## 1. Feature Gaps

Findings verified by reading the actual source. Effort legend: **S** = small (1–3 d), **M** = medium (1–2 wks), **L** = large (1+ month).

| # | Gap | Impact | Effort | Priority |
|---|-----|--------|--------|----------|
| 1.1 | **Onboarding wizard does not collect KYC/business details** — `src/app/merchant-os/onboarding/page.tsx` only collects branch, hours, staff, products, payment toggles. No CIPC reg number, VAT number, B-BBEE, FICA docs, bank account verification. A separate `KYBOnboarding` component exists but is **not in the wizard flow**. The `/api/merchant/onboarding` route only saves branch + staff + products; tradingHours/payments/bank fields are silently dropped. | **High** — blocks SARS eFiling, GroCredit underwriting, supplier onboarding. | S | P0 |
| 1.2 | **No real payment-gateway integration** — `src/app/api/merchant-os/payments/route.ts` only has fee-rate constants (yoco 2.95%, payfast 2.5%, paystack 1.5%, ozow 1.5%, gropay 1.25%) but no SDK imports, no checkout redirect, no webhook handler. `src/app/merchant-os/api/payments/processors/route.ts` returns an empty array. | **Critical** — merchants cannot accept card/online payments through Groway. | L | P0 |
| 1.3 | **Reports view ships hardcoded mock data** — `EnhancedReportsView.tsx` (lines 147–150) defines `customReports` as a static array (`'Daily Sales Summary'`, etc.); `SalesReportView.tsx` has no VAT/SARS/balance-sheet/income-statement report types. `vat-returns` API returns `[]` and the comment says "This can be enhanced with actual VAT return tracking model" — no `VATReturn` Prisma model exists. | **High** — financial reporting unusable for compliance. | L | P0 |
| 1.4 | **Notification delivery is stubbed** — `src/lib/services/notification-service.ts` has full queue + 9 templates, but `sendEmail` and `sendSMS` log to console and return a mock ID with `cost: 0.005`. `case 'push':` and `case 'whatsapp':` literally return `{success:false, error:'... not yet implemented'}`. | **High** — booking confirmations, OTPs, low-stock alerts, settlement notices never actually send. | M | P0 |
| 1.5 | **Multi-location view uses sample data** — `MultiLocationView.tsx` (lines 492–493) initialises `locations`/`transfers` from `sampleLocations`/`sampleTransfers`. The line `formatCurrency(consolidatedStats.totalRevenue * 0.68)` shows fake cost/COGS splits. A real `/api/multi-location/dashboard` endpoint exists but is unused. No inter-branch elimination entries, no multi-currency consolidation. | **Medium** — multi-branch operators cannot trust the numbers. | M | P1 |
| 1.6 | **No PWA / service worker / installable manifest** — `src/app/layout.tsx` line 54 references `manifest: "/manifest.json"` but **no such file exists** in `/public`. No `sw.js`, no `next-pwa`, no workbox dependency in `package.json`. Offline POS works via IndexedDB but the app cannot be installed to home screen. | **High** — spaza-shop owners on prepaid data cannot reliably use it as a daily tool. | M | P0 |
| 1.7 | **Offline sync hardcodes tenant** — `OfflineModeManager.tsx` line 262–263: `merchantId: 'merchant-001', branchId: 'branch-001'` — syncs to the wrong tenant if installed on a different merchant's device. IndexedDB schema and syncNow() work; only the tenant context is wrong. | **Critical** — multi-tenant data corruption risk. | S | P0 |
| 1.8 | **JaxAI view bypasses the real LLM** — `JaxAIView.tsx` line 489–494: `generateForecast` does `await new Promise(resolve => setTimeout(resolve, 1000))` then calls `generateMockForecasts()`. Meanwhile `src/app/api/merchant-os/jax-ai/{insights,forecast,reorder}/route.ts` are **fully wired to ZAI (z-ai-web-dev-sdk)** with SA-specific prompts (load shedding, payday cycles, seasonality). UI just never calls them. | **High** — biggest USP of the platform is invisible to users. | S | P0 |
| 1.9 | **Loyalty works but is not surfaced in POS** — `/api/loyalty/customers/[customerId]` and `/api/loyalty/transactions` are real Prisma-backed routes; `Customer.loyaltyPoints` and `loyaltyTier` fields exist. But there is no POS-side accrual prompt, no "redeem points" tender button in `POSLayout.tsx`. | **Medium** — loyalty exists technically but is invisible at checkout. | M | P1 |
| 1.10 | **Bookings have no calendar sync / external reminders** — `EnhancedBookingView.tsx` (4,515 lines) is rich, but no Google Calendar / Outlook ICS export, no iCal feed, no SMS/email reminders on the wire (`reminder-service.ts` exists but cron job not configured in production). | **Medium** — salons/pharmacies miss appointments. | M | P1 |
| 1.11 | **Accounting is real double-entry but reconciliation is fake** — `JournalEntry` + `JournalEntryLine` + `ChartOfAccount` models and `/api/accounting/journal`, `/trial-balance`, `/balance-sheet`, `/income-statement` endpoints are all real. But `AccountingView.tsx` reconciliation tab is UI-only (no bank statement matching). No bank-reconciliation model. | **Medium** — auditors cannot sign off. | M | P1 |
| 1.12 | **SARS eFiling view is purely cosmetic** — `SarsEfilingView.tsx` initialises state from `generateSARSConfig()` (mock). No real VAT201, EMP201, ITR14 submission. No `/api/sars/submit` endpoint. Confirmation URLs are hardcoded `https://efiling.sars.gov.za/confirmation/789456`. | **High** — non-compliant for VAT-registered merchants. | L | P0 |
| 1.13 | **GroSupply has real backend, weak merchant-side UI** — `/api/supplier/{orders,rfqs,invoices,disputes,settlements,catalogs,messages,products}` and a supplier portal exist. `GroSupplyView.tsx` fetches suppliers from API. But PO creation, invoice reconciliation against GRN, three-way matching are not surfaced in the merchant UI as actionable flows — most data tables are read-only. | **Medium** — merchants cannot complete the buy → receive → reconcile loop. | M | P1 |
| 1.14 | **Customer-facing app does not exist** — `CustomerFacingView.tsx` uses `sampleProducts`/`sampleOrders`/`sampleQRLinks`. No customer-facing PWA, no digital receipt wallet (only a stub `/api/notifications/ereceipt`), no loyalty wallet for end-consumers (the `src/components/wallet/` code is for a separate consumer wallet product). | **High** — no customer-side loop. | L | P1 |
| 1.15 | **SAPE anti-counterfeit module does not exist in codebase** — A `rg -i 'sape|anti-counterfeit'` returned zero real source files (only one false-positive match on `ecsapePendingRenewal` in EngineeringView). The task brief mentions SAPE as "the new SAPE module", but it has not been started. | **High** if it is a committed roadmap item. | L | P1 |
| 1.16 | **No real supplier invoice reconciliation** — `PurchaseOrder`, `PurchaseOrderItem`, `GoodsReceivedNote`, `OrderTrackingEvent` models exist; reconciliation against `Invoice` model (matching qty × price × delivery cost) is not implemented as a service. | **Medium** — supplier disputes cannot be evidence-backed. | M | P1 |
| 1.17 | **No demand-forecasting storage** — JaxAI forecast endpoint receives `inventoryData` in request body (frontend computes), no `DemandForecast` model to persist historical predictions vs actuals for accuracy scoring. | **Low/Medium** — AI cannot learn. | M | P2 |
| 1.18 | **No audit log UI** — `audit-service.ts` exists, `AuditLogViewer` component exists, but no `/admin/audit-logs` route is wired into the merchant sidebar; only `/api/admin/audit-logs` is exposed. | **Low** — admins only. | S | P2 |

---

## 2. Integration Gaps

The `IntegrationsView.tsx` UI mentions Xero, Sage, QuickBooks, Shopify, WooCommerce, Uber Eats, Mr D Food, DSV, RAM, Paxi, Aramex, Fastway — but every entry is `mockAccountingConnections`/`mockEcommerceConnections` arrays. No provider SDK is installed (`grep -i 'stripe|payfast|yoco|ozow|twilio|@aws-sdk|r2|algolia|meilisearch|mixpanel|posthog|sendgrid|postmark|@sentry/nextjs|ioredis'` on `package.json` returns nothing except `z-ai-web-dev-sdk` and `sharp`).

| # | Integration | Why it matters for SA market | Effort | Priority |
|---|-------------|------------------------------|--------|----------|
| 2.1 | **PayFast** | Default SA gateway, supports card/EFT/SnapScan/Zapper, instant EFT. Cheapest onboarding. | M | P0 |
| 2.2 | **Yoco** | Most ubiquitous card reader in SA township/spaza segment; offline-capable. | M | P0 |
| 2.3 | **Ozow** | Instant EFT / PayShap rails; ideal for wallet top-ups. | S | P0 |
| 2.4 | **SnapScan / Zapper** | QR-based consumer payments dominant at SA markets. | S | P1 |
| 2.5 | **Peach Payments** | Enterprise gateway, required for higher-tier merchants. | M | P2 |
| 2.6 | **FNB / Standard Bank / Absa / Nedbank / Capitec Open Banking** | Auto bank feeds for `BankFeedView`. Currently `bank-feeds/accounts/route.ts` returns 3 in-memory hardcoded FNB/Capitec/Standard Bank accounts. SA Open Banking APIs (e.g. Nedbank `Aani`, Stitch API) are mature enough. | L | P1 |
| 2.7 | **SARS eFiling API** | VAT201 / EMP201 / ITR14 submission, IT3b data provider. SARS exposes an XML/SOAP channel; no third-party REST exists. Realistic path: export eFiling-ready XML for manual upload. | L | P0 |
| 2.8 | **Xero / Sage Business Cloud / Sage One / Pastel / QuickBooks Online** | SMB accounting export. `IntegrationsView` already lists Xero/Sage/QuickBooks as dropdown options. Build via OAuth + their public APIs. Xero is most documented. | M per provider | P1 |
| 2.9 | **Courier Guy / Dawn Wing / Fastway / Takealot Delivery** | Last-mile SA couriers. `couriers/integrations/route.ts` whitelists DSV/RAM/Paxi/Aramex/Fastway but exposes no real carrier API calls. Takealot delivery is essential for spaza restocking. | M | P1 |
| 2.10 | **Twilio + Africa's Talking (SMS) / WhatsApp Business Cloud API** | The notification queue already targets these providers (line 444: "TODO: Implement real SMS providers"). Africa's Talking is cheaper for SA bulk SMS. WhatsApp Cloud API is free for the first 1000 conversations. | S | P0 |
| 2.11 | **SendGrid / Postmark / AWS SES (transactional email)** | Email sending is currently `console.log`. Add one provider via `IntegrationConfig.credentials` (schema already supports it). | S | P0 |
| 2.12 | **CIPC (Companies and Intellectual Property Commission)** | Validate merchant registration number during onboarding; pull enterprise name, status, directors. CIPC has a public search but no REST API — would require screen-scraping or third-party KYC vendor. | L | P2 |
| 2.13 | **Home Affairs / KYC vendors (Smile Identity, ThisIsMe, DocFox)** | ID verification for merchant principal owners (FICA). Smile Identity has a SA-friendly API. | M | P1 |
| 2.14 | **Google Maps Platform / OpenStreetMap (GraphHopper / OSRM)** | `MultiLocationView` has a placeholder "Map View - {n} locations across South Africa" but no actual map. Delivery routing for own fleet needs OSRM/GraphHopper. | M | P1 |
| 2.15 | **AWS S3 / Cloudflare R2** | `file-storage-service.ts` declares `StorageProvider = 'local' | 's3' | 'cloudflare' | 'azure'` but only `local` is implemented (line 225 hardcodes `storageProvider: 'local'`). R2 free egress is the right pick. | S | P0 |
| 2.16 | **PostHog / Mixpanel** | Product analytics; no analytics SDK in `package.json`. PostHog self-hostable, free tier generous. | S | P1 |
| 2.17 | **Sentry** | `src/lib/sentry.ts` is fully scaffolded (dynamic import) but `@sentry/nextjs` is **not in `package.json`** — captureException silently no-ops in production. | S | P0 |
| 2.18 | **Redis (ioredis)** | `src/lib/redis.ts` is written (sessions, rate limiting) but `ioredis` is not in `package.json`; falls back to in-memory on every boot. | S | P0 |
| 2.19 | **Algolia / Meilisearch / Typesense** | POS product search is a simple substring filter on `skuCatalog.ts`; with >5k SKUs it gets slow. Meilisearch self-hostable. | M | P2 |
| 2.20 | **Practo / Khonology / local fintech KYC** | Optional alt-credit data sources for GroCredit scoring. | L | P2 |
| 2.21 | **BETaaS / SST (SARS) / SARB eFiling** | EMP201 (PAYE/UIF/SDL) and VAT201 are the only mandatory SARS touchpoints; income tax (ITR14) is filed annually and could be a much later roadmap item. | M | P1 |
| 2.22 | **MTN MoMo / Vodacom Airtime** | Consumer wallet modal already exists (`MTNMOMOModal.tsx`, `AirtimeModal.tsx`) but is purely UI. | M | P2 |

---

## 3. Technical Debt (from prior audits)

Confirmed against the codebase. The most recent `SECURITY_AUDIT_REPORT.md` claims ~95% of critical issues remediated, but **multi-tenancy IDOR risk persists** — see audit findings below.

| # | Issue | Verified? | Risk | Effort | Priority |
|---|-------|-----------|------|--------|----------|
| 3.1 | **30+ routes still IDOR-vulnerable via `merchantId` query param** — e.g. `src/app/merchant-os/api/couriers/integrations/route.ts` lines 19–22 reads `merchantId` from `searchParams` and uses it directly in `where` without auth-context check. Same in `/api/supplier/orders/route.ts`, `/api/consumer/*` (per audit notes). | **Yes** — confirmed by reading the file. | **Critical** — tenant data leakage. | M | P0 |
| 3.2 | **29 sites missing `await` on `getMerchantIdWithDevFallback`** — function signature returns `string | undefined` (synchronous) but the multi-tenancy audit (worklog) flagged it. Re-verify all 100+ callers. | Partial — `processors/route.ts` line 7 is sync; some routes `await` it (works because `await` on non-promise is a no-op) — cosmetic but masks bugs. | **Low** code smell. | S | P2 |
| 3.3 | **205/296 Prisma models missing `merchantId`** — `awk` count on `schema.prisma` confirms **91/296** models have `merchantId` (~31%). Includes `PurchaseOrder`, `PurchaseOrderItem`, `Supplier`, `SaleEvent`, `StockMovement`, `Branch`, `FileStorageRecord` (if existed), `Customer` (some). Many global models share data they shouldn't. | **Yes** — verified. | **Critical** for any future multi-tenant scale. | L | P0 |
| 3.4 | **SQLite single-writer bottleneck** — `schema.prisma` default datasource is SQLite. A `schema.postgresql.prisma` exists in `/prisma/` but is not active. Under concurrent writes (e.g., multiple cashiers), SQLite locks the DB. | **Yes** — schema.prisma uses `sqlite` provider. | **Critical** at scale. | M | P0 |
| 3.5 | **In-memory session storage** — `MerchantSession` table exists, but session cache layer uses Node memory in some hot paths. DB sessions do 4-table joins (`MerchantSession → Merchant → MerchantUser → User → Role → Permission`). | **Yes** — confirmed by prior audit. | **Medium** — N+1 risk on every authed request. | M | P1 |
| 3.6 | **File uploads on local FS** — `file-storage-service.ts` writes to `./uploads` (or similar). Backup/restore fails on serverless (Netlify). | **Yes** — line 207 `await writeFile(storagePath, file.data)`. | **High** — Netlify ephemeral FS. | S | P0 |
| 3.7 | **`OfflineModeManager` hardcodes `merchantId: 'merchant-001', branchId: 'branch-001'`** (line 262–263) on sync. | **Yes**. | **Critical** — tenant data corruption. | S | P0 |
| 3.8 | **Mock data persists in 15+ views** — `MultiLocationView` (`sampleLocations`), `SarsEfilingView` (`generateSARSConfig`), `CustomerFacingView` (`sampleProducts`/`sampleOrders`), `JaxAIView` (`generateMockForecasts`), `IntegrationsView` (`mockAccountingConnections`), `EnhancedReportsView` (hardcoded `customReports`), `AccountingIntegrationView` (`mock journal entries`), `bank-feeds/accounts/route.ts` (`// In-memory store for demo purposes`). | **Yes** — verified. | **High** — demo-only product. | L | P0 |
| 3.9 | **`@sentry/nextjs` and `ioredis` not installed** despite being imported dynamically. | **Yes** — `package.json` confirmed. | **Medium** — silent observability gap. | S | P0 |
| 3.10 | **`layout.tsx` references `/manifest.json` that does not exist** — broken PWA link. | **Yes**. | **Low** UX. | S | P0 |
| 3.11 | **Two competing middlewares** — `src/proxy.ts` and (previously) `middleware.ts`. Audit notes middleware.ts was removed; verify no `middleware.ts` exists. | Partial — `proxy.ts` is the active one. | **Low**. | S | P2 |
| 3.12 | **No CSRF protection on state-changing POST routes** — most POST handlers rely on cookie-only session, no CSRF token or `SameSite=Strict` enforcement verified. | Not verified end-to-end. | **Medium**. | M | P1 |
| 3.13 | **No rate-limiting per merchant** — `proxy.ts` has IP-based rate limiting only (100/min/IP). A single merchant can still hammer the DB across IPs. | **Yes** — per audit notes. | **Medium**. | S | P1 |
| 3.14 | **`JaxAIView` mock-bypasses real LLM** (see 1.8). | **Yes**. | **Medium** — credibility. | S | P0 |
| 3.15 | **`bun.lock` and `package-lock.json` both present** — non-deterministic installs across agents. | **Yes**. | **Low**. | S | P2 |
| 3.16 | **Multiple seed files** — `seed-simple.ts`, `seed-demo.ts`, `seed-suppliers.ts`, `seed-merchants.ts`, `seed-comprehensive.ts`, `auth-seed.ts`, `seed-users-roles.ts`, `seed-tenants.ts`, `seed-user-management.ts`, `seed-all-skus.ts`, `merchant-seed.ts`, `seed-suppliers-excel.ts`, `admin-seed.ts`, `product-seed.ts`. No canonical seed. | **Yes**. | **Low**. | S | P2 |
| 3.17 | **`next.config.ts` vs `next.config.netlify.ts` vs `next.config.static.ts`** — three configs, deployment story unclear. | **Yes**. | **Low**. | S | P2 |

---

## 4. UX/UI Gaps

Ordered by user impact.

| # | Gap | Priority |
|---|-----|----------|
| 4.1 | **Sidebar has 9 categories and up to ~25 visible items per vertical** (`getNavCategories` in `POSLayout.tsx` lines 739–918). Tablet layout truncates to 10 (`navCategories.flatMap(c => c.items).slice(0, 10)`) — items 11+ unreachable without expanding "All Menu". Mobile uses bottom-sheet. Recommend: **collapse "Growth" and "Settings" into a single "More" tab**, expose user-customisable "pinned" items. | P0 |
| 4.2 | **No global command palette** (cmd+K) — `cmdk` is installed but not wired. With 60+ views this is the only realistic way to navigate on desktop. | P0 |
| 4.3 | **No keyboard navigation in POS** — cannot scan a barcode and press Enter to add to cart without a click handler on the search input. No `aria-keyshortcuts` anywhere. | P0 |
| 4.4 | **No ARIA labels on icon-only buttons** — random `<button>` elements with only icons (e.g. cart remove, hold-recover). Screen readers say nothing. | P0 |
| 4.5 | **Mobile POS product grid is 2 cols** at 360px (`grid-cols-2 sm:grid-cols-3`). SKU tiles are 36×36px icon + truncated text. Touch target is fine but no images. Adding product images (Section 8) is the biggest UX upgrade. | P0 |
| 4.6 | **Onboarding wizard is 7 steps but very thin** — no business-type detection, no industry-specific defaults (e.g. salon doesn't get asked about chair count). Should branch on `vertical.id`. | P1 |
| 4.7 | **No empty-state CTAs in views that use mock data** — when the mock data is finally removed, those views will show white space. Need the `EmptyState` pattern from prior worklog applied universally. | P1 |
| 4.8 | **No dark mode** — `next-themes` is installed but not exposed in sidebar; kitchen-display use case at night is real. | P2 |
| 4.9 | **No print stylesheet for receipts** — `/api/pos/print/route.ts` exists, but the receipt component uses inline styles that browsers butcher on print. | P1 |
| 4.10 | **No localization** — `next-intl` is in dependencies but the entire UI is English-only. Township Zulu/Xhosa/Sotho translations would unlock a different demographic. | P2 |
| 4.11 | **No first-time tooltips** — 60+ views, no `react-joyride` or similar. New users abandon. | P2 |
| 4.12 | **Color contrast** — primary text `#1A1A1A` on `#FAFAFA` (16:1) is fine; secondary `#757575` on `#FAFAFA` is 4.7:1 — borderline AA. | P2 |
| 4.13 | **Loading skeletons only on 30% of views** — most still show spinners. | P2 |
| 4.14 | **No confirmation dialog on destructive actions in many views** — e.g. `removeProduct(id)` is fire-and-forget. | P1 |

---

## 5. Operational Gaps

| # | Gap | Priority |
|---|-----|----------|
| 5.1 | **No Sentry in production** — `@sentry/nextjs` not installed. `captureException` silently no-ops. | P0 |
| 5.2 | **No Redis** — `ioredis` not installed; in-memory fallback loses sessions on every cold start (Netlify serverless = every request). | P0 |
| 5.3 | **No Datadog / Prometheus / Grafana** — no metrics endpoint, no `/api/health` (it's mentioned in `sentry.ts` denyUrls but doesn't exist). | P1 |
| 5.4 | **No feature-flag system** — `LaunchDarkly`/`Statsig`/`GrowthBook` not installed. Risky to roll out new verticals. | P1 |
| 5.5 | **No A/B testing framework** — same as above; `Statsig` covers both. | P2 |
| 5.6 | **No transactional email provider** — SendGrid/Postmark/SES all missing. | P0 |
| 5.7 | **No cloud storage** — local FS only. Netlify deploys will lose uploads. | P0 |
| 5.8 | **No search engine** — Algolia/Meilisearch/Typesense missing. POS uses substring filter on `skuCatalog.ts` (2,439-line static TS file). | P2 |
| 5.9 | **No background worker** — `mini-services/` (8 services) exist as standalone Node scripts but are not wired to a queue (no BullMQ, no Inngest, no Trigger.dev). Reminder service, expiry monitor, settlement processor, stock alerts, auto-reorder, WhatsApp notification all need a real job runner. | P0 |
| 5.10 | **No CI/CD pipeline** — no `.github/workflows/`, no tests on PR. Jest is configured (`jest.config.ts`) but tests cover only `__tests__/integration/api/{auth,bookings,products}.test.ts` and 3 unit tests. | P1 |
| 5.11 | **No DB migration strategy** — `prisma db push` in `package.json`; production should use `prisma migrate deploy`. A `migrations/` folder does not exist. | P0 |
| 5.12 | **No staging environment** — single Netlify env. | P1 |
| 5.13 | **No backup/restore tested** — `dev.db.backup` exists locally; no automated nightly snapshot. | P0 |
| 5.14 | **No secrets manager** — env vars in Netlify UI only; no Doppler/AWS Secrets Manager/HashiCorp Vault integration. | P1 |
| 5.15 | **No log aggregation** — `console.log` everywhere; no Logtail/BetterStack/Datadog Logs. | P1 |
| 5.16 | **No uptime monitoring** — no BetterStack/UptimeRobot/Pingdom configured. | P1 |
| 5.17 | **No DB connection pooling** — Prisma opens a new connection per query in serverless; need PgBouncer or Prisma Accelerate. | P0 (when migrating to Postgres) |

---

## 6. Competitive Analysis

| Competitor | Feature they have | Do we have it? | Priority to add |
|------------|-------------------|----------------|----------------|
| **Yoco** (SA POS + payments) | Card reader hardware + offline card acceptance | No (no Yoco SDK, no hardware integration in PaymentGatewayView) | P0 |
| Yoco | Instant settlement to bank | No | P0 |
| Yoco | Mobile-first POS app (installable, works offline) | Partial — IndexedDB offline works, but no PWA / installable | P0 |
| Yoco | Free VAT-compliant invoicing | Partial — Invoice model exists; no SARS eFiling | P1 |
| **Khonology** (SA SMB tools) | Cash-flow forecasting + access to finance | Partial — GroCredit exists, no forecasting UI | P1 |
| Khonology | B-BBEE scorecard tracking | No | P2 |
| Khonology | SARS CIPC auto-sync | No | P1 |
| **Square** (global POS) | Offline mode with sync | Yes (OfflineModeManager), but tenant-hardcoded | P0 (fix) |
| Square | Inventory multi-location transfers | Yes (model exists) but UI uses sample data | P1 |
| Square | Loyalty + marketing automation | Partial — loyalty API exists, marketing UI mock | P1 |
| Square | Open API + app marketplace | Partial — `/api/docs` route exists (swagger-jsdoc) | P2 |
| Square | Tap-to-pay on phone (NFC) | No | P2 |
| **Shopify POS** | E-commerce + POS unified inventory | Partial — `CustomerFacingView` has online store scaffold, but mock | P1 |
| Shopify POS | Barcode scanning via camera | No (only hardware scanner via `barcode` field on Product) | P1 |
| Shopify POS | Gift cards (digital + physical) | Yes (`VouchersAndGiftCardsView`) | — |
| Shopify POS | Multi-channel attribution | No | P2 |
| **Lightspeed** (hospitality) | Floor plan + table management + KDS | Yes (`TableFloorPlanView`, `KitchenDisplayView`) | — |
| Lightspeed | Recipe scaling + sub-recipes | Yes (`RecipeEngineView`) | — |
| Lightspeed | Online ordering + delivery integrations (Uber Eats, Mr D, in-house) | Partial — `IntegrationsView` lists Uber Eats / Mr D as mock entries | P1 |
| **Toast** (restaurant POS) | Handheld server tablets with menu images | No images on SKUs (Section 8 fixes this) | P0 |
| Toast | Real-time KDS bump-screen | Yes | — |
| Toast | Tip splitting + tip pooling | Partial — `pos/payments/tips/route.ts` exists | P2 |
| Toast | Menu engineering analytics (profit per minute) | No | P2 |
| Toast | Pay-at-table QR | Yes (`QRSelfServiceView`) | — |
| Toast | Inventory variance reporting | Partial | P1 |

**Net takeaway:** Groway's *breadth* of verticals is unmatched in SA. Its *depth* per vertical is shallow because most vertical-specific features are scaffolded UI shells over mock data, while real APIs (loyalty, accounting, multi-location, supplier orders, Jax-AI) exist but are not wired. Yoco wins on payment+offline+PWA; Shopify wins on unified commerce; Lightspeed/Toast win on restaurant depth. None of them have GroCredit + GroSupply + SA township supplier network — Groway's true moat.

---

## 7. Top 10 Recommended Improvements (impact × effort)

| # | Recommendation | Impact | Effort | Notes |
|---|----------------|--------|--------|-------|
| 1 | **Wire the Jax-AI LLM API into `JaxAIView.tsx`** (replace `generateMockForecasts()` with `fetch('/api/merchant-os/jax-ai/forecast')`). Also persist forecasts in a new `DemandForecast` model for accuracy tracking. | Very High | S | The infrastructure is already built; this is the cheapest credibility win. |
| 2 | **Implement the SKU/Product Image feature** (see Section 8 for full spec). Prisma `Product.image` and `Product.images` already exist; only UI + upload endpoint + storage provider are missing. | Very High | M | Single biggest UX upgrade for township merchants who don't read English fluently. |
| 3 | **Integrate PayFast + Yoco as the first real payment gateways.** Add SDK, checkout redirect, webhook handlers; populate `/api/payments/processors` from real merchant onboarding. | Critical | M | Unblocks online/card payments end-to-end. |
| 4 | **Add a service worker + manifest.json** (PWA). Use `@ducanh2912/next-pwa` or `serwist`. App becomes installable; offline IndexedDB sync (already built) becomes useful. | High | S | Layout.tsx already references `/manifest.json` — just create the file. |
| 5 | **Fix the multi-tenancy IDOR holes** in the 30 flagged routes (`/api/supplier/*`, `/api/couriers/integrations`, parts of `/api/consumer/*`). Replace query-param `merchantId` with `getAuthContext()`-derived merchantId everywhere. Fix `OfflineModeManager` hardcoded `merchant-001`. | Critical | M | Security debt; also unblocks public launch. |
| 6 | **Migrate SQLite → PostgreSQL** (use existing `schema.postgresql.prisma`). Add PgBouncer/Prisma Accelerate. Run `prisma migrate deploy` for real migrations. | Critical | M | Required for any concurrent-cashier scenario. |
| 7 | **Wire real notification providers:** SendGrid/Postmark for email, Africa's Talking for SMS, WhatsApp Cloud API for WhatsApp. `IntegrationConfig` model + `notification-service.ts` queue are ready — only provider SDKs and credentials are missing. | High | M | OTPs, booking reminders, low-stock alerts start working. |
| 8 | **Replace mock data in `MultiLocationView`, `SarsEfilingView`, `CustomerFacingView`, `IntegrationsView`, `BankFeedView`, `EnhancedReportsView`, `AccountingIntegrationView` with calls to the real APIs that already exist** (most have endpoints, just unused). | High | L | "Demo → product" transition. |
| 9 | **Add Sentry, Redis, and cloud storage (Cloudflare R2) as installed dependencies + configured services.** All three are scaffolded in code but not installed. | High | S | Production observability + durability in one sprint. |
| 10 | **Build the SAPE anti-counterfeit module from scratch** (it doesn't exist). Spec: product batch → unique QR/scan code → consumer scan endpoint → authenticity verification → fraud analytics dashboard. Reuses existing `Product`, `GoodsReceivedNote`, `StockMovement` models + a new `AuthenticityScan` model. | High | L | Strategic moat for township FMCG. |

---

## 8. SKU Image Feature Specification (detailed)

The user has explicitly asked for product images on SKUs. Currently `Product.image` (single) and `Product.images` (CSV/JSON string) fields already exist in `prisma/schema.prisma` (lines 4210–4211). The `SKU` interface in `src/app/merchant-os/app/data/skuCatalog.ts` does NOT have an `imageUrl` field — it only has `icon: any` (Lucide component). The POS grid (`POSLayout.tsx` line 1217–1218) renders a Lucide icon in a coloured square. So the schema is ready; the rest of the stack needs building.

### 8.1 Prisma Schema Changes

The `Product` model already has the fields. No migration needed for the basic feature. Recommended enhancements:

```prisma
// In prisma/schema.prisma, model Product (line 4201)
model Product {
  // ... existing fields ...
  image             String?            // primary thumbnail URL — EXISTS
  images            String?            // JSON array of URLs — EXISTS, refactor to relation
  imageUrl          String?            // ADD: denormalised thumbnail for fast POS lookup (avoids JSON parse)
  imageAlt          String?            // ADD: accessibility text
  imageUpdatedAt    DateTime?          // ADD: cache-busting for CDN
  
  // NEW: dedicated relation for multiple images (cleaner than JSON string)
  ProductImage       ProductImage[]?
  // ...
}

// NEW model
model ProductImage {
  id          String   @id @default(cuid())
  productId   String
  url         String   // CDN URL
  thumbnailUrl String? // 200x200 derivative
  mediumUrl   String?  // 600x600 derivative
  largeUrl    String?  // 1200x1200 derivative
  altText     String?
  sortOrder   Int      @default(0)
  isPrimary   Boolean  @default(false)
  width       Int?
  height      Int?
  sizeBytes   Int?
  mimeType    String?
  createdAt   DateTime @default(now())
  
  Product     Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  
  @@index([productId, sortOrder])
}
```

The dual approach (`imageUrl` denormalised + `ProductImage[]` relation) gives the POS a single fast lookup while letting the inventory page manage galleries.

### 8.2 API Changes

#### 8.2.1 Upload Endpoint — `POST /api/merchant-os/products/[id]/images`

New route at `src/app/merchant-os/api/products/[id]/images/route.ts`:

```typescript
// Request: multipart/form-data with file(s) + optional altText + isPrimary
// Response: { success: true, image: ProductImage }

// 1. Validate auth via getAuthContext(request)
// 2. Validate merchant owns product (product.merchantId === context.merchantId)
// 3. Validate file: max 5MB, mime ∈ {image/jpeg, image/png, image/webp}
// 4. Generate derivatives using `sharp` (already installed):
//    - thumbnail: 200x200, quality 70, webp
//    - medium: 600x600, quality 75, webp
//    - large: 1200x1200, quality 80, webp
// 5. Upload original + 3 derivatives to storage:
//    - Dev: local FS via file-storage-service.ts (works today)
//    - Prod: Cloudflare R2 (needs `@aws-sdk/client-s3` + R2 credentials)
//    - Path: merchants/{merchantId}/products/{productId}/{uuid}-{size}.webp
// 6. Insert ProductImage record; if isPrimary, update Product.imageUrl and Product.image
// 7. Return URLs
```

#### 8.2.2 List Images — `GET /api/merchant-os/products/[id]/images`

Returns the `ProductImage[]` array sorted by `sortOrder`.

#### 8.2.3 Delete Image — `DELETE /api/merchant-os/products/[id]/images/[imageId]`

Deletes from storage + DB. If primary, promote next image to primary (or null).

#### 8.2.4 Bulk Import — `POST /api/merchant-os/products/images/bulk-import`

Accepts an Excel/CSV (`xlsx` already installed) with columns `sku, imageUrl`. Downloads each URL, generates derivatives, uploads, links. Useful for migrating 5,000+ SKUs from a competitor.

#### 8.2.5 AI Image Generation — `POST /api/merchant-os/products/[id]/generate-image`

Uses the existing `z-ai-web-dev-sdk` (image-generation skill) to generate a stock photo from the product name + category when the merchant has no camera. Free-tier rate-limited; prompt template: "Product photo of {name}, {category}, on white background, studio lighting, e-commerce style".

### 8.3 Storage Strategy

| Environment | Provider | Path | Public URL |
|-------------|----------|------|------------|
| Dev | Local FS (`/public/uploads/products/{merchantId}/{productId}/`) | `file-storage-service.ts` with `storageProvider: 'local'` | `http://localhost:3000/uploads/...` |
| Prod | **Cloudflare R2** (preferred — no egress fees) | `product-images/{merchantId}/{productId}/{uuid}-{size}.webp` | `https://{r2-public-domain}/product-images/...` (or signed URL if private) |
| Alt Prod | AWS S3 (if R2 unavailable) | Same path scheme | CloudFront-signed URLs |

Modify `file-storage-service.ts`:
- Add `case 'cloudflare'` / `case 's3'` to the `uploadFile` switch (currently hardcodes `'local'` on line 225).
- Add `@aws-sdk/client-s3` (works for both R2 and S3 with `endpoint` override).
- Cache-bust with `?v={imageUpdatedAt.getTime()}` in URLs.

### 8.4 UI Changes

#### 8.4.1 Inventory View — `InventoryView.tsx`

- Add an "Image" column to the product table (leftmost). Show 40×40 thumbnail, fallback to Lucide icon if no image.
- In the product edit dialog, add an image uploader (drag-drop + click). Use `react-dropzone` (needs install) or build with native `<input type="file">`.
- Show primary image + gallery thumbnails + "Set as primary" + "Delete" actions.
- Add an "AI Generate" button that calls the generate-image endpoint (loading spinner, 5–15s).
- Add a "Bulk Import" button → opens a dialog with Excel template download + file upload.

#### 8.4.2 POS Grid — `POSLayout.tsx` (lines 1210–1224, 1551+, 1743+)

Change the product card to:
```tsx
<div className="w-16 h-16 mx-auto mb-2 rounded-lg overflow-hidden bg-[#E0F2F1] flex items-center justify-center">
  {sku.imageUrl ? (
    <img src={sku.imageUrl} alt={sku.name} className="w-full h-full object-cover" loading="lazy" />
  ) : (
    <sku.icon className="h-6 w-6 text-[#00897B]" />
  )}
</div>
```

Add `imageUrl?` to the `SKU` interface in `skuCatalog.ts`. The catalog seeding from `prisma/seed-data/*-skus.ts` should map each seeded SKU to a royalty-free image (Unsplash Source API or a bundled `/public/sku-images/{category}/{slug}.webp` set).

#### 8.4.3 Catalog / Customer-Facing — `CustomerFacingView.tsx`

- Online store product cards should show a 4:3 image (currently uses `sampleProducts` with no images).
- Product detail modal should show a gallery carousel (`embla-carousel-react` already installed).

#### 8.4.4 Digital QR Menu — `DigitalQRMenuView.tsx`

- Each menu item should show a 16:9 image. This is the highest-conversion placement for images.

#### 8.4.5 Receipts — `ReceiptPreview.tsx` (in `POSEnhancedFeatures.tsx`)

- Optionally show a 24×24 thumbnail next to each line item on digital receipts (not printed receipts — printer bandwidth is limited).

### 8.5 Performance Considerations

- **Lazy loading:** every `<img>` gets `loading="lazy"` and `decoding="async"`.
- **Responsive:** use `<picture>` with `srcset` for thumbnail/medium/large. Browsers pick the right size.
- **CDN:** R2/S3 + CloudFront in front. Cache-Control: `public, max-age=31536000, immutable` (filenames include a UUID, so updates create new URLs).
- **Database:** index `ProductImage(productId, sortOrder)` (already in spec).
- **Pagination:** product list endpoints should return `imageUrl` only (not the full `images` JSON) to keep payload small.

### 8.6 Acceptance Criteria

1. A merchant can upload a JPEG/PNG/WebP image from the Inventory edit dialog and see it appear in the POS within 5 seconds.
2. If no image is uploaded, the POS falls back to the existing Lucide icon.
3. At least 4 derivatives are generated (thumbnail/medium/large/original).
4. The bulk-import endpoint processes 1000 SKUs in under 5 minutes.
5. The AI image-generation endpoint produces a usable image for ≥70% of common spaza-shop product names.
6. Image URLs are served over HTTPS with immutable cache headers.
7. Deleting a product cascades to delete all its images from storage.
8. A merchant cannot see or upload images for another merchant's products (auth-context check).
9. Total storage cost per merchant ≤ R2 per month per 1000 products on Cloudflare R2 free tier.
10. The POS grid renders 50 images on a 3G connection in under 3 seconds (verified with Lighthouse).

---

*End of document. Total sections: 8. Total tables: 8. Total recommendations: 10 + 1 detailed spec.*
