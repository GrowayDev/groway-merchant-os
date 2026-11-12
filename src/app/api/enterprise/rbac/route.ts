import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

// GET - Get RBAC data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const corporateId = searchParams.get('corporateId')
    const action = searchParams.get('action') || 'list'
    
    if (!corporateId && action !== 'system_permissions') {
      return NextResponse.json({ error: 'corporateId is required' }, { status: 400 })
    }
    
    if (action === 'roles') {
      // Get all roles for the corporate
      const roles = await db.enterpriseRole.findMany({
        where: { corporateId },
        include: {
          _count: { select: { RolePermissions: true, UserAssignments: true } },
          RolePermissions: {
            include: { Permission: true }
          }
        },
        orderBy: [{ isSystem: 'desc' }, { priority: 'desc' }]
      })
      
      return NextResponse.json({ roles })
    }
    
    if (action === 'permissions') {
      // Get all permissions
      const category = searchParams.get('category')
      const where: Record<string, unknown> = {}
      if (category) where.category = category
      
      const permissions = await db.enterprisePermission.findMany({
        where,
        orderBy: [{ category: 'asc' }, { resource: 'asc' }, { action: 'asc' }]
      })
      
      // Group by category
      const groupedPermissions = permissions.reduce((acc, perm) => {
        if (!acc[perm.category]) acc[perm.category] = []
        acc[perm.category].push(perm)
        return acc
      }, {} as Record<string, typeof permissions>)
      
      return NextResponse.json({ permissions, groupedPermissions, categories: Object.keys(groupedPermissions) })
    }
    
    if (action === 'user_roles') {
      // Get user role assignments
      const userId = searchParams.get('userId')
      const where: Record<string, unknown> = {}
      if (userId) where.userId = userId
      
      const assignments = await db.enterpriseUserRole.findMany({
        where,
        include: {
          Role: {
            include: {
              RolePermissions: { include: { Permission: true } }
            }
          }
        }
      })
      
      return NextResponse.json({ assignments })
    }
    
    if (action === 'check_permission') {
      // Check if a user has a specific permission
      const userId = searchParams.get('userId')
      const permissionCode = searchParams.get('permission')
      const branchId = searchParams.get('branchId')
      
      if (!userId || !permissionCode) {
        return NextResponse.json({ error: 'userId and permission are required' }, { status: 400 })
      }
      
      // Get user's roles
      const userRoles = await db.enterpriseUserRole.findMany({
        where: { userId, isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
        include: { Role: { include: { RolePermissions: { include: { Permission: true } } } } }
      })
      
      // Check if any role has the permission
      const hasPermission = userRoles.some(ur => 
        ur.Role.RolePermissions.some(rp => 
          rp.Permission.code === permissionCode && rp.granted
        )
      )
      
      // Check branch-level restriction if specified
      let branchRestricted = false
      if (branchId) {
        branchRestricted = userRoles.some(ur => ur.branchId === branchId || !ur.branchId)
      }
      
      return NextResponse.json({ 
        hasPermission, 
        branchRestricted: branchId ? branchRestricted : null,
        matchedRoles: userRoles.map(ur => ({ id: ur.Role.id, name: ur.Role.name }))
      })
    }
    
    if (action === 'audit_trail') {
      // Get permission audit trail
      const targetType = searchParams.get('targetType')
      const targetId = searchParams.get('targetId')
      const actorUserId = searchParams.get('actorUserId')
      
      const where: Record<string, unknown> = { corporateId }
      if (targetType) where.targetType = targetType
      if (targetId) where.targetId = targetId
      if (actorUserId) where.actorUserId = actorUserId
      
      const auditTrail = await db.enterprisePermissionAudit.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 100
      })
      
      return NextResponse.json({ auditTrail })
    }
    
    if (action === 'matrix') {
      // Get full permissions matrix
      const roles = await db.enterpriseRole.findMany({
        where: { corporateId },
        include: {
          RolePermissions: {
            include: { Permission: true }
          }
        },
        orderBy: { priority: 'desc' }
      })
      
      const permissions = await db.enterprisePermission.findMany({
        orderBy: [{ category: 'asc' }, { resource: 'asc' }]
      })
      
      // Build matrix
      const matrix: Record<string, Record<string, boolean>> = {}
      permissions.forEach(perm => {
        matrix[perm.code] = {}
        roles.forEach(role => {
          const rolePerm = role.RolePermissions.find(rp => rp.permissionId === perm.id)
          matrix[perm.code][role.id] = rolePerm?.granted ?? false
        })
      })
      
      return NextResponse.json({ matrix, roles, permissions })
    }
    
    if (action === 'system_permissions') {
      // Get system-defined permissions
      const systemPermissions = [
        // Users
        { code: 'users.view', name: 'View Users', category: 'users', resource: 'users', action: 'view' },
        { code: 'users.create', name: 'Create Users', category: 'users', resource: 'users', action: 'create' },
        { code: 'users.update', name: 'Update Users', category: 'users', resource: 'users', action: 'update' },
        { code: 'users.delete', name: 'Delete Users', category: 'users', resource: 'users', action: 'delete' },
        // Inventory
        { code: 'inventory.view', name: 'View Inventory', category: 'inventory', resource: 'inventory', action: 'view' },
        { code: 'inventory.create', name: 'Create Inventory', category: 'inventory', resource: 'inventory', action: 'create' },
        { code: 'inventory.update', name: 'Update Inventory', category: 'inventory', resource: 'inventory', action: 'update' },
        { code: 'inventory.delete', name: 'Delete Inventory', category: 'inventory', resource: 'inventory', action: 'delete' },
        // Transfers
        { code: 'transfers.view', name: 'View Transfers', category: 'transfers', resource: 'transfers', action: 'view' },
        { code: 'transfers.create', name: 'Create Transfers', category: 'transfers', resource: 'transfers', action: 'create' },
        { code: 'transfers.approve', name: 'Approve Transfers', category: 'transfers', resource: 'transfers', action: 'approve' },
        { code: 'transfers.dispatch', name: 'Dispatch Transfers', category: 'transfers', resource: 'transfers', action: 'dispatch' },
        { code: 'transfers.receive', name: 'Receive Transfers', category: 'transfers', resource: 'transfers', action: 'receive' },
        // Reports
        { code: 'reports.view', name: 'View Reports', category: 'reports', resource: 'reports', action: 'view' },
        { code: 'reports.export', name: 'Export Reports', category: 'reports', resource: 'reports', action: 'export' },
        { code: 'reports.consolidated', name: 'Consolidated Reports', category: 'reports', resource: 'reports', action: 'consolidated' },
        // Settings
        { code: 'settings.view', name: 'View Settings', category: 'settings', resource: 'settings', action: 'view' },
        { code: 'settings.update', name: 'Update Settings', category: 'settings', resource: 'settings', action: 'update' },
        { code: 'settings.currency', name: 'Manage Currency', category: 'settings', resource: 'currency', action: 'manage' },
        // Billing
        { code: 'billing.view', name: 'View Billing', category: 'billing', resource: 'billing', action: 'view' },
        { code: 'billing.manage', name: 'Manage Billing', category: 'billing', resource: 'billing', action: 'manage' },
        // RBAC
        { code: 'rbac.view', name: 'View Permissions', category: 'rbac', resource: 'rbac', action: 'view' },
        { code: 'rbac.manage', name: 'Manage Permissions', category: 'rbac', resource: 'rbac', action: 'manage' },
      ]
      
      return NextResponse.json({ systemPermissions })
    }
    
    // Default: list all RBAC data
    const roles = await db.enterpriseRole.findMany({
      where: { corporateId },
      include: { _count: { select: { UserAssignments: true } } }
    })
    
    const permissions = await db.enterprisePermission.findMany({
      orderBy: { category: 'asc' }
    })
    
    const stats = {
      totalRoles: roles.length,
      systemRoles: roles.filter(r => r.isSystem).length,
      totalPermissions: permissions.length,
      totalAssignments: await db.enterpriseUserRole.count({
        where: { Role: { corporateId } }
      })
    }
    
    return NextResponse.json({ roles, permissions, stats })
  } catch (error) {
    console.error('Error fetching RBAC data:', error)
    return NextResponse.json({ error: 'Failed to fetch RBAC data' }, { status: 500 })
  }
}

