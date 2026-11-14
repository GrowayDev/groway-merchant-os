# CW-BILLS — Bills & Utilities + Airtime modules

## Task
Build both the API routes AND the modal components for the Bills & Utilities
(Electricity, Municipal, Traffic Fines) and Airtime modules of the Consumer
Wallet in the Groway Merchant OS at `/home/z/my-project`.

## Stack
- Next.js 16 App Router, TypeScript, Prisma 6 (SQLite)
- API helpers: `getUserId`, `ok`, `error`, `serialize`, `parseMoney` (from `src/app/api/consumer/_lib/helpers.ts`)
- Frontend API helper: `apiGet`, `apiPost`, `formatMoney` (from `src/components/wallet/lib/api.ts`)
- Catalog at `src/lib/consumer-wallet/catalog.ts`
- shadcn/ui components (`Dialog`, `Tabs`, `Button`, `Input`, `Label`, `Badge`, `Card`)

## What was built

### 1. Shared helper
- `src/app/api/consumer/_lib/ensureUser.ts`
  - SQLite enforces FK on `ConsumerTransaction.userId → ConsumerUser.id`.
    The demo flow has no real auth, so we upsert a stable `demo-consumer-user`
    (+ wallet with R1m demo balance) before creating any transaction.
    Idempotent — safe to call on every request.

### 2. Electricity API — `src/app/api/consumer/bills/electricity/route.ts`
- GET: returns `ELECTRICITY_PROVIDERS` from catalog, grouped by `ZA`/`MW`,
  plus quick amounts `[50,100,200,500,1000]` and recent transactions.
- POST `{ providerId, meterNumber, amount, phone }`:
  - Validates meter is **11 or 20 digits** (STS standard)
  - Generates 20-digit STS token via `generateSTSRechargeToken()`
  - Generates receipt via `generateReceiptNo('ELEC')`
  - Creates `ConsumerTransaction` (type=`bill_payment`, counterpartyType=`electricity_provider`)
    with `voucherToken` = STS token, `meterNumber`, `unitsPurchased` (kWh estimate)
  - Returns `{ receiptNo, stsToken, meterNumber, amount, provider, unitsKwh, instructions }`
  - Idempotency key + best-effort wallet debit

### 3. Municipal Bills API — `src/app/api/consumer/bills/municipal/route.ts`
- GET: returns `MUNICIPALITIES` from catalog grouped by country + recent payments.
- POST `{ municipalityId, accountNumber, amount, billType }`:
  - Account number 5-30 char validation
  - Generates receipt via `generateReceiptNo('MUN')`
  - Creates `ConsumerTransaction` (counterpartyType=`municipality`)
  - Returns receipt with municipality + billType details

### 4. Traffic Fines API — `src/app/api/consumer/bills/traffic-fines/route.ts`
- GET: returns `TRAFFIC_FINE_AUTHORITIES` grouped by country + recent payments.
- POST `{ authorityId, fineNumber, amount, vehicleReg }`:
  - Fine number 4-40 char validation
  - Generates receipt via `generateReceiptNo('FIN')`
  - Creates `ConsumerTransaction` (counterpartyType=`traffic_authority`,
    `reference` = fine number, `meterNumber` reused for vehicleReg)
  - Returns receipt with authority + instructions (AARTO reference)

### 5. Airtime API — `src/app/api/consumer/airtime/route.ts` (REPLACED)
- GET: returns `AIRTIME_PROVIDERS` from catalog with `voiceDenominations`
  and `dataBundles`, grouped by country + recent purchases.
- POST `{ providerId, phoneNumber, amount, type: 'voice'|'data', bundleId? }`:
  - **Voice**: generates 12-digit PIN via `generatePin()`, stores in `voucherToken`,
    sets 90-day `voucherExpiry`. Returns `{ receiptNo, pin, instructions }` incl.
    dial-string `*100*PIN#`.
  - **Data**: direct recharge — looks up bundle in catalog, no PIN, pushes to MSISDN.
    Returns `{ receiptNo, directRecharge: true, bundle, instructions }`.
  - Phone normalisation (ZA `0XX` → `+27XX`, MW default).
  - Creates `ConsumerTransaction` (type=`airtime`, category=`voice`|`data`,
    counterpartyType=`airtime_provider`).

### 6. Electricity Modal — `src/components/wallet/modals/ElectricityModal.tsx`
- Full flow: provider → meter → amount → confirm → result
- STS explainer banner ("STS is the global standard for prepaid electricity meters…")
- Provider dropdown grouped by country (ZA + MW)
- Meter input with live 11/20-digit validation
- Quick-select amounts (R50, R100, R200, R500, R1000)
- Result: large 20-digit STS token (formatted in 4-digit groups, copyable),
  receipt with receiptNo, meter number, amount, provider, kWh units, date, instructions

