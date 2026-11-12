import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

// GET /api/roles - List all roles
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const includeSystem = searchParams.get('includeSystem') === 'true';

    const roles = await db.userRole.findMany({
      where: includeSystem ? {} : { isSystem: false },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      roles: roles.map(r => ({
        id: r.id,
        name: r.name,
        displayName: r.displayName,
        description: r.description,
        permissions: r.permissions ? JSON.parse(r.permissions) : [],
        isSystem: r.isSystem,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

// POST /api/roles - Create a new role
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, displayName, description, permissions } = body;

    if (!name || !displayName) {
      return NextResponse.json(
        { error: 'Name and displayName are required' },
        { status: 400 }
      );
    }

    // Check if role already exists
    const existingRole = await db.userRole.findUnique({ where: { name } });
    if (existingRole) {
      return NextResponse.json(
        { error: 'Role already exists' },
        { status: 400 }
      );
    }

    const now = new Date();
    const role = await db.userRole.create({
      data: {
        id: randomUUID(),
        name,
        displayName,
        description: description || null,
        permissions: permissions ? JSON.stringify(permissions) : '[]',
        isSystem: false,
        updatedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      role: {
        id: role.id,
        name: role.name,
        displayName: role.displayName,
        description: role.description,
        permissions: JSON.parse(role.permissions),
        isSystem: role.isSystem,
      },
    });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}

// PUT /api/roles - Update a role
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, displayName, description, permissions } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    const existingRole = await db.userRole.findUnique({ where: { id } });
    if (!existingRole) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    if (existingRole.isSystem) {
      return NextResponse.json(
        { error: 'Cannot modify system roles' },
        { status: 400 }
      );
    }

    const now = new Date();
    const updatedRole = await db.userRole.update({
      where: { id },
      data: {
        ...(displayName !== undefined && { displayName }),
        ...(description !== undefined && { description }),
        ...(permissions !== undefined && { permissions: JSON.stringify(permissions) }),
        updatedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      role: {
        id: updatedRole.id,
        name: updatedRole.name,
        displayName: updatedRole.displayName,
        description: updatedRole.description,
        permissions: JSON.parse(updatedRole.permissions),
        isSystem: updatedRole.isSystem,
      },
    });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

// DELETE /api/roles - Delete a role
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Role ID is required' },
        { status: 400 }
      );
    }

    const role = await db.userRole.findUnique({ where: { id } });
    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    if (role.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system roles' },
        { status: 400 }
      );
    }

    await db.userRole.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: 'Role deleted',
    });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}