// POST - Create roles, permissions, or assignments
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, corporateId, ...data } = body
    
    if (!corporateId && !['init_permissions', 'create_permission'].includes(action)) {
      return NextResponse.json({ error: 'corporateId is required' }, { status: 400 })
    }
    
    if (action === 'init_permissions') {
      // Initialize system permissions
      const systemPermissions = [
        { code: 'users.view', name: 'View Users', category: 'users', resource: 'users', action: 'view' },
        { code: 'users.create', name: 'Create Users', category: 'users', resource: 'users', action: 'create' },
        { code: 'users.update', name: 'Update Users', category: 'users', resource: 'users', action: 'update' },
        { code: 'users.delete', name: 'Delete Users', category: 'users', resource: 'users', action: 'delete' },
        { code: 'inventory.view', name: 'View Inventory', category: 'inventory', resource: 'inventory', action: 'view' },
        { code: 'inventory.create', name: 'Create Inventory', category: 'inventory', resource: 'inventory', action: 'create' },
        { code: 'inventory.update', name: 'Update Inventory', category: 'inventory', resource: 'inventory', action: 'update' },
        { code: 'inventory.delete', name: 'Delete Inventory', category: 'inventory', resource: 'inventory', action: 'delete' },
        { code: 'transfers.view', name: 'View Transfers', category: 'transfers', resource: 'transfers', action: 'view' },
        { code: 'transfers.create', name: 'Create Transfers', category: 'transfers', resource: 'transfers', action: 'create' },
        { code: 'transfers.approve', name: 'Approve Transfers', category: 'transfers', resource: 'transfers', action: 'approve' },
        { code: 'transfers.dispatch', name: 'Dispatch Transfers', category: 'transfers', resource: 'transfers', action: 'dispatch' },
        { code: 'transfers.receive', name: 'Receive Transfers', category: 'transfers', resource: 'transfers', action: 'receive' },
        { code: 'reports.view', name: 'View Reports', category: 'reports', resource: 'reports', action: 'view' },
        { code: 'reports.export', name: 'Export Reports', category: 'reports', resource: 'reports', action: 'export' },
        { code: 'reports.consolidated', name: 'Consolidated Reports', category: 'reports', resource: 'reports', action: 'consolidated' },
        { code: 'settings.view', name: 'View Settings', category: 'settings', resource: 'settings', action: 'view' },
        { code: 'settings.update', name: 'Update Settings', category: 'settings', resource: 'settings', action: 'update' },
        { code: 'settings.currency', name: 'Manage Currency', category: 'settings', resource: 'currency', action: 'manage' },
        { code: 'billing.view', name: 'View Billing', category: 'billing', resource: 'billing', action: 'view' },
        { code: 'billing.manage', name: 'Manage Billing', category: 'billing', resource: 'billing', action: 'manage' },
        { code: 'rbac.view', name: 'View Permissions', category: 'rbac', resource: 'rbac', action: 'view' },
        { code: 'rbac.manage', name: 'Manage Permissions', category: 'rbac', resource: 'rbac', action: 'manage' },
      ]
      
      const created = []
      for (const perm of systemPermissions) {
        const existing = await db.enterprisePermission.findUnique({
          where: { code: perm.code }
        })
        if (!existing) {
          const permission = await db.enterprisePermission.create({
            data: { id: randomUUID(), ...perm, isSystem: true }
          })
          created.push(permission)
        }
      }
      
      return NextResponse.json({ created: created.length, permissions: created })
    }
    
    if (action === 'create_role') {
      const role = await db.enterpriseRole.create({
        data: {
          id: randomUUID(),
          corporateId,
          name: data.name.toLowerCase().replace(/\s+/g, '_'),
          displayName: data.displayName || data.name,
          description: data.description,
          isSystem: false,
          isActive: data.isActive ?? true,
          priority: data.priority || 0
        }
      })
      
      // Log audit
      await db.enterprisePermissionAudit.create({
        data: {
          id: randomUUID(),
          corporateId,
          actorUserId: data.actorUserId,
          actorName: data.actorName,
          action: 'create_role',
          targetType: 'role',
          targetId: role.id,
          targetName: role.displayName,
          newValues: JSON.stringify(role),
          reason: data.reason
        }
      })
      
      return NextResponse.json({ role })
    }
    
    if (action === 'create_permission') {
      const permission = await db.enterprisePermission.create({
        data: {
          id: randomUUID(),
          corporateId: data.corporateId || null,
          code: data.code,
          name: data.name,
          description: data.description,
          category: data.category,
          resource: data.resource,
          action: data.action,
          isSystem: false
        }
      })
      
      return NextResponse.json({ permission })
    }
    
    if (action === 'assign_role') {
      // Check if assignment already exists
      const existing = await db.enterpriseUserRole.findFirst({
        where: { userId: data.userId, roleId: data.roleId, branchId: data.branchId || null }
      })
      
      if (existing) {
        return NextResponse.json({ error: 'Role already assigned' }, { status: 400 })
      }
      
      const assignment = await db.enterpriseUserRole.create({
        data: {
          id: randomUUID(),
          userId: data.userId,
          roleId: data.roleId,
          branchId: data.branchId,
          merchantId: data.merchantId,
          assignedBy: data.assignedBy,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          isActive: true
        },
        include: { Role: true }
      })
      
      // Log audit
      await db.enterprisePermissionAudit.create({
        data: {
          id: randomUUID(),
          corporateId,
          actorUserId: data.assignedBy,
          actorName: data.assignedByName,
          action: 'grant',
          targetType: 'user',
          targetId: data.userId,
          targetName: data.userName,
          newValues: JSON.stringify({ roleId: data.roleId, roleName: assignment.Role.displayName, branchId: data.branchId }),
          reason: data.reason
        }
      })
      
      return NextResponse.json({ assignment })
    }
    
    if (action === 'grant_permission') {
      // Grant a permission to a role
      const rolePerm = await db.enterpriseRolePermission.create({
        data: {
          id: randomUUID(),
          roleId: data.roleId,
          permissionId: data.permissionId,
          granted: true,
          conditions: data.conditions
        },
        include: { Permission: true, Role: true }
      })
      
      // Log audit
      await db.enterprisePermissionAudit.create({
        data: {
          id: randomUUID(),
          corporateId,
          actorUserId: data.actorUserId,
          actorName: data.actorName,
          action: 'grant',
          targetType: 'role',
          targetId: data.roleId,
          targetName: rolePerm.Role.displayName,
          newValues: JSON.stringify({ permissionId: data.permissionId, permissionName: rolePerm.Permission.name }),
          reason: data.reason
        }
      })
      
      return NextResponse.json({ rolePerm })
    }
    
    if (action === 'bulk_grant') {
      // Bulk grant permissions to a role
      const permissionIds = data.permissionIds as string[]
      const results = []
      
      for (const permissionId of permissionIds) {
        const existing = await db.enterpriseRolePermission.findUnique({
          where: { roleId_permissionId: { roleId: data.roleId, permissionId } }
        })
        
        if (!existing) {
          const rp = await db.enterpriseRolePermission.create({
            data: {
              id: randomUUID(),
              roleId: data.roleId,
              permissionId,
              granted: true
            }
          })
          results.push(rp)
        }
      }
      
      // Log audit
      await db.enterprisePermissionAudit.create({
        data: {
          id: randomUUID(),
          corporateId,
          actorUserId: data.actorUserId,
          actorName: data.actorName,
          action: 'update_role',
          targetType: 'role',
          targetId: data.roleId,
          newValues: JSON.stringify({ permissionsGranted: results.length }),
          reason: data.reason
        }
      })
      
      return NextResponse.json({ granted: results.length })
    }
    
    if (action === 'init_default_roles') {
      // Create default roles for a new corporate
      const defaultRoles = [
        { name: 'owner', displayName: 'Owner', description: 'Full access to all features', priority: 100, permissions: ['all'] },
        { name: 'admin', displayName: 'Administrator', description: 'Full administrative access', priority: 80, permissions: ['users.*', 'inventory.*', 'transfers.*', 'reports.*', 'settings.view', 'billing.view'] },
        { name: 'manager', displayName: 'Branch Manager', description: 'Manage branch operations', priority: 60, permissions: ['inventory.*', 'transfers.*', 'reports.view'] },
        { name: 'accountant', displayName: 'Accountant', description: 'Financial reporting access', priority: 50, permissions: ['reports.*', 'billing.view'] },
        { name: 'operator', displayName: 'Operator', description: 'Basic operational access', priority: 20, permissions: ['inventory.view', 'transfers.view', 'transfers.create'] },
        { name: 'viewer', displayName: 'Viewer', description: 'Read-only access', priority: 10, permissions: ['*.view'] },
      ]
      
      const createdRoles = []
      for (const roleData of defaultRoles) {
        const role = await db.enterpriseRole.create({
          data: {
            id: randomUUID(),
            corporateId,
            name: roleData.name,
            displayName: roleData.displayName,
            description: roleData.description,
            isSystem: false,
            isActive: true,
            priority: roleData.priority
          }
        })
        createdRoles.push(role)
      }
      
      return NextResponse.json({ roles: createdRoles, count: createdRoles.length })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error processing RBAC request:', error)
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 })
  }
}

