import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import {
  normalizePhone,
  serializeWallet,
  centsToRands,
  createActivity,
  ensureMerchantCustomer,
} from '@/lib/wallet-bridge'

// GET /merchant-os/api/wallet/link — list linked GoPay consumer wallets
export async function GET(request: NextRequest) {
  try {
    const merchantId = await getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const links = await db.consumerWalletLink.findMany({
      where: { merchantId },
      orderBy: { createdAt: 'desc' },
    })

    const userIds = links.map((l) => l.consumerUserId)
    const [users, wallets, customers] = await Promise.all([
      userIds.length
        ? db.consumerUser.findMany({
            where: { id: { in: userIds } },
            select: {
              id: true,
              phone: true,
              firstName: true,
              lastName: true,
              kycLevel: true,
              accountStatus: true,
            },
          })
        : Promise.resolve([]),
      userIds.length
        ? db.consumerWallet.findMany({ where: { userId: { in: userIds } } })
        : Promise.resolve([]),
      db.merchantCustomer.findMany({
        where: { merchantId, phone: { not: null } },
        select: {
          id: true,
          phone: true,
          name: true,
          loyaltyPoints: true,
          loyaltyTier: true,
          totalSpent: true,
        },
      }),
    ])

    const userMap = new Map(users.map((u) => [u.id, u]))
    const walletMap = new Map(wallets.map((w) => [w.userId, w]))
    const customerMap = new Map(customers.map((c) => [c.phone, c]))

    const walletsOut = links
      .filter((l) => l.status === 'active' && userMap.has(l.consumerUserId))
      .map((l) => {
        const user = userMap.get(l.consumerUserId)!
        const wallet = walletMap.get(l.consumerUserId) ?? null
        const customer = customerMap.get(user.phone)
        return {
          linkId: l.id,
          linkedAt: l.createdAt.toISOString(),
          lastActivityAt: l.lastActivityAt?.toISOString() ?? null,
          consumerUserId: user.id,
          name:
            [user.firstName, user.lastName].filter(Boolean).join(' ') ||
            customer?.name ||
            'Wallet customer',
          phone: user.phone,
          kycLevel: user.kycLevel,
          accountStatus: user.accountStatus,
          loyaltyTier: customer?.loyaltyTier ?? 'bronze',
          loyaltyPoints: customer?.loyaltyPoints ?? 0,
          crmCustomerId: customer?.id ?? l.merchantCustomerId ?? null,
          wallet: serializeWallet(wallet),
          walletBalance: wallet ? centsToRands(Number(wallet.balanceCents)) : 0,
        }
      })

    // Wallets that exist for this merchant's CRM customers' phones but are
    // NOT linked yet — one-tap link opportunities.
    const linkedPhones = new Set(
      links
        .filter((l) => l.status === 'active')
        .map((l) => userMap.get(l.consumerUserId)?.phone)
        .filter(Boolean) as string[]
    )
    const suggestable = customers
      .filter((c) => c.phone && !linkedPhones.has(c.phone))
      .slice(0, 10)

    return NextResponse.json({
      success: true,
      wallets: walletsOut,
      linkSuggestions: suggestable,
      totalLinked: walletsOut.length,
    })
  } catch (error) {
    console.error('[wallet/link GET] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load linked wallets' },
      { status: 500 }
    )
  }
}

// POST /merchant-os/api/wallet/link — link a GoPay wallet by mobile number
export async function POST(request: NextRequest) {
  try {
    const merchantId = await getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json().catch(() => ({}))
    const phone = normalizePhone(body?.phone)
    if (!phone) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Valid SA mobile number required (e.g. 082 123 4567 or +27821234567)',
        },
        { status: 400 }
      )
    }

    const consumer = await db.consumerUser.findUnique({ where: { phone } })
    if (!consumer) {
      return NextResponse.json(
        {
          success: false,
          error: `No GoPay wallet exists for ${phone}. The customer must register in the Groway consumer wallet app first.`,
          code: 'WALLET_NOT_FOUND',
        },
        { status: 404 }
      )
    }
    if (consumer.accountStatus !== 'active') {
      return NextResponse.json(
        { success: false, error: `Consumer wallet is ${consumer.accountStatus}` },
        { status: 409 }
      )
    }

    const merchant = await db.merchant.findUnique({
      where: { id: merchantId },
      select: { id: true, name: true, tradingName: true },
    })
    const merchantName = merchant?.tradingName || merchant?.name || 'this store'

    const customer = await ensureMerchantCustomer(merchantId, consumer)

    const link = await db.consumerWalletLink.upsert({
      where: {
        merchantId_consumerUserId: {
          merchantId,
          consumerUserId: consumer.id,
        },
      },
      create: {
        id: `cwl_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
        merchantId,
        consumerUserId: consumer.id,
        merchantCustomerId: customer.id,
        status: 'active',
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        status: 'active',
        merchantCustomerId: customer.id,
        updatedAt: new Date(),
      },
    })

    await createActivity({
      consumerUserId: consumer.id,
      activityType: 'link',
      title: `Wallet linked to ${merchantName}`,
      description:
        'Your GoPay wallet is now linked — you can earn cashback and pay with your wallet in-store.',
      direction: 'info',
      merchantId,
      merchantName: merchantName,
      referenceType: 'wallet_link',
      referenceId: link.id,
    })

    const wallet = await db.consumerWallet.findUnique({
      where: { userId: consumer.id },
    })

    return NextResponse.json({
      success: true,
      link: {
        linkId: link.id,
        consumerUserId: consumer.id,
        name:
          [consumer.firstName, consumer.lastName].filter(Boolean).join(' ') ||
          customer.name,
        phone: consumer.phone,
        walletBalance: wallet ? centsToRands(Number(wallet.balanceCents)) : 0,
      },
      message: `${customer.name}'s GoPay wallet linked successfully`,
    })
  } catch (error) {
    console.error('[wallet/link POST] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to link wallet' },
      { status: 500 }
    )
  }
}

// DELETE /merchant-os/api/wallet/link — unlink a wallet
export async function DELETE(request: NextRequest) {
  try {
    const merchantId = await getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
    const body = await request.json().catch(() => ({}))
    const { linkId } = body ?? {}
    if (!linkId) {
      return NextResponse.json(
        { success: false, error: 'linkId required' },
        { status: 400 }
      )
    }

    const link = await db.consumerWalletLink.findFirst({
      where: { id: linkId, merchantId },
    })
    if (!link) {
      return NextResponse.json(
        { success: false, error: 'Link not found' },
        { status: 404 }
      )
    }

    await db.consumerWalletLink.update({
      where: { id: link.id },
      data: { status: 'unlinked', updatedAt: new Date() },
    })

    const merchant = await db.merchant.findUnique({
      where: { id: merchantId },
      select: { name: true, tradingName: true },
    })
    await createActivity({
      consumerUserId: link.consumerUserId,
      activityType: 'unlink',
      title: `Wallet unlinked from ${merchant?.tradingName || merchant?.name || 'store'}`,
      direction: 'info',
      merchantId,
      referenceType: 'wallet_link',
      referenceId: link.id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[wallet/link DELETE] error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to unlink wallet' },
      { status: 500 }
    )
  }
}
