import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { getConsumerAuth, isAuthError, ok, serverError, badRequest } from '@/lib/consumer-auth';

export const dynamic = 'force-dynamic';

/** GET /api/consumer/v2/cards — list virtual + physical cards (masked) */
export async function GET(request: NextRequest) {
  const auth = await getConsumerAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const cards = await db.consumerCard.findMany({ where: { userId: auth.userId }, orderBy: { issuedAt: 'asc' } });
    return ok({
      cards: cards.map((c) => ({
        id: c.id,
        cardType: c.cardType,
        cardCategory: c.cardCategory,
        cardDesign: c.cardDesign,
        lastFour: c.lastFourDigits,
        expiry: `${c.expiryMonth}/${c.expiryYear.slice(-2)}`,
        cardholderName: c.cardholderName,
        status: c.status,
        spendingLimitDailyCents: c.spendingLimitDaily?.toString() ?? null,
        onlineEnabled: c.onlineEnabled,
        contactlessEnabled: c.contactlessEnabled,
        atmEnabled: c.atmEnabled,
        internationalEnabled: c.internationalEnabled,
        issuedAt: c.issuedAt,
      })),
    });
  } catch (e) { console.error('cards get error', e); return serverError(); }
}

/**
 * PATCH /api/consumer/v2/cards
 * body: { cardId, status?: 'active'|'frozen', toggles?: { online?, contactless?, atm?, international? } }
 */
export async function PATCH(request: NextRequest) {
  const auth = await getConsumerAuth(request);
  if (isAuthError(auth)) return auth;
  try {
    const body = await request.json();
    const card = await db.consumerCard.findUnique({ where: { id: body.cardId } });
    if (!card || card.userId !== auth.userId) return badRequest('Card not found');

    const data: Record<string, unknown> = { updatedAt: new Date() };
    if (body.status === 'frozen' || body.status === 'active') {
      data.status = body.status;
    }
    if (body.toggles) {
      if (typeof body.toggles.online === 'boolean') data.onlineEnabled = body.toggles.online;
      if (typeof body.toggles.contactless === 'boolean') data.contactlessEnabled = body.toggles.contactless;
      if (typeof body.toggles.atm === 'boolean') data.atmEnabled = body.toggles.atm;
      if (typeof body.toggles.international === 'boolean') data.internationalEnabled = body.toggles.international;
    }
    if (body.dailyLimitCents !== undefined) data.spendingLimitDaily = BigInt(body.dailyLimitCents);

    const updated = await db.consumerCard.update({ where: { id: card.id }, data });
    return ok({
      card: { id: updated.id, status: updated.status, onlineEnabled: updated.onlineEnabled, contactlessEnabled: updated.contactlessEnabled, atmEnabled: updated.atmEnabled, internationalEnabled: updated.internationalEnabled },
      message: updated.status === 'frozen' ? 'Card frozen' : 'Card updated',
    });
  } catch (e) { console.error('cards patch error', e); return serverError(); }
}
