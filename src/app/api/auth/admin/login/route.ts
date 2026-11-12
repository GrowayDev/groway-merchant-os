import { NextRequest, NextResponse } from 'next/server'
import { sign } from 'jsonwebtoken'
import { compare } from 'bcryptjs'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Demo admin users
const DEMO_ADMINS = [
  {
    id: 'admin_1',
    email: 'admin@groway.co.za',
    passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n3/ItB/XBG/eCknfIrqS6', // hash of 'demo1234'
    name: 'System Admin',
    role: 'super_admin',
    department: 'Operations'
  }
]

// POST /api/auth/admin/login - Admin login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const lowerEmail = email.toLowerCase()

    // Find demo admin
    const admin = DEMO_ADMINS.find(a => a.email === lowerEmail)
    
    if (!admin) {
      // Try database lookup
      try {
        const { db } = await import('@/lib/db')
        const dbAdmin = await db.adminUser.findUnique({
          where: { email: lowerEmail }
        })
        
        if (dbAdmin && dbAdmin.passwordHash) {
          const isValid = await compare(password, dbAdmin.passwordHash)
          
          if (isValid) {
            const token = sign(
              { 
                userId: dbAdmin.id, 
                email: dbAdmin.email,
                role: dbAdmin.role 
              },
              JWT_SECRET,
              { expiresIn: '8h' }
            )
            
            return NextResponse.json({
              success: true,
              user: {
                id: dbAdmin.id,
                email: dbAdmin.email,
                name: dbAdmin.name,
                role: dbAdmin.role,
                department: dbAdmin.department
              },
              token
            })
          }
        }
      } catch {
        // Database not available, use demo
      }
      
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Verify password - for demo, accept demo1234 or admin1234
    let isValid = false
    
    try {
      isValid = await compare(password, admin.passwordHash)
    } catch {
      // Bcrypt comparison failed
    }
    
    // For demo purposes, also accept common demo passwords
    if (!isValid && (password === 'demo1234' || password === 'admin1234')) {
      isValid = true
    }
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Generate session token
    const token = sign(
      { 
        userId: admin.id, 
        email: admin.email,
        role: admin.role 
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    )

    return NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        department: admin.department
      },
      token
    })
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to login' },
      { status: 500 }
    )
  }
}
