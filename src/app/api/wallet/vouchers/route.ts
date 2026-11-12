import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateReference, VOUCHER_TYPES, type ApiResponse } from '@/lib/wallet-utils'

// GET - List available vouchers
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'all'
    const owned = searchParams.get('owned') === 'true'

    if (owned && userId) {
      // Get user's purchased vouchers
      const vouchers = await db.voucherPurchase.findMany({
        where: { userId, status: 'active' },
        include: {
          VoucherProduct: {
            include: { VoucherProvider: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json<ApiResponse>({
        success: true,
        data: vouchers
      })
    }

    // Get available voucher providers and products
    const providers = await db.voucherProvider.findMany({
      where: {
        status: 'active',
        ...(type !== 'all' && { type })
      },
      include: {
        VoucherProduct: {
          where: { status: 'active' },
          orderBy: { priceCents: 'asc' }
        }
      }
    })

    // If no data in DB, return mock data
    if (providers.length === 0) {
      const mockProviders = [
        {
          id: '1voucher',
          code: '1VOUCHER',
          name: '1voucher',
          type: 'gaming',
          logo: '/vouchers/1voucher.png',
          status: 'active',
          VoucherProduct: [
            { id: '1v_10', name: '1voucher R10', amountCents: BigInt(1000), priceCents: BigInt(1000), description: 'Gaming voucher R10', validityDays: 365 },
            { id: '1v_25', name: '1voucher R25', amountCents: BigInt(2500), priceCents: BigInt(2500), description: 'Gaming voucher R25', validityDays: 365 },
            { id: '1v_50', name: '1voucher R50', amountCents: BigInt(5000), priceCents: BigInt(5000), description: 'Gaming voucher R50', validityDays: 365 },
            { id: '1v_100', name: '1voucher R100', amountCents: BigInt(10000), priceCents: BigInt(10000), description: 'Gaming voucher R100', validityDays: 365 }
          ]
        },
        {
          id: 'ott',
          code: 'OTT',
          name: 'OTT Voucher',
          type: 'gaming',
          logo: '/vouchers/ott.png',
          status: 'active',
          VoucherProduct: [
            { id: 'ott_10', name: 'OTT R10', amountCents: BigInt(1000), priceCents: BigInt(1000), description: 'OTT Voucher R10', validityDays: 365 },
            { id: 'ott_25', name: 'OTT R25', amountCents: BigInt(2500), priceCents: BigInt(2500), description: 'OTT Voucher R25', validityDays: 365 },
            { id: 'ott_50', name: 'OTT R50', amountCents: BigInt(5000), priceCents: BigInt(5000), description: 'OTT Voucher R50', validityDays: 365 },
            { id: 'ott_100', name: 'OTT R100', amountCents: BigInt(10000), priceCents: BigInt(10000), description: 'OTT Voucher R100', validityDays: 365 }
          ]
        },
        {
          id: 'blu',
          code: 'BLU',
          name: 'Blu Voucher',
          type: 'gaming',
          logo: '/vouchers/blu.png',
          status: 'active',
          VoucherProduct: [
            { id: 'blu_15', name: 'Blu R15', amountCents: BigInt(1500), priceCents: BigInt(1500), description: 'Blu Voucher R15', validityDays: 365 },
            { id: 'blu_25', name: 'Blu R25', amountCents: BigInt(2500), priceCents: BigInt(2500), description: 'Blu Voucher R25', validityDays: 365 },
            { id: 'blu_50', name: 'Blu R50', amountCents: BigInt(5000), priceCents: BigInt(5000), description: 'Blu Voucher R50', validityDays: 365 }
          ]
        },
        {
          id: 'hollywood',
          code: 'HOLLY',
          name: 'Hollywoodbets',
          type: 'betting',
          logo: '/vouchers/hollywood.png',
          status: 'active',
          VoucherProduct: [
            { id: 'hol_10', name: 'Hollywood R10', amountCents: BigInt(1000), priceCents: BigInt(1000), description: 'Hollywoodbets Voucher R10', validityDays: 365 },
            { id: 'hol_50', name: 'Hollywood R50', amountCents: BigInt(5000), priceCents: BigInt(5000), description: 'Hollywoodbets Voucher R50', validityDays: 365 }
          ]
        },
        {
          id: 'netflix',
          code: 'NFLX',
          name: 'Netflix Gift Card',
          type: 'gift',
          logo: '/vouchers/netflix.png',
          status: 'active',
          VoucherProduct: [
            { id: 'nf_150', name: 'Netflix R150', amountCents: BigInt(15000), priceCents: BigInt(15000), description: 'Netflix Gift Card R150', validityDays: 365 }
          ]
        },
        {
          id: 'spotify',
          code: 'SPOT',
          name: 'Spotify Gift Card',
          type: 'gift',
          logo: '/vouchers/spotify.png',
          status: 'active',
          VoucherProduct: [
            { id: 'sp_60', name: 'Spotify R60', amountCents: BigInt(6000), priceCents: BigInt(6000), description: 'Spotify Gift Card R60', validityDays: 365 }
          ]
        }
      ]

      return NextResponse.json<ApiResponse>({
        success: true,
        data: mockProviders
      })
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      data: {
        providers,
        types: VOUCHER_TYPES
      }
    })
  } catch (error) {
    console.error('Error fetching vouchers:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch vouchers'
    }, { status: 500 })
  }
}

// POST - Purchase or redeem voucher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, userId, productId, voucherCode } = body

    switch (action) {
      case 'purchase': {
        if (!userId || !productId) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'User ID and product ID are required'
          }, { status: 400 })
        }

        // Get product
        const product = await db.voucherProduct.findFirst({
          where: { id: productId, status: 'active' },
          include: { VoucherProvider: true }
        })

        if (!product) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Product not found'
          }, { status: 404 })
        }

        // Generate voucher code
        const code = generateReference('VCH')
        const serial = Math.random().toString(36).substring(2, 10).toUpperCase()
        const pin = Math.random().toString(36).substring(2, 8).toUpperCase()

        // Create purchase
        const purchase = await db.voucherPurchase.create({
          data: {
            id: `vch_${Date.now()}`,
            userId,
            productId: product.id,
            voucherCode: code,
            serialNumber: serial,
            pin,
            amountCents: product.amountCents,
            priceCents: product.priceCents,
            feeCents: BigInt(0),
            status: 'active',
            expiresAt: new Date(Date.now() + product.validityDays * 24 * 60 * 60 * 1000)
          }
        })

        // Deduct from wallet
        const wallet = await db.consumerWallet.findUnique({
          where: { userId }
        })

        if (wallet && wallet.balanceCents >= product.priceCents) {
          await db.consumerWallet.update({
            where: { userId },
            data: {
              balanceCents: { decrement: product.priceCents }
            }
          })

          // Create transaction
          await db.consumerTransaction.create({
            data: {
              id: `txn_${Date.now()}_vch`,
              idempotencyKey: `vch_${purchase.id}`,
              userId,
              transactionType: 'voucher',
              direction: 'debit',
              amountCents: product.priceCents,
              feeCents: BigInt(0),
              netAmountCents: product.priceCents,
              status: 'completed',
              description: `Voucher: ${product.name}`,
              reference: code,
              completedAt: new Date()
            }
          })
        }

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            ...purchase,
            product: {
              name: product.name,
              provider: product.VoucherProvider.name
            }
          },
          transaction: {
            id: purchase.id,
            reference: code,
            status: 'completed'
          }
        })
      }

      case 'redeem': {
        if (!voucherCode) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Voucher code is required'
          }, { status: 400 })
        }

        const voucher = await db.voucherPurchase.findUnique({
          where: { voucherCode }
        })

        if (!voucher) {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Voucher not found'
          }, { status: 404 })
        }

        if (voucher.status !== 'active') {
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Voucher already redeemed or expired'
          }, { status: 400 })
        }

        if (voucher.expiresAt && voucher.expiresAt < new Date()) {
          await db.voucherPurchase.update({
            where: { voucherCode },
            data: { status: 'expired' }
          })
          return NextResponse.json<ApiResponse>({
            success: false,
            error: 'Voucher has expired'
          }, { status: 400 })
        }

        // Mark as redeemed
        await db.voucherPurchase.update({
          where: { voucherCode },
          data: {
            status: 'redeemed',
            redeemedAt: new Date()
          }
        })

        return NextResponse.json<ApiResponse>({
          success: true,
          data: {
            amountCents: voucher.amountCents,
            status: 'redeemed'
          }
        })
      }

      default:
        return NextResponse.json<ApiResponse>({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error processing voucher:', error)
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to process voucher'
    }, { status: 500 })
  }
}
