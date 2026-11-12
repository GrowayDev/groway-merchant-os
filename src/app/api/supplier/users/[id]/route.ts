import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { scryptSync, randomBytes } from 'crypto'

// Helper to hash password
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `${salt}:${hash}`
}

// GET /api/supplier/users/[id] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await db.supplierUser.findUnique({
      where: { id },
      select: {
        id: true,
        supplierId: true,
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
        updatedAt: true,
        supplier: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        auditLogs: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            category: true,
            description: true,
            ipAddress: true,
            createdAt: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}

// PUT /api/supplier/users/[id] - Update a user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { 
      name, 
      phone, 
      role, 
      permissions, 
      department, 
      jobTitle,
      status,
      password,
      twoFactorEnabled 
    } = body

    const existingUser = await db.supplierUser.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Build update data
    const updateData: Record<string, unknown> = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) updateData.role = role
    if (permissions !== undefined) updateData.permissions = JSON.stringify(permissions)
    if (department !== undefined) updateData.department = department
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle
    if (status !== undefined) updateData.status = status
    if (twoFactorEnabled !== undefined) updateData.twoFactorEnabled = twoFactorEnabled
    if (password) {
      updateData.passwordHash = hashPassword(password)
    }

    const user = await db.supplierUser.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        supplierId: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        avatar: true,
        jobTitle: true,
        department: true,
        permissions: true,
        twoFactorEnabled: true,
        updatedAt: true
      }
    })

    // Create audit log
    await db.supplierAuditLog.create({
      data: {
        supplierId: existingUser.supplierId,
        userId: id,
        action: 'user_updated',
        category: 'staff',
        entityType: 'user',
        entityId: id,
        description: `User profile updated: ${Object.keys(updateData).join(', ')}`,
        metadata: JSON.stringify({ updatedFields: Object.keys(updateData) })
      }
    })

    return NextResponse.json({ 
      user: {
        ...user,
        permissions: user.permissions ? JSON.parse(user.permissions as string) : []
      }
    })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

// DELETE /api/supplier/users/[id] - Delete/deactivate a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    const existingUser = await db.supplierUser.findUnique({
      where: { id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if this is the last owner
    if (existingUser.role === 'owner') {
      const ownerCount = await db.supplierUser.count({
        where: { 
          supplierId: existingUser.supplierId, 
          role: 'owner',
          status: 'active'
        }
      })
      if (ownerCount <= 1) {
        return NextResponse.json({ 
          error: 'Cannot delete the last owner. Transfer ownership first.' 
        }, { status: 400 })
      }
    }

    if (permanent) {
      // Permanently delete
      await db.supplierUser.delete({
        where: { id }
      })
    } else {
      // Soft delete - just deactivate
      await db.supplierUser.update({
        where: { id },
        data: { status: 'inactive' }
      })
    }

    // Create audit log
    await db.supplierAuditLog.create({
      data: {
        supplierId: existingUser.supplierId,
        action: permanent ? 'user_deleted' : 'user_deactivated',
        category: 'staff',
        entityType: 'user',
        entityId: id,
        description: `User ${existingUser.name} (${existingUser.email}) ${permanent ? 'deleted' : 'deactivated'}`
      }
    })

    return NextResponse.json({ 
      message: permanent ? 'User deleted permanently' : 'User deactivated successfully' 
    })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
