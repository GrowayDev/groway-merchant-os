/**
 * File Storage Service
 * 
 * Handles file/document upload, storage, and retrieval.
 * Supports local storage and cloud providers (S3, Cloudflare R2).
 */

import { db } from '@/lib/db'
import { writeFile, mkdir, unlink, stat } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

// Types
export type StorageProvider = 'local' | 's3' | 'cloudflare' | 'azure'
export type FileCategory = 
  | 'document' 
  | 'image' 
  | 'invoice' 
  | 'receipt' 
  | 'compliance' 
  | 'logo' 
  | 'product_image'
  | 'signature'
  | 'report'
  | 'export'
  | 'backup'
  | 'other'

export interface UploadOptions {
  merchantId?: string
  userId?: string
  
  // Classification
  category: FileCategory
  subCategory?: string
  
  // Entity association
  entityType?: string
  entityId?: string
  
  // Access
  isPublic?: boolean
  accessExpiresAt?: Date
  
  // Retention
  retentionDays?: number
  
  // Metadata
  metadata?: Record<string, unknown>
}

export interface UploadResult {
  id: string
  originalName: string
  storedName: string
  mimeType: string
  size: number
  publicUrl?: string
  thumbnailUrl?: string
}

export interface FileMetadata {
  width?: number
  height?: number
  pages?: number
  duration?: number
  author?: string
  createdAt?: string
  modifiedAt?: string
}

// Storage configuration
const STORAGE_CONFIG = {
  local: {
    basePath: process.env.STORAGE_LOCAL_PATH || './uploads',
    baseUrl: process.env.STORAGE_LOCAL_URL || '/api/files',
  },
}

// Allowed MIME types by category
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
  ],
  invoice: ['application/pdf', 'image/jpeg', 'image/png'],
  receipt: ['application/pdf', 'image/jpeg', 'image/png'],
  compliance: ['application/pdf', 'image/jpeg', 'image/png'],
  logo: ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'],
  product_image: ['image/jpeg', 'image/png', 'image/webp'],
  signature: ['image/png', 'image/svg+xml'],
  report: ['application/pdf', 'application/vnd.ms-excel', 'text/csv'],
  export: ['application/pdf', 'application/vnd.ms-excel', 'text/csv', 'application/json'],
  backup: ['application/zip', 'application/x-gzip', 'application/json'],
  other: ['*'],
}

// Max file sizes by category (in bytes)
const MAX_FILE_SIZES: Record<string, number> = {
  document: 50 * 1024 * 1024, // 50MB
  image: 10 * 1024 * 1024, // 10MB
  invoice: 20 * 1024 * 1024, // 20MB
  receipt: 10 * 1024 * 1024, // 10MB
  compliance: 20 * 1024 * 1024, // 20MB
  logo: 5 * 1024 * 1024, // 5MB
  product_image: 10 * 1024 * 1024, // 10MB
  signature: 2 * 1024 * 1024, // 2MB
  report: 100 * 1024 * 1024, // 100MB
  export: 100 * 1024 * 1024, // 100MB
  backup: 500 * 1024 * 1024, // 500MB
  other: 10 * 1024 * 1024, // 10MB
}

/**
 * Generate unique filename
 */
function generateStoredName(originalName: string): string {
  const ext = path.extname(originalName)
  const timestamp = Date.now().toString(36)
  const random = crypto.randomBytes(8).toString('hex')
  return `${timestamp}-${random}${ext}`
}

/**
 * Validate file before upload
 */
function validateFile(
  file: { name: string; type: string; size: number },
  category: FileCategory
): { valid: boolean; error?: string } {
  // Check MIME type
  const allowedTypes = ALLOWED_MIME_TYPES[category] || ALLOWED_MIME_TYPES.other
  if (!allowedTypes.includes('*') && !allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} not allowed for category ${category}`,
    }
  }
  
  // Check file size
  const maxSize = MAX_FILE_SIZES[category] || MAX_FILE_SIZES.other
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds maximum of ${Math.round(maxSize / 1024 / 1024)}MB for ${category}`,
    }
  }
  
  return { valid: true }
}

/**
 * Get storage path for file
 */
