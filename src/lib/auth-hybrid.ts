import { hash, compare } from 'bcryptjs'
import { nanoid } from 'nanoid'

// ============================================
// Hybrid Authentication System
// Works with Prisma/SQLite for local development
// Falls back to in-memory storage for Netlify production
// ============================================

// Types
export interface HybridUser {
  id: string
  email: string
  name: string | null
  phone: string | null
  passwordHash: string
  pinHash: string | null
  role: string
  emailVerified: Date | null
  phoneVerified: Date | null
  lastLoginAt: Date | null
  loginAttempts: number
  lockedUntil: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface HybridMerchant {
  id: string
  code: string
  name: string
  tradingName: string | null
  vertical: string
  subVertical: string | null
  logo: string | null
  phone: string | null
  email: string | null
  addressLine1: string | null
  city: string | null
  province: string | null
  postalCode: string | null
  country: string
  currency: string
  vatRegistered: boolean
  vatNumber: string | null
  registrationNumber: string | null
  status: string
  onboardingComplete: boolean
  onboardingStep: string | null
  plan: string
  planStatus: string
  trialEndsAt: Date | null
  lastLoginAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface HybridMerchantUser {
  id: string
  merchantId: string
  userId: string
  role: string
  branchId: string | null
  permissions: string | null
  invitedBy: string | null
  invitedAt: Date | null
  acceptedAt: Date | null
  isActive: boolean
  lastAccessAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface HybridBranch {
  id: string
  merchantId: string
  code: string
  name: string
  type: string
  isDefault: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface HybridSession {
  id: string
  userId: string
  token: string
  expiresAt: Date
  userAgent: string | null
  ipAddress: string | null
  createdAt: Date
}

// Pre-hashed password for demo users (hash of "demo1234")
// Generated with: await hash("demo1234", 10)
const DEMO_PASSWORD_HASH = '$2b$10$D865SOzfaJ1wrC6RDkV2MeNjU7Izxkpdp8gSFqRfGnPizcrVcat0y'
const DEMO_PIN_HASH = '$2b$10$i.dXPWNVIsk.rYJ4OfP1buSZh26FOwHeFq1eE9oTzefWb0eERe7XW' // Hash of "1234" for Quick PIN login

// Demo users configuration
const DEMO_USERS_CONFIG = [
  {
    email: 'demo@groway.co.za',
    password: 'demo1234',
    pin: '1234',
    name: 'Coffee Shop Demo',
    merchantName: 'The Coffee Corner',
    tradingName: 'The Coffee Corner',
    vertical: 'fnb',
    subVertical: 'coffee_shop',
    role: 'owner'
  },
  {
    email: 'salon@groway.co.za',
    password: 'demo1234',
    pin: '1234',
    name: 'Hair Salon Demo',
    merchantName: 'Glamour Hair Studio',
    tradingName: 'Glamour Hair Studio',
    vertical: 'health-beauty',
    subVertical: 'hair_salon',
    role: 'owner'
  },
  {
    email: 'restaurant@groway.co.za',
    password: 'demo1234',
    pin: '1234',
    name: 'Restaurant Demo',
    merchantName: 'The Hungry Fork',
    tradingName: 'The Hungry Fork Restaurant',
    vertical: 'fnb',
    subVertical: 'restaurant',
    role: 'owner'
  },
  {
    email: 'spaza@groway.co.za',
    password: 'demo1234',
    pin: '1234',
    name: 'Spaza Shop Demo',
    merchantName: 'Mama Thandi Spaza',
    tradingName: 'Mama Thandi Spaza Shop',
    vertical: 'grocery',
    subVertical: 'spaza',
    role: 'owner'
  },
  {
    email: 'barber@groway.co.za',
    password: 'demo1234',
    pin: '1234',
    name: 'Barber Demo',
    merchantName: 'Fresh Cuts Barbershop',
    tradingName: 'Fresh Cuts Barbershop',
    vertical: 'health-beauty',
    subVertical: 'barber',
    role: 'owner'
  }
]

// Initialize demo users with proper IDs and dates
function initializeDemoUsers(): Map<string, HybridUser> {
  const users = new Map<string, HybridUser>()
  const now = new Date()
  
  DEMO_USERS_CONFIG.forEach((config, index) => {
    const userId = `demo_user_${index + 1}`
    users.set(config.email, {
      id: userId,
      email: config.email,
      name: config.name,
      phone: null,
      passwordHash: DEMO_PASSWORD_HASH,
      pinHash: DEMO_PIN_HASH,
      role: config.role,
      emailVerified: now,
      phoneVerified: null,
      lastLoginAt: null,
      loginAttempts: 0,
      lockedUntil: null,
      createdAt: now,
      updatedAt: now
    })
  })
  
  return users
}

function initializeDemoMerchants(): Map<string, HybridMerchant> {
  const merchants = new Map<string, HybridMerchant>()
  const now = new Date()
  
  DEMO_USERS_CONFIG.forEach((config, index) => {
    const merchantId = `demo_merchant_${index + 1}`
    merchants.set(config.email, {
      id: merchantId,
      code: `MCH-${String(1001 + index).padStart(6, '0')}`,
      name: config.merchantName,
      tradingName: config.tradingName,
      vertical: config.vertical,
      subVertical: config.subVertical,
      logo: null,
      phone: null,
      email: config.email,
      addressLine1: null,
      city: null,
      province: null,
      postalCode: null,
      country: 'South Africa',
      currency: 'ZAR',
      vatRegistered: false,
      vatNumber: null,
      registrationNumber: null,
      status: 'active',
      onboardingComplete: true,
      onboardingStep: null,
      plan: 'starter',
      planStatus: 'trial',
      trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now
    })
  })
  
  return merchants
}

function initializeDemoMerchantUsers(): Map<string, HybridMerchantUser[]> {
  const merchantUsers = new Map<string, HybridMerchantUser[]>()
  const now = new Date()
  
  DEMO_USERS_CONFIG.forEach((config, index) => {
    const userId = `demo_user_${index + 1}`
    const merchantId = `demo_merchant_${index + 1}`
    
    merchantUsers.set(config.email, [{
      id: `demo_mu_${index + 1}`,
      merchantId,
      userId,
      role: config.role,
      branchId: `demo_branch_${index + 1}`,
      permissions: null,
      invitedBy: null,
      invitedAt: null,
      acceptedAt: now,
      isActive: true,
      lastAccessAt: null,
      createdAt: now,
      updatedAt: now
    }])
  })
  
  return merchantUsers
}

function initializeDemoBranches(): Map<string, HybridBranch> {
  const branches = new Map<string, HybridBranch>()
  const now = new Date()
  
  DEMO_USERS_CONFIG.forEach((config, index) => {
    const branchId = `demo_branch_${index + 1}`
    const merchantId = `demo_merchant_${index + 1}`
    
    branches.set(config.email, {
      id: branchId,
      merchantId,
      code: 'MAIN',
      name: 'Main Branch',
      type: 'headquarters',
      isDefault: true,
      isActive: true,
      createdAt: now,
      updatedAt: now
    })
  })
  
  return branches
}

// In-memory stores for production (Netlify)
let memoryUsers: Map<string, HybridUser> | null = null
let memoryMerchants: Map<string, HybridMerchant> | null = null
let memoryMerchantUsers: Map<string, HybridMerchantUser[]> | null = null
let memoryBranches: Map<string, HybridBranch> | null = null
let memorySessions: Map<string, HybridSession> | null = null

// Initialize in-memory stores if not already done
function initializeMemoryStores() {
  if (!memoryUsers) {
    memoryUsers = initializeDemoUsers()
  }
  if (!memoryMerchants) {
    memoryMerchants = initializeDemoMerchants()
  }
  if (!memoryMerchantUsers) {
    memoryMerchantUsers = initializeDemoMerchantUsers()
  }
  if (!memoryBranches) {
    memoryBranches = initializeDemoBranches()
  }
  if (!memorySessions) {
    memorySessions = new Map<string, HybridSession>()
  }
}

// Check if we're in production mode (Netlify)
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true'
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10)
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  try {
    return compare(password, hashedPassword)
  } catch {
    return false
  }
}

// Get user by email - hybrid approach
export async function getUserByEmail(email: string): Promise<HybridUser | null> {
  const lowerEmail = email.toLowerCase()
  
  if (isProduction()) {
    // Use in-memory storage for production
    initializeMemoryStores()
    return memoryUsers!.get(lowerEmail) || null
  } else {
    // Try database first for development
    try {
      const { db } = await import('@/lib/db')
      const user = await db.user.findUnique({
        where: { email: lowerEmail }
      })
      
      if (user) {
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          passwordHash: user.passwordHash || '',
          pinHash: user.pinHash,
          role: user.role,
          emailVerified: user.emailVerified,
          phoneVerified: user.phoneVerified,
          lastLoginAt: user.lastLoginAt,
          loginAttempts: user.loginAttempts,
          lockedUntil: user.lockedUntil,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      }
      
      // Fallback to demo users if not in database
      initializeMemoryStores()
      return memoryUsers!.get(lowerEmail) || null
    } catch {
      // Database error, fallback to memory
      initializeMemoryStores()
      return memoryUsers!.get(lowerEmail) || null
    }
  }
}

// Get merchant with user relation - hybrid approach
export async function getMerchantWithUser(email: string): Promise<{
  user: HybridUser
  merchantUser: HybridMerchantUser
  merchant: HybridMerchant
  branch: HybridBranch | null
} | null> {
  const lowerEmail = email.toLowerCase()
  
  if (isProduction()) {
    // Use in-memory storage for production
    initializeMemoryStores()
    
    const user = memoryUsers!.get(lowerEmail)
    if (!user) return null
    
    const merchantUsers = memoryMerchantUsers!.get(lowerEmail)
    if (!merchantUsers || merchantUsers.length === 0) return null
    
    const merchantUser = merchantUsers[0]
    const merchant = memoryMerchants!.get(lowerEmail)
    if (!merchant) return null
    
    const branch = memoryBranches!.get(lowerEmail) || null
    
    return { user, merchantUser, merchant, branch }
  } else {
    // Try database first for development
    try {
      const { db } = await import('@/lib/db')
      
      const dbUser = await db.user.findUnique({
        where: { email: lowerEmail },
        include: {
          merchantUsers: {
            where: { isActive: true },
            include: {
              merchant: {
                include: {
                  branches: {
                    where: { isActive: true },
                    take: 1
                  }
                }
              }
            }
          }
        }
      })
      
      if (dbUser && dbUser.merchantUsers && dbUser.merchantUsers.length > 0) {
        const mu = dbUser.merchantUsers[0]
        const m = mu.merchant
        const b = m.branches?.[0]
        
        return {
          user: {
            id: dbUser.id,
            email: dbUser.email,
            name: dbUser.name,
            phone: dbUser.phone,
            passwordHash: dbUser.passwordHash || '',
            pinHash: dbUser.pinHash,
            role: dbUser.role,
            emailVerified: dbUser.emailVerified,
            phoneVerified: dbUser.phoneVerified,
            lastLoginAt: dbUser.lastLoginAt,
            loginAttempts: dbUser.loginAttempts,
            lockedUntil: dbUser.lockedUntil,
            createdAt: dbUser.createdAt,
            updatedAt: dbUser.updatedAt
          },
          merchantUser: {
            id: mu.id,
            merchantId: mu.merchantId,
            userId: mu.userId,
            role: mu.role,
            branchId: mu.branchId,
            permissions: mu.permissions,
            invitedBy: mu.invitedBy,
            invitedAt: mu.invitedAt,
            acceptedAt: mu.acceptedAt,
            isActive: mu.isActive,
            lastAccessAt: mu.lastAccessAt,
            createdAt: mu.createdAt,
            updatedAt: mu.updatedAt
          },
          merchant: {
            id: m.id,
            code: m.code,
            name: m.name,
            tradingName: m.tradingName,
            vertical: m.vertical,
            subVertical: m.subVertical,
            logo: m.logo,
            phone: m.phone,
            email: m.email,
            addressLine1: m.addressLine1,
            city: m.city,
            province: m.province,
            postalCode: m.postalCode,
            country: m.country,
            currency: m.currency,
            vatRegistered: m.vatRegistered,
            vatNumber: m.vatNumber,
            registrationNumber: m.registrationNumber,
            status: m.status,
            onboardingComplete: m.onboardingComplete,
            onboardingStep: m.onboardingStep,
            plan: m.plan,
            planStatus: m.planStatus,
            trialEndsAt: m.trialEndsAt,
            lastLoginAt: m.lastLoginAt,
            createdAt: m.createdAt,
            updatedAt: m.updatedAt
          },
          branch: b ? {
            id: b.id,
            merchantId: b.merchantId,
            code: b.code,
            name: b.name,
            type: b.type,
            isDefault: b.isDefault,
            isActive: b.isActive,
            createdAt: b.createdAt,
            updatedAt: b.updatedAt
          } : null
        }
      }
      
      // Fallback to demo users
      initializeMemoryStores()
      
      const user = memoryUsers!.get(lowerEmail)
      if (!user) return null
      
      const merchantUsers = memoryMerchantUsers!.get(lowerEmail)
      if (!merchantUsers || merchantUsers.length === 0) return null
      
      const merchantUser = merchantUsers[0]
      const merchant = memoryMerchants!.get(lowerEmail)
      if (!merchant) return null
      
      const branch = memoryBranches!.get(lowerEmail) || null
      
      return { user, merchantUser, merchant, branch }
    } catch {
      // Database error, fallback to memory
      initializeMemoryStores()
      
      const user = memoryUsers!.get(lowerEmail)
      if (!user) return null
      
      const merchantUsers = memoryMerchantUsers!.get(lowerEmail)
      if (!merchantUsers || merchantUsers.length === 0) return null
      
      const merchantUser = merchantUsers[0]
      const merchant = memoryMerchants!.get(lowerEmail)
      if (!merchant) return null
      
      const branch = memoryBranches!.get(lowerEmail) || null
      
      return { user, merchantUser, merchant, branch }
    }
  }
}

// Create session - hybrid approach
export async function createSession(
  userId: string,
  token: string,
  userAgent?: string,
  ipAddress?: string
): Promise<HybridSession> {
  const session: HybridSession = {
    id: `sess_${nanoid(12)}`,
    userId,
    token,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    userAgent: userAgent || null,
    ipAddress: ipAddress || null,
    createdAt: new Date()
  }
  
  if (isProduction()) {
    // Use in-memory storage for production
    initializeMemoryStores()
    memorySessions!.set(token, session)
    return session
  } else {
    // Try database first for development
    try {
      const { db } = await import('@/lib/db')
      
      await db.session.create({
        data: {
          id: session.id,
          userId,
          token,
          expiresAt: session.expiresAt,
          userAgent,
          ipAddress
        }
      })
      
      return session
    } catch {
      // Database error, use memory
      initializeMemoryStores()
      memorySessions!.set(token, session)
      return session
    }
  }
}

// Update user login info - hybrid approach
export async function updateUserLoginInfo(userId: string): Promise<void> {
  if (isProduction()) {
    // Use in-memory storage for production
    initializeMemoryStores()
    
    // Find and update user in memory
    for (const [email, user] of memoryUsers!.entries()) {
      if (user.id === userId) {
        user.lastLoginAt = new Date()
        user.loginAttempts = 0
        user.lockedUntil = null
        user.updatedAt = new Date()
        memoryUsers!.set(email, user)
        break
      }
    }
  } else {
    // Try database first for development
    try {
      const { db } = await import('@/lib/db')
      
      await db.user.update({
        where: { id: userId },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date()
        }
      })
    } catch {
      // Database error, update in memory
      initializeMemoryStores()
      
      for (const [email, user] of memoryUsers!.entries()) {
        if (user.id === userId) {
          user.lastLoginAt = new Date()
          user.loginAttempts = 0
          user.lockedUntil = null
          user.updatedAt = new Date()
          memoryUsers!.set(email, user)
          break
        }
      }
    }
  }
}

// Update merchant last login - hybrid approach
export async function updateMerchantLastLogin(merchantId: string): Promise<void> {
  if (isProduction()) {
    // Use in-memory storage for production
    initializeMemoryStores()
    
    // Find and update merchant in memory
    for (const [email, merchant] of memoryMerchants!.entries()) {
      if (merchant.id === merchantId) {
        merchant.lastLoginAt = new Date()
        merchant.updatedAt = new Date()
        memoryMerchants!.set(email, merchant)
        break
      }
    }
  } else {
    // Try database first for development
    try {
      const { db } = await import('@/lib/db')
      
      await db.merchant.update({
        where: { id: merchantId },
        data: { lastLoginAt: new Date() }
      })
    } catch {
      // Database error, update in memory
      initializeMemoryStores()
      
      for (const [email, merchant] of memoryMerchants!.entries()) {
        if (merchant.id === merchantId) {
          merchant.lastLoginAt = new Date()
          merchant.updatedAt = new Date()
          memoryMerchants!.set(email, merchant)
          break
        }
      }
    }
  }
}

// Update failed login attempts - hybrid approach
export async function updateFailedLoginAttempts(
  userId: string,
  attempts: number,
  lockedUntil?: Date
): Promise<void> {
  if (isProduction()) {
    // Use in-memory storage for production
    initializeMemoryStores()
    
    for (const [email, user] of memoryUsers!.entries()) {
      if (user.id === userId) {
        user.loginAttempts = attempts
        user.lockedUntil = lockedUntil || null
        user.updatedAt = new Date()
        memoryUsers!.set(email, user)
        break
      }
    }
  } else {
    // Try database first for development
    try {
      const { db } = await import('@/lib/db')
      
      await db.user.update({
        where: { id: userId },
        data: {
          loginAttempts: attempts,
          lockedUntil: lockedUntil || null
        }
      })
    } catch {
      // Database error, update in memory
      initializeMemoryStores()
      
      for (const [email, user] of memoryUsers!.entries()) {
        if (user.id === userId) {
          user.loginAttempts = attempts
          user.lockedUntil = lockedUntil || null
          user.updatedAt = new Date()
          memoryUsers!.set(email, user)
          break
        }
      }
    }
  }
}

// Check if user exists - hybrid approach
export async function checkUserExists(email: string): Promise<boolean> {
  const lowerEmail = email.toLowerCase()
  
  if (isProduction()) {
    initializeMemoryStores()
    return memoryUsers!.has(lowerEmail)
  } else {
    try {
      const { db } = await import('@/lib/db')
      const user = await db.user.findUnique({
        where: { email: lowerEmail }
      })
      return !!user
    } catch {
      initializeMemoryStores()
      return memoryUsers!.has(lowerEmail)
    }
  }
}

// Create new user - hybrid approach
export async function createNewUser(userData: {
  email: string
  passwordHash: string
  name?: string
  phone?: string
}): Promise<HybridUser> {
  const now = new Date()
  const userId = `user_${nanoid(12)}`
  const lowerEmail = userData.email.toLowerCase()
  
  const user: HybridUser = {
    id: userId,
    email: lowerEmail,
    name: userData.name || null,
    phone: userData.phone || null,
    passwordHash: userData.passwordHash,
    pinHash: null,
    role: 'user',
    emailVerified: now, // Auto-verify for now
    phoneVerified: null,
    lastLoginAt: null,
    loginAttempts: 0,
    lockedUntil: null,
    createdAt: now,
    updatedAt: now
  }
  
  if (isProduction()) {
    // Use in-memory storage for production
    initializeMemoryStores()
    memoryUsers!.set(lowerEmail, user)
    return user
  } else {
    // Try database first for development
    try {
      const { db } = await import('@/lib/db')
      
      const dbUser = await db.user.create({
        data: {
          id: userId,
          email: lowerEmail,
          name: userData.name,
          phone: userData.phone,
          passwordHash: userData.passwordHash,
          emailVerified: now
        }
      })
      
      return {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        phone: dbUser.phone,
        passwordHash: dbUser.passwordHash || '',
        pinHash: dbUser.pinHash,
        role: dbUser.role,
        emailVerified: dbUser.emailVerified,
        phoneVerified: dbUser.phoneVerified,
        lastLoginAt: dbUser.lastLoginAt,
        loginAttempts: dbUser.loginAttempts,
        lockedUntil: dbUser.lockedUntil,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt
      }
    } catch {
      // Database error, use memory
      initializeMemoryStores()
      memoryUsers!.set(lowerEmail, user)
      return user
    }
  }
}

// Create new merchant - hybrid approach
export async function createNewMerchant(merchantData: {
  userId: string
  name: string
  tradingName?: string
  vertical: string
  subVertical?: string
  phone?: string
  email?: string
  addressLine1?: string
  city?: string
  province?: string
  postalCode?: string
  vatRegistered?: boolean
  vatNumber?: string
  registrationNumber?: string
}): Promise<{ merchant: HybridMerchant; branch: HybridBranch; merchantUser: HybridMerchantUser }> {
  const now = new Date()
  const merchantId = `merchant_${nanoid(12)}`
  const branchId = `branch_${nanoid(12)}`
  const merchantUserId = `mu_${nanoid(12)}`
  
  // Generate unique merchant code
  const merchantCode = `MCH-${String(Math.floor(Math.random() * 900000) + 100000).padStart(6, '0')}`
  
  const merchant: HybridMerchant = {
    id: merchantId,
    code: merchantCode,
    name: merchantData.name,
    tradingName: merchantData.tradingName || merchantData.name,
    vertical: merchantData.vertical,
    subVertical: merchantData.subVertical || null,
    logo: null,
    phone: merchantData.phone || null,
    email: merchantData.email || null,
    addressLine1: merchantData.addressLine1 || null,
    city: merchantData.city || null,
    province: merchantData.province || null,
    postalCode: merchantData.postalCode || null,
    country: 'South Africa',
    currency: 'ZAR',
    vatRegistered: merchantData.vatRegistered || false,
    vatNumber: merchantData.vatNumber || null,
    registrationNumber: merchantData.registrationNumber || null,
    status: 'active',
    onboardingComplete: false,
    onboardingStep: 'vertical_select',
    plan: 'starter',
    planStatus: 'trial',
    trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now
  }
  
  const branch: HybridBranch = {
    id: branchId,
    merchantId,
    code: 'MAIN',
    name: 'Main Branch',
    type: 'headquarters',
    isDefault: true,
    isActive: true,
    createdAt: now,
    updatedAt: now
  }
  
  const merchantUser: HybridMerchantUser = {
    id: merchantUserId,
    merchantId,
    userId: merchantData.userId,
    role: 'owner',
    branchId,
    permissions: null,
    invitedBy: null,
    invitedAt: null,
    acceptedAt: now,
    isActive: true,
    lastAccessAt: null,
    createdAt: now,
    updatedAt: now
  }
  
  if (isProduction()) {
    // Use in-memory storage for production
    initializeMemoryStores()
    
    // Store merchant by email
    const email = merchantData.email?.toLowerCase() || ''
    if (email) {
      memoryMerchants!.set(email, merchant)
      memoryMerchantUsers!.set(email, [merchantUser])
      memoryBranches!.set(email, branch)
    }
    
    return { merchant, branch, merchantUser }
  } else {
    // Try database first for development
    try {
      const { db } = await import('@/lib/db')
      
      const result = await db.$transaction(async (tx: any) => {
        // Create merchant
        const dbMerchant = await tx.merchant.create({
          data: {
            id: merchantId,
            code: merchantCode,
            name: merchantData.name,
            tradingName: merchantData.tradingName || merchantData.name,
            vertical: merchantData.vertical,
            subVertical: merchantData.subVertical,
            phone: merchantData.phone,
            email: merchantData.email,
            addressLine1: merchantData.addressLine1,
            city: merchantData.city,
            province: merchantData.province,
            postalCode: merchantData.postalCode,
            vatRegistered: merchantData.vatRegistered || false,
            vatNumber: merchantData.vatNumber,
            registrationNumber: merchantData.registrationNumber,
            status: 'active',
            onboardingComplete: false,
            onboardingStep: 'vertical_select',
            plan: 'starter',
            planStatus: 'trial',
            trialEndsAt: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
          }
        })
        
        // Create branch
        const dbBranch = await tx.branch.create({
          data: {
            id: branchId,
            merchantId,
            name: 'Main Branch',
            code: 'MAIN',
            type: 'headquarters',
            isDefault: true,
            isActive: true
          }
        })
        
        // Create merchant-user relationship
        const dbMerchantUser = await tx.merchantUser.create({
          data: {
            id: merchantUserId,
            merchantId,
            userId: merchantData.userId,
            role: 'owner',
            branchId,
            isActive: true,
            acceptedAt: now
          }
        })
        
        return { dbMerchant, dbBranch, dbMerchantUser }
      })
      
      return {
        merchant: {
          id: result.dbMerchant.id,
          code: result.dbMerchant.code,
          name: result.dbMerchant.name,
          tradingName: result.dbMerchant.tradingName,
          vertical: result.dbMerchant.vertical,
          subVertical: result.dbMerchant.subVertical,
          logo: result.dbMerchant.logo,
          phone: result.dbMerchant.phone,
          email: result.dbMerchant.email,
          addressLine1: result.dbMerchant.addressLine1,
          city: result.dbMerchant.city,
          province: result.dbMerchant.province,
          postalCode: result.dbMerchant.postalCode,
          country: result.dbMerchant.country,
          currency: result.dbMerchant.currency,
          vatRegistered: result.dbMerchant.vatRegistered,
          vatNumber: result.dbMerchant.vatNumber,
          registrationNumber: result.dbMerchant.registrationNumber,
          status: result.dbMerchant.status,
          onboardingComplete: result.dbMerchant.onboardingComplete,
          onboardingStep: result.dbMerchant.onboardingStep,
          plan: result.dbMerchant.plan,
          planStatus: result.dbMerchant.planStatus,
          trialEndsAt: result.dbMerchant.trialEndsAt,
          lastLoginAt: result.dbMerchant.lastLoginAt,
          createdAt: result.dbMerchant.createdAt,
          updatedAt: result.dbMerchant.updatedAt
        },
        branch: {
          id: result.dbBranch.id,
          merchantId: result.dbBranch.merchantId,
          code: result.dbBranch.code,
          name: result.dbBranch.name,
          type: result.dbBranch.type,
          isDefault: result.dbBranch.isDefault,
          isActive: result.dbBranch.isActive,
          createdAt: result.dbBranch.createdAt,
          updatedAt: result.dbBranch.updatedAt
        },
        merchantUser: {
          id: result.dbMerchantUser.id,
          merchantId: result.dbMerchantUser.merchantId,
          userId: result.dbMerchantUser.userId,
          role: result.dbMerchantUser.role,
          branchId: result.dbMerchantUser.branchId,
          permissions: result.dbMerchantUser.permissions,
          invitedBy: result.dbMerchantUser.invitedBy,
          invitedAt: result.dbMerchantUser.invitedAt,
          acceptedAt: result.dbMerchantUser.acceptedAt,
          isActive: result.dbMerchantUser.isActive,
          lastAccessAt: result.dbMerchantUser.lastAccessAt,
          createdAt: result.dbMerchantUser.createdAt,
          updatedAt: result.dbMerchantUser.updatedAt
        }
      }
    } catch {
      // Database error, use memory
      initializeMemoryStores()
      
      const email = merchantData.email?.toLowerCase() || ''
      if (email) {
        memoryMerchants!.set(email, merchant)
        memoryMerchantUsers!.set(email, [merchantUser])
        memoryBranches!.set(email, branch)
      }
      
      return { merchant, branch, merchantUser }
    }
  }
}

// Export demo users config for reference
export { DEMO_USERS_CONFIG }
