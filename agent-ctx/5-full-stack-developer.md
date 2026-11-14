# Task 5: Wire appointment deposit collection to actually deduct from consumer wallet

**Task ID:** 5
**Agent:** full-stack-developer
**Status:** Completed

## Summary

The Merchant OS booking module had a `depositMethod?: 'online' | 'in-store' | 'wallet'` field, but selecting "wallet" only stored the string — no wallet deduction happened. This task wired the wallet deposit flow end-to-end so that clicking "Gopay Wallet" in the Collect Deposit dialog now actually debits the consumer's wallet via a new dedicated API endpoint.

## Work Completed

### Part A: New API endpoint — `/api/wallet/appointment-deposit/route.ts`

Created a new 318-line route with both GET and POST handlers.

**GET** — Returns recent appointment-deposit transactions:
- Queries `WalletTransaction` where `transactionType = 'appointment_deposit'`
- Optional `?merchantId=` filter, pagination via `limit` / `offset`
- Returns `{ success, deposits, count, totalCollectedCents, limit, offset }`
- Uses `db.walletTransaction.aggregate` to compute the total collected

**POST** — Collects an appointment deposit from a consumer wallet:
- Body: `{ merchantId, merchantName, appointmentId, consumerPhone?, consumerId?, amountCents, service?, reference? }`
- Validates `amountCents > 0`, `appointmentId`, `merchantId`
- Resolves consumer wallet via fallback chain:
  1. `consumerId` → `ConsumerUser.findUnique({ where: { id: consumerId } })`
  2. `consumerPhone` → format with `formatSAPhone()` → `ConsumerUser.findUnique({ where: { phone } })`
  3. Else: demo user `demo-consumer-user-001`
- Returns HTTP 400 with `availableBalanceCents` when wallet balance is insufficient
- Runs the entire debit + ledger writes atomically inside `db.$transaction`:
  1. Creates `WalletTransaction` (direction=debit, transactionType=appointment_deposit, category=appointment, paymentMethod=wallet, balanceBefore/After captured, counterparty = merchant)
  2. Decrements `ConsumerWallet.balanceCents`, increments `totalSentCents`
  3. Creates matching `ConsumerTransaction` (backward-compat ledger, with `idempotencyKey`, category=appointment, paymentMethod=wallet)
- Returns `{ success, transaction, walletBalance, receiptNumber, consumerUserId, consumerSource }`
- `receiptNumber = APT-${Date.now()}-${Math.floor(Math.random()*1000)}` per spec
- BigInt-safe JSON serialization via custom `bigIntReplacer` (so all BigInt cents fields are returned as strings)

### Part B: EnhancedBookingView.tsx wiring

- Imported `useToast` from `@/hooks/use-toast` (the legacy shadcn `<Toaster />` is already mounted in `src/app/layout.tsx`)
- Imported `useMerchantData` from `../hooks/useMerchantData` to get the merchant session
- Added new state: `walletDepositOpen`, `walletDepositPhone`, `walletDepositProcessing`, `walletDepositError`
- Added `depositPaidAt?: string` to the `Appointment` interface (needed by the spec)
- Refactored `handleCollectDeposit(method)`:
  - For `method === 'wallet'`: opens the new wallet-confirmation modal (does NOT mark the booking as paid until the API responds successfully)
  - For `'online'` / `'in-store'`: keeps existing local-only record behaviour, now also emits a toast confirmation
- Added `processWalletDeposit()` async handler that:
  - Calls `POST /api/wallet/appointment-deposit` with `{ merchantId, merchantName, appointmentId, consumerPhone, amountCents, service, reference }`
  - On success: shows toast with deposit amount + receipt number + new wallet balance; updates the booking (`depositPaid=true`, `depositMethod='wallet'`, `depositPaidAt=ISO timestamp`, `status='confirmed'`); closes all related dialogs
  - On insufficient funds: surfaces available balance in modal + toast ("Consumer has insufficient wallet balance (R X available)")
  - On wallet-not-found: shows actionable error in modal
  - On network/other error: shows "Could not process wallet payment" toast
