import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error } from '../_lib/helpers'

/**
 * /api/consumer/beneficiaries
 *
 * CRUD for beneficiaries backed by the Beneficiary Prisma model.
 */

// GET /api/consumer/beneficiaries - list beneficiaries for the user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const favoriteOnly = searchParams.get('favorite') === 'true'

    const where: Record<string, unknown> = { userId }
    if (type) where.type = type
    if (favoriteOnly) where.isFavorite = true

    const beneficiaries = await db.beneficiary.findMany({
      where,
      orderBy: [{ isFavorite: 'desc' }, { lastUsedAt: 'desc' }, { createdAt: 'desc' }],
    })

    return ok({ success: true, data: beneficiaries })
  } catch (err) {
    console.error('List beneficiaries error:', err)
    return error('Failed to fetch beneficiaries', 500)
  }
}

// POST /api/consumer/beneficiaries - add a beneficiary
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const name = body.name as string | undefined
    const type = (body.type as string) || 'bank'
    const identifier = body.identifier as string | undefined

    if (!name || !identifier) {
      return error('name and identifier are required')
    }
    if (!['bank', 'wallet', 'payshap'].includes(type)) {
      return error('type must be one of bank, wallet, payshap')
    }

    const user = await db.consumerUser.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) return error('User not found', 404)

    const beneficiary = await db.beneficiary.create({
      data: {
        id: `ben-${randomBytes(8).toString('hex')}`,
        userId,
        name,
        nickname: (body.nickname as string) || null,
        type,
        identifier,
        bankName: (body.bankName as string) || null,
        accountType: (body.accountType as string) || null,
        isFavorite: Boolean(body.isFavorite),
        updatedAt: new Date(),
      },
    })

    return ok({ success: true, data: beneficiary, message: 'Beneficiary added successfully' }, 201)
  } catch (err) {
    console.error('Create beneficiary error:', err)
    return error('Failed to add beneficiary', 500)
  }
}

// PUT /api/consumer/beneficiaries - update a beneficiary (accepts ?id= or body.id)
export async function PUT(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const body = await request.json().catch(() => ({} as Record<string, unknown>))
    const beneficiaryId = id || (body.id as string)

    if (!beneficiaryId) {
      return error('Beneficiary id is required (use ?id= or body.id)')
    }

    const existing = await db.beneficiary.findUnique({ where: { id: beneficiaryId } })
    if (!existing || existing.userId !== userId) {
      return error('Beneficiary not found', 404)
    }

    const data: Record<string, unknown> = { updatedAt: new Date() }
    if (typeof body.name === 'string') data.name = body.name
    if (typeof body.nickname === 'string') data.nickname = body.nickname
    if (typeof body.identifier === 'string') data.identifier = body.identifier
    if (typeof body.bankName === 'string') data.bankName = body.bankName
    if (typeof body.accountType === 'string') data.accountType = body.accountType
    if (typeof body.isFavorite === 'boolean') data.isFavorite = body.isFavorite

    const updated = await db.beneficiary.update({
      where: { id: beneficiaryId },
      data,
    })

    return ok({ success: true, data: updated, message: 'Beneficiary updated successfully' })
  } catch (err) {
    console.error('Update beneficiary error:', err)
    return error('Failed to update beneficiary', 500)
  }
}

// DELETE /api/consumer/beneficiaries - remove a beneficiary (accepts ?id=)
export async function DELETE(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) return error('Beneficiary id is required')

    const existing = await db.beneficiary.findUnique({ where: { id } })
    if (!existing || existing.userId !== userId) {
      return error('Beneficiary not found', 404)
    }

    await db.beneficiary.delete({ where: { id } })

    return ok({ success: true, message: 'Beneficiary removed successfully' })
  } catch (err) {
    console.error('Delete beneficiary error:', err)
    return error('Failed to remove beneficiary', 500)
  }
}
