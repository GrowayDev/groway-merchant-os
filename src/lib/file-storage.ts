/**
 * File Storage Library
 * Handles document upload and storage for Merchant OS
 */

import { db } from './db';
import { nanoid } from 'nanoid';
import crypto from 'crypto';

// Types
export type FileCategory = 'document' | 'image' | 'receipt' | 'invoice' | 'export' | 'profile';
export type StorageProvider = 'local' | 's3' | 'gcs' | 'azure';

export interface UploadOptions {
  merchantId: string;
  file: File | Buffer;
  originalName: string;
  mimeType: string;
  category: FileCategory;
  referenceType?: string;
  referenceId?: string;
  isPublic?: boolean;
  uploadedBy?: string;
  uploadedByName?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface StoredFileResult {
  id: string;
  originalName: string;
  storedName: string;
  publicUrl?: string;
  size: number;
  mimeType: string;
}

// Storage configuration
const STORAGE_PATH = process.env.STORAGE_PATH || './uploads';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// Allowed MIME types
const ALLOWED_MIME_TYPES: Record<FileCategory, string[]> = {
  document: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
  ],
  image: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  receipt: [
    'application/pdf',
    'image/jpeg',
    'image/png',
  ],
  invoice: [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ],
  export: [
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'application/json',
  ],
  profile: [
    'image/jpeg',
    'image/png',
    'image/webp',
  ],
};

/**
 * Upload a file
 */
export async function uploadFile(options: UploadOptions): Promise<StoredFileResult> {
  // Validate file size
  const fileBuffer = options.file instanceof File 
    ? Buffer.from(await options.file.arrayBuffer())
    : options.file;
  
  if (fileBuffer.length > MAX_FILE_SIZE) {
    throw new Error('File size exceeds maximum allowed (50MB)');
  }
  
  // Validate MIME type
  const allowedTypes = ALLOWED_MIME_TYPES[options.category];
  if (!allowedTypes.includes(options.mimeType)) {
    throw new Error(`File type ${options.mimeType} not allowed for category ${options.category}`);
  }
  
  // Generate unique filename
  const ext = options.originalName.split('.').pop() || 'bin';
  const storedName = `${Date.now()}-${nanoid(12)}.${ext}`;
  const storagePath = `${options.merchantId}/${options.category}/${storedName}`;
  
  // Generate hash for integrity
  const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
  
  // In production, this would upload to cloud storage
  // For now, we simulate local storage
  const publicUrl = options.isPublic 
    ? `/api/files/${storedName}` 
    : undefined;
  
  // Store file record in database
  const storedFile = await db.storedFile.create({
    data: {
      merchantId: options.merchantId,
      originalName: options.originalName,
      storedName,
      mimeType: options.mimeType,
      size: fileBuffer.length,
      storageProvider: 'local',
      storagePath,
      publicUrl,
      category: options.category,
      referenceType: options.referenceType,
      referenceId: options.referenceId,
      isPublic: options.isPublic || false,
      expiresAt: options.expiresAt,
      metadata: options.metadata ? JSON.stringify({
        ...options.metadata,
        hash,
      }) : JSON.stringify({ hash }),
      uploadedBy: options.uploadedBy,
      uploadedByName: options.uploadedByName,
    }
  });
  
  // In production, save file to disk or cloud storage here
  // For development, we just store the metadata
  
  return {
    id: storedFile.id,
    originalName: storedFile.originalName,
    storedName: storedFile.storedName,
    publicUrl: storedFile.publicUrl || undefined,
    size: storedFile.size,
    mimeType: storedFile.mimeType,
  };
}

/**
 * Get file by ID
 */
export async function getFile(fileId: string, merchantId?: string) {
  const where: any = { id: fileId };
  if (merchantId) where.merchantId = merchantId;
  
  const file = await db.storedFile.findFirst({ where });
  
  if (!file) return null;
  
  // Update access count
  await db.storedFile.update({
    where: { id: fileId },
    data: {
      accessCount: { increment: 1 },
      lastAccessedAt: new Date(),
    }
  });
  
  return {
    ...file,
    metadata: file.metadata ? JSON.parse(file.metadata) : null,
  };
}

/**
 * Get files by reference
 */