### 7. Municipal Modal — `src/components/wallet/modals/MunicipalBillsModal.tsx`
- Flow: municipality → account + billType → amount → confirm → receipt
- Bill type chips (Rates / Water / Electricity / Refuse / Other)
- Explainer ("post to account within 2 business days")

### 8. Traffic Fines Modal — `src/components/wallet/modals/TrafficFinesModal.tsx`
- Flow: authority → fine number + vehicle reg → amount → confirm → receipt
- Explainer about paying before court date + AARTO 48h reflection

### 9. Airtime Modal — `src/components/wallet/modals/AirtimeModal.tsx` (REPLACED)
- Tabs: **Voice Airtime | Data Bundles** (shadcn `Tabs`)
- Voice tab: provider → phone → denomination grid → confirm → voucher with 12-digit PIN
- Data tab: provider → phone → bundle list (with validity + price) → confirm → direct recharge confirmation
- Explainer comparing PIN voucher vs direct recharge
- Both tabs render receipt with all details + copyable PIN (voice) / direct-recharge banner (data)

## Cross-cutting design
- All POSTs create a `ConsumerTransaction` with proper metadata:
  `transactionType`, `direction='debit'`, `counterpartyType`, `counterpartyName`,
  `voucherToken`, `meterNumber`/`unitsPurchased` where relevant, `externalRef`=receiptNo.
- Money is always handled in **BigInt cents** (parseMoney converts).
- Idempotency: each POST derives an idempotency key from inputs + checks for existing row.
- Best-effort wallet debit (skips silently if wallet missing or insufficient — receipt stays valid).
- All modals use shadcn `Dialog`, `Card`, `Button`, `Input`, `Label`, `Badge` (+ `Tabs` for airtime).
- Country-aware currency: ZA → ZAR, MW → MWK.
- Explainer banners included on every modal per spec.

## Testing
- `bunx tsc --noEmit` — **no errors** in bills/airtime/electricity/municipal/traffic files
- `bunx eslint` on all new/modified files — exit 0
- Functional smoke test (invoked route handlers via bun with mocked Request):
  - GET /bills/electricity → 11 providers (8 ZA + 3 MW) + quick amounts
  - POST /bills/electricity → 201, `receiptNo=ELEC-…`, `stsToken`=20 digits, `unitsKwh`=21.74
  - POST /bills/municipal → 201, `receiptNo=MUN-…`, municipality=City of Johannesburg
  - POST /bills/traffic-fines → 201, `receiptNo=FIN-…`, authority=RTIA (AARTO)
  - GET /airtime → 6 providers
  - POST /airtime voice → 201, `receiptNo=AT-…`, 12-digit `pin`
  - POST /airtime data → 201, `directRecharge=true`, bundle name returned
  - POST /bills/electricity with invalid meter (3 digits) → 400 with correct error
- All 5 resulting `ConsumerTransaction` rows were inspected in the DB and had the
  right `voucherToken`, `meterNumber`, `unitsPurchased`, `externalRef` and `counterpartyType`.
  Test data was then cleaned up.

## Files created
- `src/app/api/consumer/_lib/ensureUser.ts`
- `src/app/api/consumer/bills/electricity/route.ts`
- `src/app/api/consumer/bills/municipal/route.ts`
- `src/app/api/consumer/bills/traffic-fines/route.ts`
- `src/components/wallet/modals/ElectricityModal.tsx`
- `src/components/wallet/modals/MunicipalBillsModal.tsx`
- `src/components/wallet/modals/TrafficFinesModal.tsx`

## Files updated
- `src/app/api/consumer/airtime/route.ts` — replaced with catalog-based API
- `src/components/wallet/modals/AirtimeModal.tsx` — replaced with tabbed Voice/Data flow

## Notes for future agents
- The existing `src/app/api/consumer/municipal-bills/route.ts` (with its own static
  provider list) was left untouched — the new `bills/municipal` route is the
  catalog-driven version per the task spec. Both can coexist; modals call the new one.
- The existing `src/app/api/consumer/bills/route.ts` (legacy bill providers + DB
  writes) was also left untouched. The three new sub-routes live under
  `/api/consumer/bills/{electricity,municipal,traffic-fines}`.
- `ensureUser.ts` is reusable — any new consumer POST route can call it to avoid
  FK violations when running without authenticated sessions.
