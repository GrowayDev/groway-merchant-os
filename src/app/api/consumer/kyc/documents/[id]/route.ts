import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getUserId, ok, error } from '../../../_lib/helpers'

/**
 * /api/consumer/kyc/documents/[id]
 *
 * Single-document status lookup.
 */

// GET /api/consumer/kyc/documents/[id] - fetch a single KYC document status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getUserId(request)
    const { id } = await params

    const document = await db.consumerKYCDocument.findUnique({ where: { id } })
    if (!document || document.userId !== userId) {
      return error('KYC document not found', 404)
    }

    return ok({ success: true, data: document })
  } catch (err) {
    console.error('Get KYC document error:', err)
    return error('Failed to fetch KYC document', 500)
  }
}
