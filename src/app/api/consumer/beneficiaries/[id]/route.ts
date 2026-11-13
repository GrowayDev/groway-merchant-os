import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserId, ok, error } from '../../_lib/helpers'

/**
 * /api/consumer/beneficiaries/[id]
 *
 * Single-beneficiary read & delete endpoints.
 */

// GET /api/consumer/beneficiaries/[id] - fetch a single beneficiary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getUserId(request)
    const { id } = await params

    const beneficiary = await db.beneficiary.findUnique({ where: { id } })
    if (!beneficiary || beneficiary.userId !== userId) {
      return error('Beneficiary not found', 404)
    }

    return ok({ success: true, data: beneficiary })
  } catch (err) {
    console.error('Get beneficiary error:', err)
    return error('Failed to fetch beneficiary', 500)
  }
}

// DELETE /api/consumer/beneficiaries/[id] - delete a beneficiary
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getUserId(request)
    const { id } = await params

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