function getStoragePath(storedName: string, category: FileCategory): string {
  const config = STORAGE_CONFIG.local
  return path.join(config.basePath, category, storedName)
}

/**
 * Upload file to storage
 */
export async function uploadFile(
  file: {
    name: string
    type: string
    size: number
    data: Buffer
  },
  options: UploadOptions
): Promise<UploadResult> {
  const { category, isPublic = false, retentionDays = 365, metadata } = options
  
  // Validate
  const validation = validateFile(file, category)
  if (!validation.valid) {
    throw new Error(validation.error)
  }
  
  // Generate unique name
  const storedName = generateStoredName(file.name)
  
  // Get storage path
  const storagePath = getStoragePath(storedName, category)
  
  // Ensure directory exists
  const dir = path.dirname(storagePath)
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true })
  }
  
  // Write file
  await writeFile(storagePath, file.data)
  
  // Calculate delete date
  const deleteAt = new Date()
  deleteAt.setDate(deleteAt.getDate() + retentionDays)
  
  // Generate public URL if public
  const publicUrl = isPublic ? `${STORAGE_CONFIG.local.baseUrl}/${category}/${storedName}` : undefined
  
  // Create database record
  const fileRecord = await db.fileStorageRecord.create({
    data: {
      merchantId: options.merchantId,
      uploadedBy: options.userId,
      originalName: file.name,
      storedName,
      mimeType: file.type,
      size: file.size,
      storageProvider: 'local',
      storagePath,
      category,
      subCategory: options.subCategory,
      entityType: options.entityType,
      entityId: options.entityId,
      isPublic,
      accessExpiresAt: options.accessExpiresAt,
      retentionDays,
      deleteAt,
      publicUrl,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  })
  
  return {
    id: fileRecord.id,
    originalName: file.name,
    storedName,
    mimeType: file.type,
    size: file.size,
    publicUrl,
  }
}

/**
 * Upload from base64 string
 */
export async function uploadFromBase64(
  base64Data: string,
  filename: string,
  options: UploadOptions
): Promise<UploadResult> {
  // Parse base64 data URL
  const matches = base64Data.match(/^data:(.+?);base64,(.+)$/)
  
  if (!matches) {
    throw new Error('Invalid base64 data URL')
  }
  
  const mimeType = matches[1]
  const data = Buffer.from(matches[2], 'base64')
  
  return uploadFile(
    {
      name: filename,
      type: mimeType,
      size: data.length,
      data,
    },
    options
  )
}

/**
 * Get file by ID
 */
export async function getFile(fileId: string): Promise<{
  record: {
    id: string
    originalName: string
    storedName: string
    mimeType: string
    size: number
    storagePath: string
    publicUrl: string | null
  }
  data: Buffer
} | null> {
  const record = await db.fileStorageRecord.findUnique({
    where: { id: fileId, status: 'active' },
  })
  
  if (!record) return null
  
  // Check if file exists
  if (!existsSync(record.storagePath)) {
    return null
  }
  
  // Read file
  const { readFile } = await import('fs/promises')
  const data = await readFile(record.storagePath)
  
  return {
    record: {
      id: record.id,
      originalName: record.originalName,
      storedName: record.storedName,
      mimeType: record.mimeType,
      size: record.size,
      storagePath: record.storagePath,
      publicUrl: record.publicUrl,
    },
    data,
  }
}

/**
 * Get file by stored name
 */
export async function getFileByName(
  storedName: string,
  category: FileCategory
): Promise<{
  record: {
    id: string
    originalName: string
    storedName: string
    mimeType: string
    size: number
    storagePath: string
    publicUrl: string | null
  }
  data: Buffer
} | null> {
  const record = await db.fileStorageRecord.findUnique({
    where: { storedName },
  })
  
  if (!record || record.status !== 'active' || record.category !== category) {
    return null
  }
  
  // Check if file exists
  if (!existsSync(record.storagePath)) {
    return null
  }
  
  // Read file
  const { readFile } = await import('fs/promises')
  const data = await readFile(record.storagePath)
  
  return {
    record: {
      id: record.id,
      originalName: record.originalName,
      storedName: record.storedName,
      mimeType: record.mimeType,
      size: record.size,
      storagePath: record.storagePath,
      publicUrl: record.publicUrl,
    },
    data,
  }
}

