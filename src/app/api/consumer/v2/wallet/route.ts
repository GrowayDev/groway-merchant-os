import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getConsumerAuth, isAuthError, ok, serverError, badRequest } from '@/lib/consumer-auth';
import {
  debitWallet, creditWallet, feeFor, WalletError, generateKey,
  earnLoyaltyPoints, reference, getWalletSnapshot,
} from '@/lib/consumer-wallet-service';

export const dynamic = 'force-dynamic';

/**
 * POST /api/consumer/v2/wallet
 * body: { action: 'topup', amountCents, method? }
 *     | { action: 'send', amountCents, counterpartyPhone|counterpartyUserId, note? }
 *     | { action: 'withdraw', amountCents, bankName?, accountNumber? }
 */
export async function POST(request: NextRequest) {
  const auth = await getConsumerAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const amountCents = BigInt(body.amountCents ?? 0);
    if (amountCents <= 0n) return badRequest('Enter a valid amount');

    switch (body.action) {
      case 'topup': {
        const method = body.method || 'card';
        if (amountCents > 1_000_000n) return badRequest('Maximum top-up is R10,000 per transaction');
        const txn = await creditWallet({
          userId: auth.userId,
          transactionType: 'topup',
          direction: 'credit',
          amountCents,
          description: `Wallet top-up via ${method}`,
          category: 'topup',
          counterpartyType: method === 'card' ? 'card' : 'bank',
          paymentMethod: method,
          reference: reference('TOP'),
          idempotencyKey: generateKey('topup'),
        });
        return ok({ transaction: serialize(txn), message: 'Top-up successful' });
      }

      case 'send': {
        // Resolve counterparty by phone or userId
        let recipient = null;
        if (body.counterpartyUserId) {
          recipient = await db.consumerUser.findUnique({ where: { id: body.counterpartyUserId } });
        } else if (body.counterpartyPhone) {
          recipient = await db.consumerUser.findUnique({ where: { phone: body.counterpartyPhone } });
        }
        if (!recipient) return badRequest('Recipient not found on Groway Wallet');
        if (recipient.id === auth.userId) return badRequest('You cannot send money to yourself');

        const fee = feeFor('send_money', amountCents);
        const senderTxn = await debitWallet({
          userId: auth.userId,
          transactionType: 'send_money',
          direction: 'debit',
          amountCents,
          feeCents: fee,
          description: body.note ? `Sent to ${recipient.firstName} — ${body.note}` : `Sent to ${recipient.firstName} ${recipient.lastName ?? ''}`.trim(),
          category: 'transfer',
          counterpartyId: recipient.id,
          counterpartyName: `${recipient.firstName ?? ''} ${recipient.lastName ?? ''}`.trim(),
          counterpartyPhone: recipient.phone,
          counterpartyType: 'personal',
          paymentMethod: 'wallet',
          idempotencyKey: body.idempotencyKey || generateKey('send'),
        });

        await creditWallet({
          userId: recipient.id,
          transactionType: 'receive_money',
          direction: 'credit',
          amountCents,
          description: `Received from wallet user`,
          category: 'transfer',
          counterpartyId: auth.userId,
          counterpartyType: 'personal',
          paymentMethod: 'wallet',
          reference: senderTxn.reference ?? undefined,
          idempotencyKey: `${senderTxn.idempotencyKey}-credit`,
        });

        // Upsert beneficiary
        await db.beneficiary.upsert({
          where: { id: `ben-${auth.userId}-${recipient.id}` },
          update: { lastUsedAt: new Date(), useCount: { increment: 1 } },
          create: {
            id: `ben-${auth.userId}-${recipient.id}`,
            userId: auth.userId,
            name: `${recipient.firstName ?? ''} ${recipient.lastName ?? ''}`.trim() || recipient.phone,
            type: 'wallet',
            identifier: recipient.phone,
            lastUsedAt: new Date(),
            useCount: 1,
            updatedAt: new Date(),
          },
        }).catch(() => null);

        return ok({ transaction: serialize(senderTxn), message: `Sent to ${recipient.firstName} successfully` });
      }

      case 'withdraw': {
        const fee = feeFor('bank_withdraw', amountCents);
        const txn = await debitWallet({
          userId: auth.userId,
          transactionType: 'bank_withdraw',
          direction: 'debit',
          amountCents,
          feeCents: fee,
          description: `Withdraw to ${body.bankName || 'bank account'} ••••${String(body.accountNumber ?? '').slice(-4)}`,
          category: 'withdrawal',
          counterpartyType: 'bank',
          counterpartyName: body.bankName || null,
          paymentMethod: 'eft',
          idempotencyKey: generateKey('wdr'),
        });
        return ok({ transaction: serialize(txn), message: 'Withdrawal initiated — clears within 2 hours' });
      }

      default:
        return badRequest('Unknown action');
    }
  } catch (e) {
    if (e instanceof WalletError) {
      return NextResponse.json({ success: false, error: e.message, code: e.code }, { status: e.status });
    }
    console.error('wallet op error', e);
    return serverError();
  }
}

/** GET /api/consumer/v2/wallet — balance snapshot */
export async function GET(request: NextRequest) {
  const auth = await getConsumerAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const wallet = await getWalletSnapshot(auth.userId);
    if (!wallet) return badRequest('Wallet not found');
    return ok({ wallet });
  } catch (e) {
    console.error('wallet GET error', e);
    return serverError();
  }
}

function serialize(txn: {
  id: string; transactionType: string; direction: string; amountCents: bigint;
  feeCents: bigint; netAmountCents: bigint; status: string; description: string | null;
  category: string | null; counterpartyName: string | null; reference: string | null;
  voucherToken: string | null; createdAt: Date;
}) {
  return {
    id: txn.id,
    type: txn.transactionType,
    direction: txn.direction,
    amountCents: txn.amountCents.toString(),
    feeCents: txn.feeCents.toString(),
    netAmountCents: txn.netAmountCents.toString(),
    status: txn.status,
    description: txn.description,
    category: txn.category,
    counterpartyName: txn.counterpartyName,
    reference: txn.reference,
    voucherToken: txn.voucherToken,
    createdAt: txn.createdAt,
  };
}