// PUT - Update roles or assignments
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, corporateId, ...data } = body
    
    if (action === 'update_role') {
      const role = await db.enterpriseRole.update({
        where: { id: data.id },
        data: {
          displayName: data.displayName,
          description: data.description,
          isActive: data.isActive,
          priority: data.priority
        }
      })
      
      // Log audit
      await db.enterprisePermissionAudit.create({
        data: {
          id: randomUUID(),
          corporateId,
          actorUserId: data.actorUserId,
          actorName: data.actorName,
          action: 'update_role',
          targetType: 'role',
          targetId: role.id,
          targetName: role.displayName,
          newValues: JSON.stringify(data),
          reason: data.reason
        }
      })
      
      return NextResponse.json({ role })
    }
    
    if (action === 'revoke_permission') {
      await db.enterpriseRolePermission.delete({
        where: { id: data.id }
      })
      
      // Log audit
      await db.enterprisePermissionAudit.create({
        data: {
          id: randomUUID(),
          corporateId,
          actorUserId: data.actorUserId,
          actorName: data.actorName,
          action: 'revoke',
          targetType: 'role',
          targetId: data.roleId,
          newValues: JSON.stringify({ permissionId: data.permissionId }),
          reason: data.reason
        }
      })
      
      return NextResponse.json({ success: true })
    }
    
    if (action === 'update_assignment') {
      const assignment = await db.enterpriseUserRole.update({
        where: { id: data.id },
        data: {
          isActive: data.isActive,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null
        }
      })
      
      // Log audit
      await db.enterprisePermissionAudit.create({
        data: {
          id: randomUUID(),
          corporateId,
          actorUserId: data.actorUserId,
          actorName: data.actorName,
          action: data.isActive ? 'grant' : 'revoke',
          targetType: 'user',
          targetId: assignment.userId,
          newValues: JSON.stringify({ isActive: data.isActive, expiresAt: data.expiresAt }),
          reason: data.reason
        }
      })
      
      return NextResponse.json({ assignment })
    }
    
    if (action === 'revoke_role') {
      await db.enterpriseUserRole.delete({
        where: { id: data.id }
      })
      
      // Log audit
      await db.enterprisePermissionAudit.create({
        data: {
          id: randomUUID(),
          corporateId,
          actorUserId: data.actorUserId,
          actorName: data.actorName,
          action: 'revoke',
          targetType: 'user',
          targetId: data.userId,
          targetName: data.userName,
          oldValues: JSON.stringify({ roleId: data.roleId }),
          reason: data.reason
        }
      })
      
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error updating RBAC data:', error)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

// DELETE - Delete role or permission
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const id = searchParams.get('id')
    const corporateId = searchParams.get('corporateId')
    
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    
    if (action === 'role') {
      // Check if role is in use
      const assignments = await db.enterpriseUserRole.count({
        where: { roleId: id }
      })
      
      if (assignments > 0) {
        return NextResponse.json({ error: 'Role is in use and cannot be deleted' }, { status: 400 })
      }
      
      const role = await db.enterpriseRole.findUnique({ where: { id } })
      
      await db.enterpriseRole.delete({ where: { id } })
      
      // Log audit
      await db.enterprisePermissionAudit.create({
        data: {
          id: randomUUID(),
          corporateId: corporateId || '',
          actorUserId: searchParams.get('actorUserId') || '',
          actorName: searchParams.get('actorName') || 'System',
          action: 'delete_role',
          targetType: 'role',
          targetId: id,
          targetName: role?.displayName || '',
          oldValues: JSON.stringify(role),
          reason: searchParams.get('reason') || undefined
        }
      })
      
      return NextResponse.json({ success: true })
    }
    
    if (action === 'permission') {
      // Only allow deleting non-system permissions
      const permission = await db.enterprisePermission.findUnique({ where: { id } })
      
      if (permission?.isSystem) {
        return NextResponse.json({ error: 'System permissions cannot be deleted' }, { status: 400 })
      }
      
      await db.enterprisePermission.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error deleting RBAC data:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
