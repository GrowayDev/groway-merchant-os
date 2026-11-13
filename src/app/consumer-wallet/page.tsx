import { redirect } from 'next/navigation'

/**
 * /consumer-wallet — redirects to the wallet app.
 * The old monolithic page.tsx was deleted; the modular app at /consumer-wallet/app
 * is the canonical consumer wallet.
 */
export default function ConsumerWalletRedirect() {
  redirect('/consumer-wallet/app')
}
