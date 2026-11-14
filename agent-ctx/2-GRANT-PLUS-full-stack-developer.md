# Task 2-GRANT-PLUS: Rewrite Grant+ /api/sassa from in-memory mock to DB-backed

## Task Summary
Rewrote `/home/z/my-project/src/app/api/sassa/route.ts` (was 673 lines, 100% in-memory mock) to use Prisma DB models (`ConsumerSASSA`, `ConsumerSASSAApplication`, `ConsumerSASSAGrant`, `ConsumerWallet`, `ConsumerTransaction`). Submitted applications now persist across page reloads and server restarts.

## Work Completed

### 1. Replaced in-memory state with DB
- Removed module-level `let userSASSA`, `let applications`, `let paymentHistory` variables.
- Added `import { db } from '@/lib/db'` (shared singleton, NOT `new PrismaClient()`).
- All reads/writes now go through Prisma against SQLite (`dev.db`).

### 2. Seeding via `ensureDemoData()` helper
Pattern mirrors `/api/credit/route.ts` and `/api/bnpl/route.ts`. On first access it idempotently creates:
- `ConsumerUser` (if missing)
- `ConsumerWallet` (R2400 starting balance, BigInt cents)
- `ConsumerSASSA` record (linked=true, idNumber='6705055009088', status='active', totalMonthlyIncome=3240)
- 2 × `ConsumerSASSAGrant`:
  - `older_persons`: R2180 × 1 beneficiary = R2180, status='active'
  - `child_support`: R530 × 2 beneficiaries = R1060, status='active'
  - Total = R3240 (matches original frontend display)
- 1 historical `ConsumerSASSAApplication` (APP-2024-001234, child_support, approved)
- `nextPayment` is auto-advanced to the next FUTURE month if this month's payment date has already passed (so early-access stays usable for demo).

### 3. Preserved all API endpoints + response shapes
The frontend (`consumer-wallet/page.tsx` GrantPlusModal L4521-5354) was NOT modified. Verified field compatibility by reading the frontend code first.

**GET endpoints** (all return `{success, data}` shape identical to original):
- `(default)` — grantTypes list + userSASSA summary
- `?action=grant-types` — 8 grant types (static reference data)
- `?action=status` — linked, maskedIdNumber, status, grants[], totalMonthlyIncome, nextPaymentDate
- `?action=payment-calendar` — 12-month calendar based on ID last digit
- `?action=applications` — applications[] from DB + pending count
- `?action=payment-history&months=N` — derived from active grants
- `?action=early-access` — upcomingPayments derived from active grants
- `?action=check-eligibility` — static heuristic (preserved original behavior)
- `?action=status` is also accessible (frontend uses this)

**POST endpoints**:
- `action=link` — updates ConsumerSASSA.idNumber/linked/status in DB
- `action=apply` — creates ConsumerSASSAApplication with status='submitted', generates `APP-YYYY-XXXXXX` reference
- `action=check-application` — looks up by applicationId
- `action=early-access` — runs a Prisma `$transaction` that:
  1. Creates a `ConsumerTransaction` (type='sassa_advance', direction='in', BigInt cents)
  2. Increments `ConsumerWallet.balanceCents` + `totalReceivedCents` by netAmount
  3. Creates a `ConsumerSASSAApplication` with grantType='early_access', status='approved'

**PUT endpoints**:
- `action=update-beneficiaries` — updates ConsumerSASSAGrant.beneficiaries + totalAmount, recomputes ConsumerSASSA.totalMonthlyIncome

### 4. Bug fixes
- **Fixed line ~185 typo**: `monthNamesonth` → `monthNames[month - 1]` (now at line 174 in new file, with explicit comment). Previously `payment-calendar` returned month names like `"undefined 2026"`.
- **Fixed early-access id matching**: paymentId format is `PAY-CUR-{grantId}` in GET response; POST handler strips that prefix to look up the actual ConsumerSASSAGrant by id.
- **Fixed past-date issue**: original code used `calculatePaymentDates(currentYear, currentMonth, ...)` which produces a date in the PAST if the current month's payment day has already passed (e.g. today is July 26 but payment is July 4). Added `nextFuturePaymentDate()` helper that advances to the next month if needed.

### 5. BigInt handling
- `ConsumerTransaction.amountCents`, `feeCents`, `netAmountCents` and `ConsumerWallet.balanceCents` are BigInt in schema.
- Conversions: `BigInt(Math.round(rands * 100))` when writing, `Number(amountCents) / 100` when reading.
- `ConsumerSASSAGrant.amount` and `totalAmount` are Float (no conversion needed).
- The wallet credit uses Prisma's atomic `{ increment: BigInt(...) }` operator inside a `$transaction` for concurrency safety.

