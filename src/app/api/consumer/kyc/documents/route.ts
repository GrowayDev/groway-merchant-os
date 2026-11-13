import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { getUserId, ok, error } from '../../_lib/helpers'

/**
 * /api/consumer/kyc/documents
 *
 * Uses the ConsumerKYCDocument Prisma model.
 */

// GET /api/consumer/kyc/documents - list KYC documents for the user
export async function GET(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const documentType = searchParams.get('documentType')

    const where: Record<string, unknown> = { userId }
    if (status) where.status = status
    if (documentType) where.documentType = documentType

    const documents = await db.consumerKYCDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return ok({ success: true, data: documents })
  } catch (err) {
    console.error('List KYC documents error:', err)
    return error('Failed to fetch KYC documents', 500)
  }
}

// POST /api/consumer/kyc/documents - submit a new document
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request)
    const body = await request.json().catch(() => ({} as Record<string, unknown>))

    const documentType = body.documentType as string | undefined
    const fileName = body.fileName as string | undefined
    const fileUrl = body.fileUrl as string | undefined

    if (!documentType || !fileName || !fileUrl) {
      return error('documentType, fileName and fileUrl are required')
    }

    const user = await db.consumerUser.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) return error('User not found', 404)

    // Map common document types to KYC categories
    const idDocs = ['sa_id', 'id_book', 'id_card', 'passport', 'drivers_license']
    const proofOfAddressDocs = ['utility_bill', 'bank_statement', 'municipal_bill', 'lease_agreement', 'rates_bill']
    const documentCategory = idDocs.includes(documentType)
      ? 'identity'
      : proofOfAddressDocs.includes(documentType)
        ? 'proof_of_address'
        : 'other'

    const document = await db.consumerKYCDocument.create({
      data: {
        id: `kyc-${randomBytes(8).toString('hex')}`,
        userId,
        documentType,
        documentCategory,
        fileName,
        fileUrl,
        fileHash: (body.fileHash as string) || null,
        fileSize: (body.fileSize as number) || null,
        fileType: (body.fileType as string) || null,
        status: 'pending',
        documentNumber: (body.documentNumber as string) || null,
        documentCountry: (body.documentCountry as string) || 'ZA',
        issueDate: (body.issueDate as string) || null,
        expiryDate: (body.expiryDate as string) || null,
        reviewPriority: 'normal',
        updatedAt: new Date(),
      },
    })

    return ok({ success: true, data: document, message: 'Document submitted for review' }, 201)
  } catch (err) {
    console.error('Submit KYC document error:', err)
    return error('Failed to submit KYC document', 500)
  }
}