/**
 * Delete file
 */
export async function deleteFile(fileId: string): Promise<boolean> {
  const record = await db.fileStorageRecord.findUnique({
    where: { id: fileId },
  })
  
  if (!record) return false
  
  // Delete from storage
  try {
    if (existsSync(record.storagePath)) {
      await unlink(record.storagePath)
    }
  } catch (error) {
    console.error('Failed to delete file from storage:', error)
  }
  
  // Update database record
  await db.fileStorageRecord.update({
    where: { id: fileId },
    data: { status: 'deleted' },
  })
  
  return true
}

/**
 * Get files for entity
 */
export async function getEntityFiles(
  entityType: string,
  entityId: string,
  options?: {
    category?: FileCategory
    limit?: number
  }
): Promise<Array<{
  id: string
  originalName: string
  mimeType: string
  size: number
  category: string
  publicUrl: string | null
  createdAt: Date
}>> {
  const files = await db.fileStorageRecord.findMany({
    where: {
      entityType,
      entityId,
      status: 'active',
      ...(options?.category && { category: options.category }),
    },
    orderBy: { createdAt: 'desc' },
    take: options?.limit || 50,
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      size: true,
      category: true,
      publicUrl: true,
      createdAt: true,
    },
  })
  
  return files
}

/**
 * Get merchant files
 */
export async function getMerchantFiles(
  merchantId: string,
  options?: {
    category?: FileCategory
    entityType?: string
    search?: string
    limit?: number
    offset?: number
  }
): Promise<{
  files: Array<{
    id: string
    originalName: string
    mimeType: string
    size: number
    category: string
    subCategory: string | null
    entityType: string | null
    entityId: string | null
    publicUrl: string | null
    createdAt: Date
  }>
  total: number
}> {
  const where: Record<string, unknown> = {
    merchantId,
    status: 'active',
  }
  
  if (options?.category) where.category = options.category
  if (options?.entityType) where.entityType = options.entityType
  
  if (options?.search) {
    where.OR = [
      { originalName: { contains: options.search } },
      { subCategory: { contains: options.search } },
    ]
  }
  
  const [files, total] = await Promise.all([
    db.fileStorageRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
      select: {
        id: true,
        originalName: true,
        mimeType: true,
        size: true,
        category: true,
        subCategory: true,
        entityType: true,
        entityId: true,
        publicUrl: true,
        createdAt: true,
      },
    }),
    db.fileStorageRecord.count({ where }),
  ])
  
  return { files, total }
}

/**
 * Get storage stats for merchant
 */
export async function getMerchantStorageStats(merchantId: string): Promise<{
  totalFiles: number
  totalSize: number
  filesByCategory: Record<string, number>
  sizeByCategory: Record<string, number>
}> {
  const files = await db.fileStorageRecord.findMany({
    where: { merchantId, status: 'active' },
    select: {
      size: true,
      category: true,
    },
  })
  
  const filesByCategory: Record<string, number> = {}
  const sizeByCategory: Record<string, number> = {}
  let totalSize = 0
  
  for (const file of files) {
    filesByCategory[file.category] = (filesByCategory[file.category] || 0) + 1
    sizeByCategory[file.category] = (sizeByCategory[file.category] || 0) + file.size
    totalSize += file.size
  }
  
  return {
    totalFiles: files.length,
    totalSize,
    filesByCategory,
    sizeByCategory,
  }
}

/**
 * Clean up expired files
 */
export async function cleanupExpiredFiles(): Promise<number> {
  const expired = await db.fileStorageRecord.findMany({
    where: {
      deleteAt: { lte: new Date() },
      status: 'active',
    },
  })
  
  let deleted = 0
  
  for (const file of expired) {
    try {
      if (existsSync(file.storagePath)) {
        await unlink(file.storagePath)
      }
      
      await db.fileStorageRecord.update({
        where: { id: file.id },
        data: { status: 'deleted' },
      })
      
      deleted++
    } catch (error) {
      console.error(`Failed to delete expired file ${file.id}:`, error)
    }
  }
  
  return deleted
}
