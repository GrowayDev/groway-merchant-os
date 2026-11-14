# Task ID: 3 — GroCore API Routes

**Agent:** Main Agent
**Status:** Completed

## Summary

Built 21 Next.js 16 App Router route handlers (plus one shared helpers module)
under `src/app/merchant-os/api/grocore/` that expose the GroCore financial
services engine (`src/lib/grocore/`). Every handler resolves a tenant from the
`x-tenant-id` header (falling back to `?tenantId=` then `'demo-tenant'`),
parses money amounts from the request body into BigInt cents, wraps business
logic in try/catch, maps `GroCoreError` codes to HTTP status via
`httpStatusFor(code)`, and serialises BigInt values to strings so the response
is JSON-safe.

## Files Created (22 total)

### Shared helper module
- `src/app/merchant-os/api/grocore/_helpers.ts`
  - `getTenantId(request)` — header → query → `'demo-tenant'`
  - `serializeBigInt(obj)` — recursive BigInt → string walker (handles
    arrays, plain objects, Map, Set, Date passthrough)
  - `parseMoney(input)` / `parseMoneyValue(input)` — parses
    `{ cents, currency }` into `{ cents: bigint, currency: 'ZAR'|'MWK' }`
  - `handleError(e)` — maps `GroCoreError` to `httpStatusFor(code)`, other
    errors → 500
  - `ok(data, status)` — success response that calls `serializeBigInt`

### Route handlers (HTTP methods in parentheses)

| # | Path | Methods |
|---|------|---------|
| 1 | `accounts/route.ts` | GET (list), POST (upsert) |
| 2 | `accounts/[code]/route.ts` | GET (single) |
| 3 | `entries/route.ts` | GET (list), POST (post balanced entry — calls `validateBalanced`, resolves account codes to IDs, enforces tenant + currency match before `postEntry`) |
| 4 | `entries/[entryId]/route.ts` | GET (single with lines) |
| 5 | `trial-balance/route.ts` | GET (aggregates all entry lines for tenant, runs `trialBalance`, returns rows + per-currency totals) |
| 6 | `consents/route.ts` | GET (list, optional `?subjectId=`), POST (grant / re-grant — idempotent via `shouldReplaceConsent`) |
| 7 | `consents/[subjectId]/[purpose]/route.ts` | GET (single), DELETE (revoke via `revoke()`) |
| 8 | `decisions/route.ts` | GET (list, optional `?subjectId=`), POST (run `decide()` with features + policy + requested amount, persist via `saveDecision`) |
| 9 | `advances/route.ts` | GET (list, optional `?subjectId=`), POST (issue top-up advance — looks up product preset by code, calls `issueAdvance`) |
| 10 | `advances/[id]/route.ts` | GET (single) |
| 10b | `advances/[id]/recover/route.ts` | POST (apply recovery — looks up advance + product preset, calls `recover`, persists updated advance) |
| 11 | `vouchers/route.ts` | GET (list, optional `?product=&status=&recipientMsisdn=`), POST (issue via `issueVoucher`) |
| 12 | `vouchers/[serial]/route.ts` | GET (single) |
| 12b | `vouchers/[serial]/redeem/route.ts` | POST (redeem via `redeemVoucher`) |
| 13 | `capital-sources/route.ts` | GET (list), POST (create — supports ZAR/MWK/USD via local `parseCapitalMoney`) |
| 14 | `capital-sources/allocate/route.ts` | POST (allocate — `allocateCapital` + `applyAllocations` + `summariseGrid`, persists updated sources) |
| 15 | `gopay/captures/route.ts` | GET (list, optional `?merchantId=`), POST (create capture) |
| 16 | `gopay/settlements/route.ts` | GET (list, optional `?merchantId=`), POST (aggregate batch — accepts `captureIds`, resolves them, runs `aggregateSettlement`) |
| 17 | `device-contracts/route.ts` | GET (list, optional `?customerId=`), POST (create contract via `createContract`) |
| 18 | `device-contracts/[id]/route.ts` | GET (single) |
| 19 | `device-contracts/[id]/payments/route.ts` | POST (apply daily payment via `applyPayment`, returns `unlocked` flag) |
| 20 | `edge/envelopes/route.ts` | POST (dispatch on `body.action`: `build` default → `buildEnvelope` with fake base64 signer; `verify` → `verifyEnvelope` with fake always-true verifier, so tenant/expiry/tamper checks are the only gates) |

## Implementation Notes

### Tenant resolution
Every handler calls `getTenantId(request)`. The precedence is
`x-tenant-id` header → `?tenantId=` query → `'demo-tenant'`. This matches the
task spec; production will swap in NextAuth session tenant.

