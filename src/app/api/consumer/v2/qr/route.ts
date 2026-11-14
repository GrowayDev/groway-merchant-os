import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getConsumerAuth, isAuthError, ok, serverError, badRequest } from '@/lib/consumer-auth';
import { signQrPayload, verifyQrPayload } from '@/lib/consumer-wallet-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/consumer/v2/qr — my receive QR (static, signed payload)
 */
export async function GET(request: NextRequest) {
  const auth = await getConsumerAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const user = await db.consumerUser.findUnique({
      where: { id: auth.userId },
      include: { ConsumerWallet: true },
    });
    if (!user) return badRequest('User not found');

    const payload = signQrPayload({
      v: 'groway-qr-2',
      userId: user.id,
      phone: user.phone,
      name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
      type: 'receive',
      currency: 'ZAR',
      ts: Date.now(),
    });

    // Persist/refresh static code record
    await db.consumerQR.upsert({
      where: { id: `qr-static-${user.id}` },
      update: { qrData: payload, updatedAt: new Date() },
      create: {
        id: `qr-static-${user.id}`,
        userId: user.id,
        qrType: 'personal_receive',
        qrData: payload,
        staticCode: true,
        status: 'active',
        updatedAt: new Date(),
      },
    }).catch(() => null);

    return ok({
      qrString: payload,
      profile: { name: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(), phone: user.phone },
      wallet: { balanceCents: user.ConsumerWallet?.balanceCents.toString() ?? '0' },
    });
  } catch (e) { console.error('qr get error', e); return serverError(); }
}

/**
 * POST /api/consumer/v2/qr — parse a scanned merchant QR and return
 * payment intent details (who, how much) before the user confirms.
 * body: { qrString }
 */
export async function POST(request: NextRequest) {
  const auth = await getConsumerAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const { qrString } = await request.json();
    const parsed = verifyQrPayload(String(qrString ?? ''));
    if (!parsed) {
      // fall back: unsigned merchant QR from merchant OS
      try {
        const merchantQr = JSON.parse(String(qrString));
        if (merchantQr.merchantId) {
          const merchant = await db.merchant.findUnique({ where: { id: merchantQr.merchantId } });
          if (merchant) {
            return ok({
              intent: {
                kind: 'merchant_payment',
                merchantId: merchant.id,
                merchantName: merchant.name,
                amountCents: merchantQr.amountCents ? String(merchantQr.amountCents) : null,
                reference: merchantQr.reference ?? null,
              },
            });
          }
        }
      } catch { /* not JSON */ }
      return badRequest('Invalid or tampered QR code');
    }

    if (parsed.type === 'receive') {
      const target = await db.consumerUser.findUnique({ where: { id: String(parsed.userId) } });
      if (!target) return badRequest('QR points to an unknown wallet');
      return ok({
        intent: {
          kind: 'p2p_send',
          counterpartyUserId: target.id,
          name: `${target.firstName ?? ''} ${target.lastName ?? ''}`.trim(),
          phone: target.phone,
        },
      });
    }

    if (parsed.type === 'merchant') {
      const merchant = await db.merchant.findUnique({ where: { id: String(parsed.merchantId) } });
      if (!merchant) return badRequest('Unknown merchant QR');
      return ok({
        intent: {
          kind: 'merchant_payment',
          merchantId: merchant.id,
          merchantName: merchant.name,
          amountCents: parsed.amountCents ? String(parsed.amountCents) : null,
          reference: (parsed.reference as string) ?? null,
        },
      });
    }

    return badRequest('Unsupported QR type');
  } catch (e) { console.error('qr post error', e); return serverError(); }
}