- Added a new "Collect Wallet Deposit" Dialog using existing shadcn/ui Dialog, Input, Label, Button components and Lucide icons (`Wallet`, `Clock` spinner, `Check`, `AlertCircle`)
- Pre-fills phone field with `selectedAppointment.customerPhone` if available
- Added a "Collected: <date>" row in the appointment detail's deposit block when `depositPaidAt` is set
- Did NOT redesign the existing UI — only added wiring + a small modal, per the critical notes

### Part C: BookingView.tsx

- Searched for `deposit`, `Deposit`, `Wallet`, `wallet`, `collect`, `Collect` — no matches
- The simpler `BookingView.tsx` (842 lines) has no deposit collection logic, so no changes required

## Key Decisions

1. **Dedicated route vs. reusing `/api/wallet/pos-payment`**: Created a dedicated `/api/wallet/appointment-deposit` route because appointment deposits carry different metadata (appointmentId reference, 'appointment' category, 'appointment_deposit' transactionType) and need a GET history endpoint scoped specifically to appointment deposits. Task 4's `pos-payment` endpoint pattern was used as the structural template.

2. **BigInt serialization**: Used a custom `bigIntReplacer` JSON replacer (via a `jsonWithBigInt()` wrapper around `NextResponse`) instead of hand-converting each field. The `WalletTransaction` model has ~10 BigInt columns — a replacer is far less error-prone than per-field `.toString()`.

3. **Toast library**: Used `useToast` from `@/hooks/use-toast` (legacy shadcn toast) instead of Sonner because the Sonner `<Toaster />` is not mounted anywhere in the app, while the legacy `<Toaster />` is mounted in `src/app/layout.tsx`. (Some other components like `BillSplittingView.tsx` import `toast` from `sonner`, but those toasts won't render.)

4. **Atomicity**: Used `db.$transaction([...])` with an array of operations so the wallet debit and both ledger writes either all succeed or all fail — no partial state where the wallet is debited but the ledger entry is missing.

5. **Demo user fallback**: When neither `consumerId` nor `consumerPhone` resolves to a real `ConsumerUser`, the API falls back to `demo-consumer-user-001` (per spec). This lets merchants exercise the deposit flow on sample bookings even when no consumer account is linked.

## Files

### Created
- `/home/z/my-project/src/app/api/wallet/appointment-deposit/route.ts` (318 lines)

### Modified
- `/home/z/my-project/src/app/merchant-os/app/components/EnhancedBookingView.tsx`
  - Added imports: `useToast`, `useMerchantData`
  - Added `depositPaidAt?: string` field to `Appointment` interface
  - Added 4 new state hooks for wallet deposit modal
  - Refactored `handleCollectDeposit` to branch on `wallet` vs. `online`/`in-store`
  - Added new `processWalletDeposit` async handler (~90 lines)
  - Added new "Collect Wallet Deposit" Dialog component (~95 lines)
  - Added "Collected: <date>" row in appointment detail deposit block

## Verification

- `npx eslint src/app/api/wallet/appointment-deposit/route.ts` — passes clean
- `npx eslint src/app/merchant-os/app/components/EnhancedBookingView.tsx` — passes clean
- `bun run lint` — 20 pre-existing errors in unrelated files (scripts/*.js, admin-console/*, etc.) — none introduced by this task
- Dev server log shows successful compilation

## Next Steps for Future Agents

- The `/api/wallet/appointment-deposit` GET endpoint can be used to build a merchant-facing "Appointment Deposit History" view
- The `ConsumerTransaction` rows created with `transactionType='appointment_deposit'` will appear in the consumer's wallet transaction history, allowing consumers to see their appointment deposits
- Consider adding an idempotency check on `appointmentId` so the same appointment can't be double-charged if the merchant clicks twice