export async function getFilesByReference(
  merchantId: string,
  referenceType: string,
  referenceId: string
) {
  const files = await db.storedFile.findMany({
    where: {
      merchantId,
      referenceType,
      referenceId,
      deletedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  return files.map(f => ({
    ...f,
    metadata: f.metadata ? JSON.parse(f.metadata) : null,
  }));
}

/**
 * Delete file (soft delete)
 */
export async function deleteFile(fileId: string, merchantId?: string) {
  const where: any = { id: fileId };
  if (merchantId) where.merchantId = merchantId;
  
  const file = await db.storedFile.findFirst({ where });
  
  if (!file) {
    throw new Error('File not found');
  }
  
  // Soft delete
  await db.storedFile.update({
    where: { id: fileId },
    data: { deletedAt: new Date() }
  });
  
  return { success: true };
}

/**
 * Permanently delete file
 */
export async function permanentDeleteFile(fileId: string, merchantId?: string) {
  const where: any = { id: fileId };
  if (merchantId) where.merchantId = merchantId;
  
  const file = await db.storedFile.findFirst({ where });
  
  if (!file) {
    throw new Error('File not found');
  }
  
  // Delete from database
  await db.storedFile.delete({
    where: { id: fileId }
  });
  
  // In production, also delete from cloud storage
  
  return { success: true };
}

/**
 * List files for merchant
 */
export async function listFiles(options: {
  merchantId: string;
  category?: FileCategory;
  referenceType?: string;
  referenceId?: string;
  includeDeleted?: boolean;
  limit?: number;
  offset?: number;
}) {
  const where: any = { merchantId: options.merchantId };
  
  if (options.category) where.category = options.category;
  if (options.referenceType) where.referenceType = options.referenceType;
  if (options.referenceId) where.referenceId = options.referenceId;
  if (!options.includeDeleted) where.deletedAt = null;
  
  const [files, total] = await Promise.all([
    db.storedFile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: options.limit || 50,
      skip: options.offset || 0,
    }),
    db.storedFile.count({ where }),
  ]);
  
  return {
    files: files.map(f => ({
      ...f,
      metadata: f.metadata ? JSON.parse(f.metadata) : null,
    })),
    total,
  };
}

/**
 * Get storage usage for merchant
 */
export async function getStorageUsage(merchantId: string): Promise<{
  totalSize: number;
  fileCount: number;
  byCategory: Record<string, { count: number; size: number }>;
}> {
  const files = await db.storedFile.findMany({
    where: {
      merchantId,
      deletedAt: null,
    },
    select: {
      size: true,
      category: true,
    }
  });
  
  let totalSize = 0;
  const byCategory: Record<string, { count: number; size: number }> = {};
  
  for (const file of files) {
    totalSize += file.size;
    
    if (!byCategory[file.category]) {
      byCategory[file.category] = { count: 0, size: 0 };
    }
    
    byCategory[file.category].count++;
    byCategory[file.category].size += file.size;
  }
  
  return {
    totalSize,
    fileCount: files.length,
    byCategory,
  };
}

/**
 * Clean up expired files
 */
export async function cleanupExpiredFiles(): Promise<{ deleted: number }> {
  const now = new Date();
  
  const files = await db.storedFile.findMany({
    where: {
      expiresAt: { lt: now },
      deletedAt: null,
    },
    select: { id: true }
  });
  
  // Soft delete expired files
  await db.storedFile.updateMany({
    where: {
      expiresAt: { lt: now },
      deletedAt: null,
    },
    data: { deletedAt: now }
  });
  
  return { deleted: files.length };
}

/**
 * Generate upload URL for direct cloud upload
 * (For production use with S3/GCS signed URLs)
 */
export async function generateUploadUrl(
  merchantId: string,
  fileName: string,
  category: FileCategory,
  expiresIn: number = 3600
): Promise<{
  uploadUrl: string;
  fileKey: string;
  expiresAt: Date;
}> {
  // In production, generate pre-signed URL for S3/GCS
  const fileKey = `${merchantId}/${category}/${Date.now()}-${nanoid(12)}-${fileName}`;
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  
  // For now, return mock URL
  return {
    uploadUrl: `/api/files/upload/${fileKey}`,
    fileKey,
    expiresAt,
  };
}

/**
 * Validate file type from buffer
 */
export async function validateFileType(buffer: Buffer, expectedMime: string): Promise<boolean> {
  // Check magic numbers for common file types
  const magicNumbers: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47]],
    'image/gif': [[0x47, 0x49, 0x46]],
    'application/pdf': [[0x25, 0x50, 0x44, 0x46]],
  };
  
  const expected = magicNumbers[expectedMime];
  if (!expected) return true; // No validation for unknown types
  
  const header = Array.from(buffer.slice(0, 8));
  
  return expected.some(magic => 
    magic.every((byte, i) => header[i] === byte)
  );
}

export default {
  uploadFile,
  getFile,
  getFilesByReference,
  deleteFile,
  permanentDeleteFile,
  listFiles,
  getStorageUsage,
  cleanupExpiredFiles,
  generateUploadUrl,
  validateFileType,
};
