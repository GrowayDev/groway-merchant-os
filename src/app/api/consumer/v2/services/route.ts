import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getConsumerAuth, isAuthError, ok, serverError, badRequest } from '@/lib/consumer-auth';
import {
  debitWallet, feeFor, WalletError, generateKey, earnLoyaltyPoints,
  generateElectricityToken, estimateUnits, reference, money,
} from '@/lib/consumer-wallet-service';
import { randomBytes } from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * GET /api/consumer/v2/services?category=bill  → providers catalogue
 */
export async function GET(request: NextRequest) {
  const auth = await getConsumerAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const category = request.nextUrl.searchParams.get('category');
    const providers = await db.billProvider.findMany({
      where: { status: 'active', ...(category ? { category } : {}) },
      orderBy: { name: 'asc' },
    });
    return ok({
      providers: providers.map((p) => ({
        id: p.id, name: p.name, category: p.category, accountLabel: p.accountLabel,
        accountFormat: p.accountFormat, minAmountCents: p.minAmount.toString(),
        maxAmountCents: p.maxAmount.toString(), feeCents: p.feeCents.toString(),
        processingTime: p.processingTime,
      })),
    });
  } catch (e) { console.error(e); return serverError(); }
}

/**
 * POST /api/consumer/v2/services
 * body: {
 *   serviceType: 'airtime' | 'data' | 'electricity' | 'water' | 'bill' | 'tv' | 'transport' | 'voucher',
 *   amountCents, providerId?, accountNumber?, bundle?, recipientPhone?, voucherBrand?
 * }
 * Real wallet debit + token generation + loyalty points + receipt.
 */
export async function POST(request: NextRequest) {
  const auth = await getConsumerAuth(request);
  if (isAuthError(auth)) return auth;

  try {
    const body = await request.json();
    const serviceType: string = body.serviceType;
    const amountCents = BigInt(body.amountCents ?? 0);
    if (amountCents <= 0n) return badRequest('Enter a valid amount');

    const catalog: Record<string, { label: string; category: string; feeKind: string }> = {
      airtime: { label: 'Airtime', category: 'airtime', feeKind: 'none' },
      data: { label: 'Data bundle', category: 'airtime', feeKind: 'none' },
      electricity: { label: 'Electricity', category: 'utilities', feeKind: 'electricity' },
      water: { label: 'Water', category: 'utilities', feeKind: 'bill' },
      bill: { label: 'Bill payment', category: 'bills', feeKind: 'bill' },
      tv: { label: 'TV subscription', category: 'entertainment', feeKind: 'bill' },
      transport: { label: 'Transport', category: 'transport', feeKind: 'none' },
      voucher: { label: 'Voucher', category: 'shopping', feeKind: 'none' },
    };
    const spec = catalog[serviceType];
    if (!spec) return badRequest('Unknown service type');

    // Daily / per-service caps (responsible service limits)
    if (amountCents > 500000n) return badRequest(`Maximum ${spec.label.toLowerCase()} purchase is R5,000`);

    // Provider validation
    let providerName = body.providerName;
    if (body.providerId) {
      const provider = await db.billProvider.findUnique({ where: { id: body.providerId } });
      if (!provider) return badRequest('Provider not found');
      if (amountCents < provider.minAmount) return badRequest(`Minimum amount is ${money(provider.minAmount)}`);
      if (amountCents > provider.maxAmount) return badRequest(`Maximum amount is ${money(provider.maxAmount)}`);
      providerName = provider.name;
      if (!body.accountNumber && ['electricity', 'water', 'bill', 'tv', 'transport'].includes(serviceType)) {
        return badRequest(`${provider.accountLabel} is required`);
      }
    }

    // Service-specific extras
    const extras: Record<string, string | undefined> = {};
    let description = '';
    switch (serviceType) {
      case 'airtime':
        description = `${body.providerName ?? 'Airtime'} — R${Number(amountCents) / 100}`;
        if (body.recipientPhone) description = `${description} for ${body.recipientPhone}`;
        break;
      case 'data':
        description = `${body.providerName ?? 'Data'} ${body.bundle ?? ''} bundle — R${Number(amountCents) / 100}`.trim();
        break;
      case 'electricity': {
        const token = generateElectricityToken();
        extras.voucherToken = token;
        extras.meterNumber = body.accountNumber;
        extras.unitsPurchased = estimateUnits(amountCents);
        description = `Eskom Prepaid — ${extras.unitsPurchased}`;
        break;
      }
      case 'water':
        description = `${providerName ?? 'Water'} — account ${body.accountNumber}`;
        extras.meterNumber = body.accountNumber;
        break;
      case 'bill':
        description = `${providerName ?? 'Bill'} — account ${body.accountNumber}`;
        break;
      case 'tv':
        description = `${providerName ?? 'TV'} — ${body.accountNumber}`;
        break;
      case 'transport':
        description = `${providerName ?? 'Transport'} top-up — R${Number(amountCents) / 100}`;
        break;
      case 'voucher':
        extras.voucherToken = `GV${randomBytes(5).toString('hex').toUpperCase()}`;
        extras.voucherExpiry = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);
        description = `${body.voucherBrand ?? providerName ?? 'Voucher'} gift voucher — R${Number(amountCents) / 100}`;
        break;
    }

    const fee = feeFor(spec.feeKind, amountCents);
    const txn = await debitWallet({
      userId: auth.userId,
      transactionType: serviceType,
      direction: 'debit',
      amountCents,
      feeCents: fee,
      description,
      category: spec.category,
      counterpartyName: providerName,
      counterpartyType: 'provider',
      paymentMethod: 'wallet',
      reference: reference(serviceType.slice(0, 3).toUpperCase()),
      voucherToken: extras.voucherToken,
      voucherExpiry: extras.voucherExpiry,
      meterNumber: extras.meterNumber,
      unitsPurchased: extras.unitsPurchased,
      idempotencyKey: body.idempotencyKey || generateKey('svc'),
    });

    // Loyalty: earn points on purchases
    const loyalty = await earnLoyaltyPoints(auth.userId, amountCents).catch(() => null);

    // Record bill payment row for bill-ish services
    if (body.providerId && ['bill', 'tv', 'water', 'electricity', 'transport'].includes(serviceType)) {
      await db.billPayment.create({
        data: {
          id: `bp-${randomBytes(8).toString('hex')}`,
          userId: auth.userId,
          providerId: body.providerId,
          accountNumber: String(body.accountNumber ?? ''),
          amountCents,
          feeCents: fee,
          reference: txn.reference,
          status: 'completed',
          externalRef: txn.id,
          receiptNumber: `RCPT-${Date.now().toString(36).toUpperCase()}`,
          processedAt: new Date(),
          updatedAt: new Date(),
        },
      }).catch(() => null);
    }

    return ok({
      transaction: {
        id: txn.id,
        type: txn.transactionType,
        amountCents: txn.amountCents.toString(),
        feeCents: txn.feeCents.toString(),
        netAmountCents: txn.netAmountCents.toString(),
        description: txn.description,
        reference: txn.reference,
        voucherToken: txn.voucherToken,
        voucherExpiry: txn.voucherExpiry,
        meterNumber: txn.meterNumber,
        unitsPurchased: txn.unitsPurchased,
        createdAt: txn.createdAt,
      },
      loyaltyEarned: loyalty?.points ? null : null, // points already incremented
      message: `${spec.label} purchase successful`,
    });
  } catch (e) {
    if (e instanceof WalletError) {
      return NextResponse.json({ success: false, error: e.message, code: e.code }, { status: e.status });
    }
    console.error('service purchase error', e);
    return serverError();
  }
}
