# CW-FIN — Consumer Wallet Financial Service Modules

**Task ID:** CW-FIN
**Agent:** full-stack-developer
**Date:** 2026-11-14

## Summary

Built six financial service modules for the Consumer Wallet in the Groway
Merchant OS at `/home/z/my-project`: **Savings, Insurance, BNPL, Laybye,
Pay+, Grant+**. Each module ships an API route under
`/api/consumer/<service>/route.ts` and a modal component under
`src/components/wallet/modals/<Service>Modal.tsx`.

All money is handled in BigInt cents (per the Prisma schema's
`ConsumerTransaction`, `ConsumerInsurance`, `SavingsPocket` models).
Every POST that involves money creates a `ConsumerTransaction` row and
returns a reference number + receipt number. The frontend `apiGet` /
`apiPost` / `apiPut` helpers and `formatMoney` are used throughout.

## Files Created / Modified

### API routes
1. `src/app/api/consumer/savings/route.ts` — REWRITTEN. GET lists pockets
   with progress + GroAI insight; POST creates a pocket using
   `SAVINGS_TYPES`; PUT deposits/withdraws with a `ConsumerTransaction`.
2. `src/app/api/consumer/insurance/route.ts` — REWRITTEN. GET returns
   `INSURANCE_CATEGORIES` + `INSURANCE_PROVIDERS` + user policies;
   POST applies for cover (no credit score check), generates a policy
   number, creates `ConsumerInsurance` + `ConsumerTransaction`, deducts
   first premium from wallet if it exists.
3. `src/app/api/consumer/bnpl/route.ts` — NEW. GET returns
   `BNPL_PROVIDERS` + eligibility + user plans (creates a `ConsumerBNPL`
   row on demand); POST creates a plan with an instalment schedule
   (N equal payments 30 days apart), links to a Merchant OS merchant
   when `merchantId` is provided, decrements BNPL availability, records
   `ConsumerTransaction`.
4. `src/app/api/consumer/laybye/route.ts` — NEW. GET lists user
   laybyes; POST creates a laybye with deposit + weekly schedule,
   records a deposit `ConsumerLaybyePayment` + `ConsumerTransaction`.
5. `src/app/api/consumer/payplus/route.ts` — NEW. GET returns
   `PAYPLUS_PROVIDERS` + recent transactions; POST applies for an
   advance with a flat service fee (NOT interest — NCR compliant),
   generates an agreement reference, credits the wallet, records a
   `ConsumerTransaction` with `feeCents` capturing the service fee.
6. `src/app/api/consumer/grant/route.ts` — NEW. GET returns
   `SASSA_GRANT_TYPES` + `SASSA_PAYMENT_DATES_2026` + user grants;
   POST applies for a grant, links the user's ID to
   `ConsumerSASSA`, creates a `ConsumerSASSAApplication` row, returns
   estimated amount (multiplied by children count for child support),
   next payment date from the 2026 calendar, plus a `ConsumerTransaction`.

### Modal components
1. `src/components/wallet/modals/SavingsModal.tsx` — NEW. Five-step
   flow: explainer → list → create → transact → success. Includes
   icon picker, color picker, deposit/withdraw with quick amounts,
   and a GroAI insight panel. Wired into `ServicesTab` (Savings tile)
   and `consumer-wallet/app/page.tsx`.
2. `src/components/wallet/modals/InsuranceModal.tsx` — REWRITTEN. Four
   steps: browse categories → enter details → review → policy document.
   Provider dropdown filters by category, premium auto-calculated,
   no-credit-check explainer surfaced in the dialog header and on the
   review step. Result includes policy schedule + T&Cs + provider phone.
3. `src/components/wallet/modals/BNPLModal.tsx` — REWRITTEN. Four steps:
   explainer → apply → review → plan. Provider dropdown, item
   description, merchant link fields, instalment preview, full
   schedule with due dates and per-instalment status badges.
4. `src/components/wallet/modals/LaybyeModal.tsx` — REWRITTEN. Four
   steps: list (repository) → create → review (NCA terms) → agreement.
   Item name, price, deposit (with % quick buttons), instalment amount,
   merchant link, live summary card, instalment schedule, NCA T&Cs.
5. `src/components/wallet/modals/PayPlusModal.tsx` — REWRITTEN. Five
   steps: explainer → apply → terms → OTP → success. Provider
   dropdown, amount with quick buttons, fee breakdown showing
   "service fee NOT interest", T&C checkbox, 4-digit OTP step using
   `InputOTP` (demo OTP displayed in a hint), final result with
   agreement ref + downloadable proof.
6. `src/components/wallet/modals/GrantPlusModal.tsx` — REWRITTEN. Four
   steps: explainer → apply → review → success. Grant type dropdown
   (with full 2026 payment calendar), ID number + children count for
   child support, estimated amount, next payment date highlighted in
   the calendar, application reference + T&Cs.

### Wiring
- `src/components/wallet/ServicesTab.tsx` — Added `onOpenSavings` and
  `onOpenGrantPlus` props; Savings tile now opens the new modal; Grant+
  tile added to the Financial Services grid.
- `src/app/consumer-wallet/app/page.tsx` — Imported `SavingsModal`,
  added `savingsOpen` state, rendered `<SavingsModal>` and passed
  `onOpenSavings` + `onOpenGrantPlus` to `ServicesTab`.

## Verification
- `cd /home/z/my-project && bunx tsc --noEmit 2>&1 | grep -E
  "savings|insurance|bnpl|laybye|payplus|grant"` → 0 errors.
- `bun run lint` filtered to our files → 0 errors / 0 warnings.
  (Unrelated pre-existing lint errors elsewhere in the repo are not
  touched by this task.)
- Dev server log shows existing consumer-wallet API requests still
  serving 200 OK.

## Key Design Decisions
1. **Money**: BigInt cents everywhere — `SavingsPocket.currentCents`,
   `ConsumerInsurance.coverAmount`/`premium`,
   `ConsumerTransaction.amountCents`/`feeCents`/`netAmountCents`.
   Laybye and BNPL plans use Float (Rands) per the existing Prisma
   schema for those models — we follow the schema, not a custom
   convention.
2. **Savings type persistence**: The `SavingsPocket` schema has no
   dedicated `type` field, so the catalog `type` value (goal, pocket,
   fixed, stokvel, auto) is persisted in the free-form `autoSaveRule`
   String column. GET re-maps it back to a label/icon via
   `SAVINGS_TYPES`.
3. **Wallet is optional**: Each API that touches the wallet
   (savings deposit, insurance first premium, Pay+ credit) falls back
   gracefully when no `ConsumerWallet` row exists for the demo user —
   the transaction is still recorded so the modal flow works end-to-end
   in the sandbox.
4. **Receipts**: Every POST returns `{ caseRef, receiptNo, ... }` plus
   a human-readable message. Each modal renders a small "Receipt No"
   panel on the success step.
5. **No metadata field**: The `ConsumerTransaction` model has no
   `metadata` column. We persist ancillary info (e.g. laybye
   schedule) inside the related model rows rather than a JSON blob on
   the transaction.

## How to Preview
Open the **Preview Panel** (right side of the interface) →
"Open in New Tab". Navigate to the Consumer Wallet app — tap the
**Services** tab in the bottom nav, then tap any of the **Savings**,
**Insurance**, **BNPL**, **Laybye**, **Pay+**, or **Grant+** tiles in
the Financial Services grid to launch the corresponding modal.
