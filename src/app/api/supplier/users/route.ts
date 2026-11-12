import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomBytes, scryptSync } from 'crypto'

// GET /api/supplier/users - List supplier staff users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID required' }, { status: 400 })
    }

    const where: any = { supplierId }
    if (role) where.role = role
    if (status) where.status = status
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { phone: { contains: search } }
      ]
    }

    const users = await db.supplierUser.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        jobTitle: true,
        department: true,
        permissions: true,
        lastLoginAt: true,
        invitedBy: true,
        invitedAt: true,
        acceptedAt: true,
        emailVerified: true,
        twoFactorEnabled: true,
        createdAt: true,
        updatedAt: true
      }
    })

    // Get user count by role for summary
    const roleCounts = await db.supplierUser.groupBy({
      by: ['role'],
      where: { supplierId, status: 'active' },
      _count: true
    })

    const statusCounts = await db.supplierUser.groupBy({
      by: ['status'],
      where: { supplierId },
      _count: true
    })

    return NextResponse.json({
      users,
      summary: {
        total: users.length,
        byRole: Object.fromEntries(roleCounts.map(r => [r.role, r._count])),
        byStatus: Object.fromEntries(statusCounts.map(s => [s.status, s._count]))
      }
    })
  } catch (error) {
    console.error('Error fetching supplier users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// POST /api/supplier/users - Create or invite a new staff member
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      supplierId, 
      email, 
      name, 
      phone, 
      role = 'staff',
      permissions = [],
      department,
      jobTitle,
      invitedBy,
      sendInvite = true
    } = body

    if (!supplierId || !email || !name) {
      return NextResponse.json({ 
        error: 'Supplier ID, email, and name are required' 
      }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await db.supplierUser.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json({ 
        error: 'A user with this email already exists' 
      }, { status: 400 })
    }

    // Validate role
    const validRoles = ['owner', 'admin', 'manager', 'staff', 'viewer']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        error: 'Invalid role. Must be one of: ' + validRoles.join(', ') 
      }, { status: 400 })
    }

    // Create user with pending status
    const user = await db.supplierUser.create({
      data: {
        supplierId,
        email,
        name,
        phone,
        role,
        permissions: JSON.stringify(permissions),
        department,
        jobTitle,
        status: 'pending',
        invitedBy,
        invitedAt: new Date()
      }
    })

    // Create invite token if sendInvite is true
    if (sendInvite) {
      const token = randomBytes(32).toString('hex')
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

      await db.supplierInviteToken.create({
        data: {
          supplierId,
          email,
          token,
          role,
          permissions: JSON.stringify(permissions),
          invitedBy: invitedBy || user.id,
          expiresAt
        }
      })

      // TODO: Send invite email with token
      // For now, return the token for testing
      return NextResponse.json({ 
        user: {
          ...user,
          permissions: permissions
        },
        inviteToken: token,
        message: 'User invited successfully. They will receive an email to set up their account.'
      }, { status: 201 })
    }

    return NextResponse.json({ 
      user: {
        ...user,
        permissions: permissions
      },
      message: 'User created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