### 6. Response shape mappers
- `toGrantResponse(g)` — DB grant → frontend SASSAGrant shape (type/name/amount/beneficiaries/totalAmount/status/nextPayment/lastPayment/applicationDate)
- `toApplicationResponse(a)` — DB application → frontend SASSAApplication shape (id/type/grantName/status/submittedAt/documents/estimatedProcessingDays/processedAt)
- `maskIdNumber(id)` — produces `****5009****88` for demo ID `6705055009088` (reveals SA-ID gender sequence positions 6-9 + last 2 checksum digits — matches task spec exactly)
- `buildPaymentHistoryFromGrants(grants, months, lastDigit)` — derives current (pending) + previous (processed) payments from active grants

### 7. Backward-compatible additions
The early-access GET response now also includes `maxAdvance`, `nextPaymentDate`, `tier`, `serviceFee` fields (the frontend's renderEarlyAccess component reads these with fallback defaults). Original fields (`enabled`, `config`, `upcomingPayments`, `totalAdvanceable`) are unchanged — no breaking change.

## Verification Results

All 15 tests passed (curl against `http://localhost:3000/api/sassa`):

| Test | Endpoint | Result |
|------|----------|--------|
| 1 | GET ?action=status | 200, maskedId=****5009****88, 2 grants, total R3240 |
| 2 | GET ?action=grant-types | 200, 8 grant types |
| 3 | GET ?action=payment-calendar | 200, 12 months with correct names (NOT "undefined") |
| 4 | GET ?action=payment-history&months=3 | 200, 6 payments, totalReceived=R6480 |
| 5 | GET ?action=early-access | 200, 2 upcoming payments, totalAdvanceable=R2754 |
| 6 | GET ?action=applications | 200, 1 seeded app, pending=0 |
| 7 | GET (default) | 200, 8 grant types + userSASSA summary |
| 8 | POST action=apply (disability) | 200, APP-2026-814511, status=submitted |
| 9 | GET ?action=applications (after apply) | 200, **2 apps now** — apply persisted |
| 10 | POST action=early-access | 200, advanceAmount=R1853, fee=R46.33, net=R1806.67 |
| 11 | GET /api/wallet/balance (after early-access) | Balance went R2400 → **R4206.67** (wallet credited) |
| 12 | GET ?action=applications (after early-access) | 200, **3 apps** — early_access app type=early_access, status=approved |
| 13 | PUT action=update-beneficiaries (child_support 2→3) | 200, totalAmount=R1590 |
| 14 | GET ?action=status (after PUT) | 200, totalMonthlyIncome=R3770 (persisted) |
| 15 | POST action=link (new ID 8901234567089) | 200, maskedId=****4567****89 |

### **KEY PERSISTENCE TEST (the bug fix)**
Killed the dev server entirely, restarted it, then re-hit the endpoints:
- **Applications**: All 4 apps survived (APP-2024-001234, APP-2026-814511, APP-EA-2026-897565, APP-2026-954312)
- **Grants**: beneficiary update persisted (child_support: 3 beneficiaries, R1590)
- **Wallet balance**: R4206.67 (early-access credit persisted)

**This is the core bug fix**: previously data was lost on page refresh because the route used module-level `let` variables. Now all data is in SQLite via Prisma.

### Error handling verified
- POST apply with invalid grantType → 400 `{"success":false,"error":"Invalid grant type"}`
- POST early-access with bad paymentId → 400 `{"success":false,"error":"No upcoming payment found"}`
- POST early-access with past payment date → 400 `{"success":false,"error":"Early access only available 5+ days before payment"}`

## Files Modified
- `/home/z/my-project/src/app/api/sassa/route.ts` — full rewrite (673 lines → ~1130 lines, all DB-backed)
- No frontend changes (consumer-wallet/page.tsx untouched, as required)
- No schema changes (ConsumerSASSA/ConsumerSASSAApplication/ConsumerSASSAGrant models already existed)
- Worklog appended (see below)

## Lint
`bun run lint` reports zero errors specific to the new `/api/sassa/route.ts`. Pre-existing lint errors in unrelated files (admin-console, etc.) remain unchanged.

## Notes
- The dev server has limited memory (3.9GB total) and Turbopack + Prisma client init on first compile of the new route can OOM-kill next-server in rare cases. On subsequent compiles the route is cached and runs fast (15-25ms render). The route itself is correct — this is an environment constraint.
- The original mock had hardcoded `maskedIdNumber: '****5009****88'` but its mask function (`slice(4,8)+slice(-2)`) actually produced `'****0550****88'` — an inconsistency in the original code. The new `maskIdNumber` uses `slice(6,10)+slice(-2)` which produces `'****5009****88'` (matching the task spec and the original mock's hardcoded display value).
- Payment history is derived dynamically from active grants (not stored in a separate table) because the schema has no `ConsumerSASSAPayment` model. This matches the original mock's behavior of generating payments on-the-fly.