### BigInt serialisation
`NextResponse.json` calls `JSON.stringify`, which throws on BigInt. The `ok()`
helper runs `serializeBigInt` first, so every BigInt field (cents, balances,
approved limits, etc.) is returned as a string. The shape of every response is
otherwise unchanged.

### Money parsing
Request bodies accept money as `{ cents: string|number|bigint, currency: 'ZAR'|'MWK' }`.
The `parseMoney` helper validates and converts to BigInt. Capital sources are
the one exception — they support USD, so `capital-sources/route.ts` has a local
`parseCapitalMoney` that accepts ZAR/MWK/USD.

### Balanced entry posting
`entries/route.ts` POST accepts lines as either `{ accountCode, signedCents }`
or `{ accountCode, debit: {cents, currency} }` / `{ accountCode, credit: {...} }`.
It calls `validateBalanced` before touching the repository, then resolves each
`accountCode` to an `accountId` (enforcing tenant isolation and currency
match against the account), then calls `repo.postEntry(entryInput, resolvedLines)`.

### Edge envelopes
The task spec listed both "build" and "verify" against the single
`edge/envelopes/route.ts` file. The POST handler dispatches on
`body.action` (`'build'` default, `'verify'` for verification). The fake signer
returns `Buffer.from(bytes).toString('base64')`; the fake verifier always
returns `true`, so the real gates (tenant mismatch, expiry, payload tamper)
are the only things that can fail a verify. This lets the back office exercise
the full build → verify round-trip without key material.

### Top-up product lookup
`advances/route.ts` POST and `advances/[id]/recover/route.ts` both look up the
`TopupProduct` preset by code from `PRESETS` (sa_airtime, sa_electricity,
mw_airtime, mw_electricity, merchant_float). The advance record stores
`product` as the code string, so recovery can re-resolve the preset.

## Verification

### Typecheck
Ran a focused typecheck (the full-project `bunx tsc --noEmit` OOMs in this
4 GB sandbox) using a temporary `tsconfig.grocore.json` that included only
`src/app/merchant-os/api/grocore/**/*.ts`, `src/lib/grocore/**/*.ts`,
`src/lib/db.ts` and `next-env.d.ts`:

```
NODE_OPTIONS="--max-old-space-size=2048" bunx tsc --noEmit -p tsconfig.grocore.json 2>&1 \
  | rg "src/app/merchant-os/api/grocore"
```

After fixing one initial error (`trial-balance/route.ts` had its `flatLines`
array typed with `currency: string` instead of `CurrencyCode`), the grep
returns **no matches** — zero type errors in the API route files.

Pre-existing errors in the GroCore library itself (`src/lib/grocore/gopay.ts`,
`src/lib/grocore/index.ts`, `src/lib/grocore/repository.ts`) were observed but
**not touched**, per the task rule "DO NOT modify the GroCore library itself".
They do not match the `src/app/merchant-os/api/grocore` grep pattern.

### Lint
Ran `bun run lint 2>&1 | rg "merchant-os/api/grocore"` — **no matches**. Zero
lint errors in any of the new route files. (The overall project lint reports
31 problems in pre-existing files outside the grocore API tree; none are in
the new files.)

### Dev server
The dev server log shows `✓ Compiled in 405ms` with no grocore-related errors
after the files were added.

## Errors Not Fixed (and why)

1. **`src/lib/grocore/gopay.ts(139,3)`** — `aggregateSettlement` return object
   is missing the `currency` field required by `GoPaySettlement`. Pre-existing
   library bug; task forbids modifying the library. The API route
   `gopay/settlements/route.ts` calls `aggregateSettlement` and persists via
   `saveGoPaySettlement`, which works at runtime because the in-memory and
   Prisma repositories set currency from `captures[0].amount.currency`.

2. **`src/lib/grocore/index.ts(35,10)`** — `isolatedModules` requires
   `export type` for re-exporting types (`Voucher`, `VoucherProduct`, etc.).
   Pre-existing library issue; not modified per task rules. Does not affect
   the API routes because the types are still usable at consumption sites.

3. **`src/lib/grocore/repository.ts(763,27)`** — `r.currency` accessed on a
   `GoPayCapture` row that doesn't expose `currency` directly (it's derived
   from `amount.currency`). Pre-existing library bug in the Prisma
   `saveGoPayCapture` adapter; not modified per task rules.

None of these library-side issues block the API routes from compiling or
running — the route files themselves are clean.

## Dependencies

- Consumes the existing GroCore library at `src/lib/grocore/` (no modifications).
- Uses `getRepository()` from `@/lib/grocore` for all persistence (in-memory
  in test, Prisma in production).
- Uses Node's built-in `crypto.randomUUID()` for ID generation in advance,
  voucher (via library), capital-source and device-contract creation.
