import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'
import fs from 'fs'
import path from 'path'

// Document type configurations
const DOCUMENT_TYPES = {
  cipc_registration: { name: 'CIPC Registration Certificate', maxSize: 10 * 1024 * 1024 },
  bbbee_certificate: { name: 'B-BBEE Certificate', maxSize: 10 * 1024 * 1024 },
  vat_certificate: { name: 'VAT Registration Certificate', maxSize: 10 * 1024 * 1024 },
  bank_confirmation: { name: 'Bank Confirmation Letter', maxSize: 10 * 1024 * 1024 },
} as const

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'supplier-documents')

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true })
}

// POST - Upload a document
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const supplierId = formData.get('supplierId') as string
    const documentType = formData.get('documentType') as string

    if (!file || !supplierId || !documentType) {
      return NextResponse.json({ 
        error: 'Missing required fields: file, supplierId, documentType' 
      }, { status: 400 })
    }

    // Validate document type
    if (!DOCUMENT_TYPES[documentType as keyof typeof DOCUMENT_TYPES]) {
      return NextResponse.json({ 
        error: 'Invalid document type' 
      }, { status: 400 })
    }

    const docConfig = DOCUMENT_TYPES[documentType as keyof typeof DOCUMENT_TYPES]

    // Validate file size
    if (file.size > docConfig.maxSize) {
      return NextResponse.json({ 
        error: `File size exceeds maximum of ${docConfig.maxSize / 1024 / 1024}MB` 
      }, { status: 400 })
    }

    // Validate file type (PDF, images, or common document formats)
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Allowed: PDF, JPEG, PNG, WebP, DOC, DOCX' 
      }, { status: 400 })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'bin'
    const uniqueId = nanoid(12)
    const fileName = `${supplierId}-${documentType}-${uniqueId}.${ext}`
    const filePath = path.join(UPLOAD_DIR, fileName)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    fs.writeFileSync(filePath, buffer)

    // Create document record in database
    const document = await db.supplierDocument.create({
      data: {
        supplierId,
        documentType,
        documentName: docConfig.name,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        storagePath: fileName,
        status: 'pending',
      }
    })

    return NextResponse.json({ 
      success: true,
      document: {
        id: document.id,
        documentType: document.documentType,
        documentName: document.documentName,
        fileName: document.fileName,
        fileSize: document.fileSize,
        uploadedAt: document.uploadedAt,
        status: document.status,
      }
    })
  } catch (error) {
    console.error('Error uploading document:', error)
    return NextResponse.json({ error: 'Failed to upload document' }, { status: 500 })
  }
}

// GET - List documents for a supplier
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')

    if (!supplierId) {
      return NextResponse.json({ error: 'supplierId is required' }, { status: 400 })
    }

    const documents = await db.supplierDocument.findMany({
      where: { supplierId },
      orderBy: { uploadedAt: 'desc' }
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

// DELETE - Delete a document
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    // Get document info
    const document = await db.supplierDocument.findUnique({
      where: { id: documentId }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete file from disk
    const filePath = path.join(UPLOAD_DIR, document.storagePath)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
    }

    // Delete from database
    await db.supplierDocument.delete({
      where: { id: documentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
