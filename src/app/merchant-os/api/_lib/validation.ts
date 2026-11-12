import { z } from 'zod'

// Common validation schemas
export const uuidSchema = z.string().uuid()
export const emailSchema = z.string().email()
export const phoneSchema = z.string().regex(/^\+?[0-9\s\-\(\)]{8,15}$/, 'Invalid phone number')
export const currencySchema = z.number().min(0).max(999999999.99)
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
export const timeSchema = z.string().regex(/^\d{2}:\d{2}$/, 'Time must be in HH:mm format')

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
})

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(6).max(100).optional(),
  pin: z.string().regex(/^\d{4,6}$/).optional()
}).refine(data => data.password || data.pin, {
  message: 'Either password or PIN is required'
})

export const registerSchema = z.object({
  email: emailSchema,
  password: z.string().min(8).max(100).regex(/[A-Z]/, 'Must contain uppercase').regex(/[a-z]/, 'Must contain lowercase').regex(/[0-9]/, 'Must contain number'),
  name: z.string().min(2).max(100),
  phone: phoneSchema.optional(),
  businessName: z.string().min(2).max(100),
  tradingName: z.string().min(2).max(100).optional(),
  vertical: z.string().min(1),
  subVertical: z.string().optional(),
  addressLine1: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  province: z.string().max(100).optional(),
  postalCode: z.string().regex(/^\d{4,5}$/).optional(),
  vatRegistered: z.boolean().default(false),
  vatNumber: z.string().max(20).optional(),
  registrationNumber: z.string().max(30).optional()
})

// Transaction schemas
export const transactionItemSchema = z.object({
  name: z.string().min(1).max(200),
  price: currencySchema,
  quantity: z.number().int().min(1).max(9999),
  category: z.string().max(100).optional(),
  customerId: z.string().optional(),
  customerName: z.string().max(100).optional()
})

export const createTransactionSchema = z.object({
  items: z.array(transactionItemSchema).min(1).max(100),
  subtotal: currencySchema,
  vatAmount: currencySchema,
  total: currencySchema,
  paymentMethod: z.enum(['cash', 'card', 'eft', 'wallet', 'voucher', 'credit', 'mixed']),
  customerName: z.string().max(100).optional(),
  customerId: z.string().optional(),
  appointmentId: z.string().optional(),
  depositApplied: currencySchema.optional()
})

// Inventory schemas
export const inventoryItemSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(50),
  barcode: z.string().max(50).optional(),
  category: z.string().min(1).max(100),
  price: currencySchema,
  cost: currencySchema,
  stock: z.number().int().min(0).default(0),
  minStock: z.number().int().min(0).default(5),
  reorderPoint: z.number().int().min(0).default(10),
  reorderQty: z.number().int().min(1).default(20),
  unit: z.string().max(20).default('unit'),
  location: z.string().max(100).optional(),
  supplier: z.string().max(100).optional()
})

// Invoice schemas
export const invoiceItemSchema = z.object({
  description: z.string().min(1).max(500),
  quantity: z.number().min(0.01).max(999999),
  unitPrice: currencySchema,
  discount: currencySchema.default(0),
  total: currencySchema,
  taxable: z.boolean().default(true)
})

export const createInvoiceSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1).max(200),
  customerEmail: emailSchema.optional(),
  customerPhone: phoneSchema.optional(),
  date: dateSchema,
  dueDate: dateSchema,
  items: z.array(invoiceItemSchema).min(1).max(100),
  subtotal: currencySchema,
  vat: currencySchema,
  discount: currencySchema.default(0),
  total: currencySchema,
  notes: z.string().max(1000).optional(),
  terms: z.string().max(1000).optional()
})

// Booking schemas
export const createBookingSchema = z.object({
  customerId: z.string().optional(),
  customerName: z.string().min(1).max(100),
  customerPhone: phoneSchema.optional(),
  customerEmail: emailSchema.optional(),
  staffId: z.string().min(1),
  serviceId: z.string().min(1),
  date: dateSchema,
  time: timeSchema,
  duration: z.number().int().min(5).max(480), // 5 min to 8 hours
  total: currencySchema,
  depositAmount: currencySchema.optional(),
  notes: z.string().max(500).optional(),
  source: z.enum(['online', 'phone', 'walk-in', 'in-store']).default('in-store')
})

// Helper function to validate request body
export function validateBody<T extends z.ZodSchema>(schema: T, data: unknown): z.infer<T> {
  return schema.parse(data)
}

// Helper function to safely validate (returns result instead of throwing)
export function safeValidate<T extends z.ZodSchema>(schema: T, data: unknown) {
  return schema.safeParse(data)
}

// Error formatter for Zod errors
export function formatZodErrors(error: z.ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const path = issue.path.join('.') || 'root'
    if (!errors[path]) {
      errors[path] = []
    }
    errors[path].push(issue.message)
  }
  return errors
}
