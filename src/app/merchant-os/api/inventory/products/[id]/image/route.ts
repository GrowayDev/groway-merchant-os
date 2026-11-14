import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getMerchantIdWithDevFallback } from '@/lib/auth-context'
import fs from 'fs'
import path from 'path'
import { nanoid } from 'nanoid'

// Maximum image size: 5 MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'products')

// Ensure the upload directory exists
function ensureUploadDir() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true })
  }
}

// POST /api/merchant-os/inventory/products/[id]/image
// Uploads (or replaces) the primary image for a product SKU.
// Accepts multipart/form-data with a single `file` field.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const merchantId = await getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { id: productId } = await params

    // Verify the product exists AND belongs to this merchant (tenant isolation)
    const product = await db.product.findFirst({
      where: { id: productId, merchantId },
      select: { id: true, name: true, image: true, images: true },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found or does not belong to this merchant' },
        { status: 404 }
      )
    }

    // Parse the multipart form
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided. Include a "file" field in the multipart form data.' },
        { status: 400 }
      )
    }

    // Validate the file
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`,
        },
        { status: 400 }
      )
    }

    if (file.size > MAX_IMAGE_SIZE) {
      return NextResponse.json(
        { success: false, error: `File too large: ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum: 5 MB.` },
        { status: 400 }
      )
    }

    // Generate a unique filename: <productId>_<nanoid>.<ext>
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const filename = `${productId}_${nanoid(10)}.${ext}`
    ensureUploadDir()
    const filepath = path.join(UPLOAD_DIR, filename)

    // Write the file to the local filesystem (production should use S3/R2)
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(new Uint8Array(arrayBuffer))
    fs.writeFileSync(filepath, buffer)

    // The public URL serves from /public/uploads/products/
    const imageUrl = `/uploads/products/${filename}`

    // Update the product's primary image in the database.
    // If there's an existing image, add it to the `images` gallery (JSON array).
    let imagesArray: string[] = []
    if (product.images) {
      try {
        imagesArray = JSON.parse(product.images)
      } catch {
        imagesArray = []
      }
    }
    if (product.image && !imagesArray.includes(product.image)) {
      imagesArray.unshift(product.image)
    }
    // Deduplicate
    imagesArray = [...new Set(imagesArray)]
    // Cap at 8 images
    if (imagesArray.length > 8) {
      imagesArray = imagesArray.slice(0, 8)
    }

    const updated = await db.product.update({
      where: { id: productId },
      data: {
        image: imageUrl,
        images: JSON.stringify(imagesArray),
        updatedAt: new Date(),
      },
      select: { id: true, image: true, images: true },
    })

    return NextResponse.json({
      success: true,
      product: {
        id: updated.id,
        image: updated.image,
        images: imagesArray,
      },
      imageUrl,
      message: 'Product image uploaded successfully',
    })
  } catch (error) {
    console.error('Product image upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}

// DELETE /api/merchant-os/inventory/products/[id]/image
// Removes the primary image from a product SKU.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const merchantId = await getMerchantIdWithDevFallback(request)
    if (!merchantId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 })
    }

    const { id: productId } = await params

    const product = await db.product.findFirst({
      where: { id: productId, merchantId },
      select: { id: true, image: true, images: true },
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Optionally delete the file from disk
    if (product.image) {
      const filename = path.basename(product.image)
      const filepath = path.join(UPLOAD_DIR, filename)
      try {
        if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
      } catch {
        // Non-fatal — file may already be gone
      }
    }

    await db.product.update({
      where: { id: productId },
      data: {
        image: null,
        updatedAt: new Date(),
      },
    })

    return NextResponse.json({ success: true, message: 'Product image removed' })
  } catch (error) {
    console.error('Product image delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to remove image' },
      { status: 500 }
    )
  }
}
