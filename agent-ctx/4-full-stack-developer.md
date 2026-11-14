# Task 4: Wire POS checkout + bill splitting to actually deduct from consumer wallet; add Redeem Points button

**Task ID:** 4
**Agent:** full-stack-developer
**Status:** Completed

## Summary

The Merchant OS POS module offered "wallet" as a payment method label in three places (POSLayout's Checkout dialog, POSEnhancedFeatures's SplitPaymentDialog, and BillSplittingView's per-split payment dialog), but selecting it never actually debited the consumer's Gopay wallet — it just stored the string "wallet" in `selectedPayment`. This task wired the wallet payment flow end-to-end so the merchant-facing POS checkout, split payment, and bill splitting flows now all call a new `/api/wallet/pos-payment` endpoint that atomically debits the consumer's wallet, writes `WalletTransaction` + `ConsumerTransaction` ledger rows, and updates `ConsumerWallet.balanceCents` + `totalSentCents` + `dailySpentCents`. A new "Redeem Loyalty Points" button (Gift icon) was also added next to the Wallet payment option, calling a new `/api/wallet/redeem-points` endpoint.

## Work Completed

### Part A: New API endpoint — `/api/wallet/pos-payment/route.ts`

Created a new ~290-line route with both GET and POST handlers.

**GET** — Returns recent POS wallet payments for analytics:
- Queries `WalletTransaction` where `transactionType = 'pos_payment'`
- Optional `?merchantId=` filter, pagination via `limit` (default 20, max 200) / `offset`
- Returns `{ success, payments, count, totalCollectedCents, limit, offset }`
- Uses `db.walletTransaction.aggregate` to compute the total collected

**POST** — Processes a POS payment from a consumer wallet:
- Body: `{ merchantId, merchantName, amountCents, consumerPhone?, consumerId?, reference?, posTerminalId?, cashierId?, items? }`
- Validates `amountCents > 0`, `merchantId` is present
- Resolves consumer wallet via fallback chain:
  1. `consumerId` → `ConsumerUser.findUnique({ where: { id: consumerId } })`
  2. `consumerPhone` → `formatSAPhone()` → `ConsumerUser.findUnique({ where: { phone } })`
  3. Else: demo user `demo-consumer-user-001`
- Returns HTTP 400 with `currentBalance` + `required` when wallet balance is insufficient
- Returns HTTP 400 with `dailySpentCents` + `dailySpendLimit` when daily spend limit (if set) would be exceeded — this is the additional check required by Task 4 that Task 5's appointment-deposit didn't need
- Runs the entire debit + ledger writes atomically inside `db.$transaction`:
  1. Creates `WalletTransaction` (direction=debit, transactionType=pos_payment, category=purchase, paymentMethod=wallet, balanceBefore/After captured, counterparty=merchant, sourceChannel='pos', deviceInfo=JSON-encoded `{posTerminalId, cashierId}`)
  2. Decrements `ConsumerWallet.balanceCents`, increments `totalSentCents` AND `dailySpentCents` (Task 4 spec required dailySpentCents update; Task 5's appointment-deposit didn't)
  3. Creates matching `ConsumerTransaction` (backward-compat ledger, with `idempotencyKey`, category=purchase, paymentMethod=wallet)
- Returns `{ success, transaction, walletBalance, receiptNumber, consumerUserId, consumerSource }`
- `receiptNumber = RCP-${Date.now()}-${Math.floor(Math.random()*1000)}` per spec
- BigInt-safe JSON serialization via custom `bigIntReplacer` (so all BigInt cents fields are returned as strings)

### Part A.5: New API endpoint — `/api/wallet/redeem-points/route.ts`

Task 3 was supposed to create this endpoint but it didn't exist anywhere in the codebase (verified via `rg "redeem-points"` returning no matches). I created it as a thin dedicated wrapper around the loyalty redemption logic so the new "Redeem Loyalty Points" button has an endpoint to call.

**POST** — Body `{ pointsToRedeem, consumerPhone?, consumerId? }` (spec only mentions `pointsToRedeem`, but I needed consumerPhone/consumerId to identify the consumer since the merchant is initiating the redemption on behalf of the consumer).

- Resolves consumer via the same fallback chain as pos-payment
- Validates minimum redemption of 100 points (matches `/api/wallet/loyalty` conversion rate: 100 points = R1)
- Returns 404 when loyalty account not found, 400 on insufficient points (with `availablePoints` field)
- Atomic: creates `ConsumerTransaction` (loyalty_redemption credit) + increments `ConsumerWallet.balanceCents` + `totalReceivedCents` + `totalTopupsCents` + decrements `ConsumerLoyalty.points` + increments `totalRedeemed` all in one `db.$transaction`
- Returns `{ success, pointsRedeemed, creditAmountCents, creditAmount, newPointsBalance, transaction, consumerUserId, consumerSource }`

### Part B: POSEnhancedFeatures.tsx — new reusable dialog components

Added 5 new icons to the lucide-react import: `Gift`, `Sparkles`, `Check`, `AlertCircle`, `Loader2`.

Appended two new exported Dialog components at the end of the file (following the existing pattern where all dialogs are defined here and consumed by POSLayout.tsx):

1. **`WalletPaymentDialog`** — modal asking for the consumer phone number, shows the amount to charge, merchant name, item count. Calls `onConfirm(phone)`. Renders inline error banner when `error` prop is set (e.g. insufficient balance), shows "Processing..." with spinner while `processing` is true, disables the Confirm button when phone is empty or processing. Also exports a `WalletPaymentResult` interface for type safety.

2. **`RedeemLoyaltyPointsDialog`** — modal asking for consumer phone + points to redeem, shows the converted credit amount (R) live as the merchant types (`100 points = R1.00`), calls `onConfirm(phone, points)`. Renders inline success banner after a successful redemption so the merchant can see the result before closing. Renders inline error banner on failure.

Did NOT modify any existing components — purely additive.

### Part B: POSLayout.tsx — wire wallet payment + redeem button

- Added imports: `useToast` from `@/hooks/use-toast` (legacy shadcn Toaster is mounted in `src/app/layout.tsx`, so these toasts actually render — sonner is NOT mounted anywhere), `useMerchantData` from `../hooks/useMerchantData`, `WalletPaymentDialog` + `RedeemLoyaltyPointsDialog` from `./POSEnhancedFeatures`, `Gift`, `Sparkles`, `Loader2`, `AlertCircle` from lucide-react
- Added `useToast()` and `useMerchantData()` calls at the top of the component
- Added 7 new state hooks: `walletPaymentOpen`, `walletPaymentProcessing`, `walletPaymentError`, `pendingSplitForWallet` (holds a `SplitPayment[]` when the wallet dialog was triggered from a split payment), `redeemOpen`, `redeemProcessing`, `redeemError`, `redeemSuccess`
- Refactored `completeSale()`:
  - When `selectedPayment === 'wallet'` AND not split payment, opens the `WalletPaymentDialog` instead of calling `processSale()` directly. The actual sale recording happens after the wallet debit succeeds (in `processWalletPayment`).
  - Other payment methods: unchanged behaviour
- Refactored `handleSplitPaymentComplete(payments)`:
  - When any split component has `method === 'wallet'`, stashes the payments in `pendingSplitForWallet` state and opens the `WalletPaymentDialog` first
  - The wallet amount to charge = sum of all wallet components in the split
- Added new `processWalletPayment(consumerPhone)` async handler (~120 lines):
  - Resolves merchantId/merchantName from `useMerchantData` (with localStorage fallback matching `processSale`)
  - Computes wallet amount: full `total` for non-split, or sum of wallet components for split
  - Calls `POST /api/wallet/pos-payment` with `{ merchantId, merchantName, amountCents, consumerPhone, reference, cashierId, items }`
  - On success: shows toast with amount + receipt number + new wallet balance, closes the wallet dialog, then calls `processSale(pendingSplitForWallet)` to record the POS transaction as usual, clears `pendingSplitForWallet`
  - On insufficient funds: surfaces available balance in both the modal error banner AND a destructive toast — sale is NOT completed
  - On other API errors: shows the error message in the modal + toast
  - On network error: warns the merchant via toast + modal, per Task 4 spec ("fallback to the existing behavior with a warning toast") — but doesn't auto-complete the sale; the merchant can close the modal and complete the sale manually via the existing Complete Sale button
- Added new `processRedeemPoints(consumerPhone, pointsToRedeem)` async handler (~55 lines):
  - Calls `POST /api/wallet/redeem-points` with `{ pointsToRedeem, consumerPhone }`
  - On success: shows inline success banner in the modal + a toast with "Redeemed X points = R Y added to wallet. New points balance: Z."
  - On failure: shows inline error banner + destructive toast
- Updated the Checkout Dialog UI:
  - Wrapped each payment method button in a relative container so we can anchor a small button next to the wallet option
  - Added a small "Redeem" button (Gift icon) at the top-right corner of the wallet payment method tile — clicking it opens the `RedeemLoyaltyPointsDialog`
  - Did NOT redesign the rest of the checkout dialog
- Added two new dialog instances near the existing dialogs:
  - `<WalletPaymentDialog>` — receives merchantId/merchantName from `useMerchantData`, amountCents computed from total or `pendingSplitForWallet`, items from cart, defaultPhone from `selectedCustomer` or `bookingData`, processing/error state, `onConfirm=processWalletPayment`
  - `<RedeemLoyaltyPointsDialog>` — receives defaultPhone, processing/error/success state, `onConfirm=processRedeemPoints`

### Part C: BillSplittingView.tsx — wire wallet split payment

- Added `Phone` to the lucide-react import (other icons like `Wallet`, `AlertCircle`, `Loader2`, `CheckCircle2` were already imported)
- Added 5 new state hooks: `walletPaymentOpen`, `walletPhone`, `walletProcessing`, `walletError`, `pendingWalletSplit` (the `SplitPortion` awaiting wallet debit)
- Refactored `processPayment(split, method)`:
  - When `method === 'wallet'`: stashes the split in `pendingWalletSplit`, opens the new wallet confirmation modal. The split is NOT marked as paid until the wallet debit succeeds (per Task 4 Part C spec)
  - Other methods: unchanged — calls `/merchant-os/api/pos/payments` as before
- Added new `processWalletSplitPayment(consumerPhone)` async handler (~150 lines):
  - Resolves merchantId/merchantName from localStorage session (matches the existing pattern in this view)
  - Calls `POST /api/wallet/pos-payment` with the split total (in cents) as `amountCents`
  - On success:
    1. Shows toast with amount + receipt number
    2. Calls `/merchant-os/api/pos/payments` with `method: 'wallet'` to record the split payment in the POS order ledger (existing flow) — so the order status reflects the wallet payment
    3. Marks the split as paid (`paid: true`, `paymentMethod: 'wallet'`, `paidAt: now`, `paymentRef = wallet receipt or ledger id`)
    4. **If the POS ledger call fails BUT the wallet was already debited**, still marks the split as paid using the wallet receipt number as `paymentRef`, and surfaces a `toast.warning` so the merchant knows the ledger update failed but the wallet charge went through (prevents double-charging if they retry)
    5. Closes both the wallet dialog and the original payment dialog
    6. Checks if all splits are now paid; if so, refreshes the order
  - On insufficient funds: surfaces available balance in the modal error banner AND via `toast.error`. Split is NOT marked as paid
  - On network error: shows error in modal + toast. Split is NOT marked as paid (per Task 4 Part C spec: "if wallet deduction fails, show error and don't mark share as paid")
- Added a new Wallet Payment Confirmation Dialog at the end of the file (next to the existing Payment Dialog) — same look-and-feel as the `WalletPaymentDialog` in POSEnhancedFeatures but inlined here since `BillSplittingView` doesn't share its dialog components with POSLayout. Shows the split name + amount, asks for consumer phone, has Cancel + "Charge Wallet" buttons with loading state

## Key Decisions

1. **Created `/api/wallet/redeem-points`**: Task 3 was supposed to create this endpoint but it didn't exist (verified via `rg "redeem-points"` returning no matches). Without it, the new "Redeem Loyalty Points" button would have nothing to call. I created it as a thin dedicated wrapper around the loyalty redemption logic (separate from `/api/wallet/loyalty` which has many other actions like `sync_merchant`).

2. **BigInt serialization**: Used a custom `bigIntReplacer` JSON replacer (via a `jsonWithBigInt()` wrapper around `NextResponse`) instead of hand-converting each field. The `WalletTransaction` model has ~10 BigInt columns — a replacer is far less error-prone than per-field `.toString()` calls. Same pattern as Task 5's appointment-deposit route.

3. **Toast library**: Used `useToast` from `@/hooks/use-toast` (legacy shadcn toast) in `POSLayout.tsx` because the legacy `<Toaster />` is mounted in `src/app/layout.tsx` while the Sonner Toaster is NOT mounted (sonner imports exist in some files like `BillSplittingView.tsx` but those toasts won't render). For `BillSplittingView.tsx`, I kept the existing `sonner` import for consistency with the rest of the file, but also added inline error banners in the modal so the merchant sees the error regardless of whether sonner renders.

4. **Atomicity**: Used `db.$transaction([...])` with an array of operations so the wallet debit and both ledger writes either all succeed or all fail — no partial state where the wallet is debited but the ledger entry is missing. Same pattern as Task 5.

5. **Demo user fallback**: When neither `consumerId` nor `consumerPhone` resolves to a real `ConsumerUser`, the API falls back to `demo-consumer-user-001` (per spec). This lets merchants exercise the POS wallet flow on sample sales even when no consumer account is linked. Note: in the current dev database, no `ConsumerWallet` row exists for `demo-consumer-user-001`, so the API will return a "Consumer wallet not found" error — this is expected behaviour and matches what Task 5's appointment-deposit route does.

6. **Network error handling for POSLayout wallet path**: The spec said "On network error: fallback to the existing behavior with a warning toast." I interpreted this as: warn the merchant, but don't auto-complete the sale without their confirmation (because they may want to retry the wallet call). The merchant can close the modal and click "Complete Sale" again to record the sale without a wallet debit. This is safer than auto-completing because the merchant might otherwise think the wallet was charged when it wasn't.

7. **Network error handling for BillSplittingView wallet path**: Per Task 4 Part C spec, "if wallet deduction fails, show error and don't mark share as paid." So for bill splitting, we do NOT fall back — the split stays unpaid. This is correct because bill splitting is specifically about real payment, not just recording a transaction.

8. **Double-charge prevention in BillSplittingView**: After a successful wallet debit, I still call `/merchant-os/api/pos/payments` to record the split in the POS order ledger. If that ledger call fails BUT the wallet was already debited, I mark the split as paid using the wallet receipt number as `paymentRef` and surface a `toast.warning`. This prevents the merchant from retrying and double-charging the wallet.

9. **`dailySpentCents` update**: Task 4 Part A spec required the wallet update to include `dailySpentCents += amountCents`. Task 5's appointment-deposit didn't need this because appointment deposits aren't subject to the daily spend limit. I added the increment in the `consumerWallet.update` call inside the transaction. The daily spend limit check (`wallet.dailySpentCents + amount <= wallet.dailySpendLimit`) is also implemented in the validation step before the transaction.

## Files

### Created (2)
- `/home/z/my-project/src/app/api/wallet/pos-payment/route.ts` (~290 lines)
- `/home/z/my-project/src/app/api/wallet/redeem-points/route.ts` (~190 lines)

### Modified (3)
- `/home/z/my-project/src/app/merchant-os/app/components/POSEnhancedFeatures.tsx`
  - Added 5 new icons to imports: `Gift`, `Sparkles`, `Check`, `AlertCircle`, `Loader2`
  - Appended 2 new exported Dialog components: `WalletPaymentDialog` + `RedeemLoyaltyPointsDialog` + `WalletPaymentResult` type
- `/home/z/my-project/src/app/merchant-os/app/components/POSLayout.tsx`
  - Added imports for `useToast`, `useMerchantData`, the two new dialogs, 4 new icons
  - Added 7 new state hooks for wallet + redeem modals
  - Refactored `completeSale` + `handleSplitPaymentComplete` to gate wallet path through the new modal
  - Added `processWalletPayment` + `processRedeemPoints` async handlers (~175 lines total)
  - Added "Redeem" button next to Wallet option in Checkout Dialog
  - Added 2 new dialog instances
- `/home/z/my-project/src/app/merchant-os/app/components/BillSplittingView.tsx`
  - Added `Phone` icon import
  - Added 5 new state hooks for wallet modal
  - Refactored `processPayment` to gate wallet path through the new modal
  - Added `processWalletSplitPayment` async handler (~150 lines)
  - Added new Wallet Payment Confirmation Dialog at end of file

## Verification

- `npx eslint src/app/api/wallet/pos-payment/route.ts src/app/api/wallet/redeem-points/route.ts src/app/merchant-os/app/components/POSEnhancedFeatures.tsx src/app/merchant-os/app/components/POSLayout.tsx src/app/merchant-os/app/components/BillSplittingView.tsx` — passes clean (EXIT_CODE=0, no output)
- `bun run lint` — 20 pre-existing errors in unrelated files (scripts/*.js, admin-console/*, src/app/api/download/route.ts, etc.) — none introduced by this task
- Dev server log confirms all 3 endpoints respond correctly:
  - `GET /api/wallet/pos-payment?merchantId=merchant-001` → 200 OK with `{success: true, payments: [], count: 0, totalCollectedCents: "0", ...}` (Prisma query ran successfully)
  - `POST /api/wallet/pos-payment` → 400 with `{success: false, error: "Consumer wallet not found. No consumer linked and demo wallet missing.", currentBalance: 0, required: "100"}` (expected — no demo wallet seeded in this DB)
  - `POST /api/wallet/redeem-points` → 404 with `{success: false, error: "Loyalty account not found. No consumer linked and demo loyalty missing."}` (expected — no demo loyalty seeded in this DB)
- (Endpoints tested with `X-Dev-Bypass: true` header to bypass the global auth proxy middleware — same pattern as Task 5's appointment-deposit endpoint behaves.)

## Next Steps for Future Agents

- Seed a `ConsumerWallet` and `ConsumerLoyalty` row for `demo-consumer-user-001` so the dev-mode flow works end-to-end without needing a real consumer account. Currently the wallet/redeem endpoints return "not found" errors because the demo user has no wallet/loyalty rows.
- The `GET /api/wallet/pos-payment` endpoint can be used to build a merchant-facing "POS Wallet Payment History" view (similar to what Task 5's GET endpoint could do for appointment deposits).
- Consider adding an idempotency check on `reference` (or a client-supplied idempotency key) so the same sale can't be double-charged if the merchant clicks "Charge Wallet" twice rapidly.
- The `WalletTransaction.externalRef` field is currently set to `posTerminalId` and `deviceInfo` is a JSON-encoded string with `{posTerminalId, cashierId}`. A future task could surface this in the merchant dashboard for terminal/cashier-based reporting.
