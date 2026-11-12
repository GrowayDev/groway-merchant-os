import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import fs from 'fs'
import path from 'path'

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'supplier-documents')

// GET - Download a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get document info
    const document = await db.supplierDocument.findUnique({
      where: { id }
    })

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Read file
    const filePath = path.join(UPLOAD_DIR, document.storagePath)
    
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
    }

    const fileBuffer = fs.readFileSync(filePath)

    // Return file with proper headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': document.mimeType,
        'Content-Disposition': `attachment; filename="${document.fileName}"`,
        'Content-Length': document.fileSize.toString(),
      },
    })
  } catch (error) {
    console.error('Error downloading document:', error)
    return NextResponse.json({ error: 'Failed to download document' }, { status: 500 })
  }
}

// DELETE - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get document info
    const document = await db.supplierDocument.findUnique({
      where: { id }
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
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json({ error: 'Failed to delete document' }, { status: 500 })
  }
}
