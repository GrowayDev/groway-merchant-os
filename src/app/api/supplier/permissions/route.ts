import { NextResponse } from 'next/server'

// Define available permissions for supplier portal
const PERMISSIONS = {
  // Orders & Fulfillment
  orders_view: { label: 'View Orders', category: 'Orders', description: 'View purchase orders from buyers' },
  orders_confirm: { label: 'Confirm Orders', category: 'Orders', description: 'Confirm and accept orders' },
  orders_dispatch: { label: 'Dispatch Orders', category: 'Orders', description: 'Mark orders as dispatched and add tracking' },
  orders_cancel: { label: 'Cancel Orders', category: 'Orders', description: 'Cancel orders with reason' },
  
  // Products & Catalog
  products_view: { label: 'View Products', category: 'Products', description: 'View product catalog' },
  products_create: { label: 'Create Products', category: 'Products', description: 'Add new products to catalog' },
  products_edit: { label: 'Edit Products', category: 'Products', description: 'Edit product details and pricing' },
  products_delete: { label: 'Delete Products', category: 'Products', description: 'Remove products from catalog' },
  products_bulk_import: { label: 'Bulk Import', category: 'Products', description: 'Import products via CSV/Excel' },
  
  // RFQs & Quotes
  rfq_view: { label: 'View RFQs', category: 'RFQs', description: 'View requests for quotation' },
  rfq_respond: { label: 'Respond to RFQs', category: 'RFQs', description: 'Submit quotes for RFQs' },
  rfq_create: { label: 'Create RFQs', category: 'RFQs', description: 'Create new RFQ requests' },
  
  // Invoices & Finance
  invoices_view: { label: 'View Invoices', category: 'Invoices', description: 'View supplier invoices' },
  invoices_create: { label: 'Create Invoices', category: 'Invoices', description: 'Create and submit invoices' },
  invoices_edit: { label: 'Edit Invoices', category: 'Invoices', description: 'Modify draft invoices' },
  
  // Settlements & Payments
  settlements_view: { label: 'View Settlements', category: 'Settlements', description: 'View payment settlements' },
  settlements_manage: { label: 'Manage Bank Details', category: 'Settlements', description: 'Update bank account information' },
  
  // Disputes
  disputes_view: { label: 'View Disputes', category: 'Disputes', description: 'View dispute cases' },
  disputes_respond: { label: 'Respond to Disputes', category: 'Disputes', description: 'Respond and resolve disputes' },
  
  // Catalogs
  catalogs_view: { label: 'View Catalogs', category: 'Catalogs', description: 'View product catalogs' },
  catalogs_create: { label: 'Create Catalogs', category: 'Catalogs', description: 'Create new product catalogs' },
  catalogs_edit: { label: 'Edit Catalogs', category: 'Catalogs', description: 'Edit catalog settings and products' },
  catalogs_share: { label: 'Share Catalogs', category: 'Catalogs', description: 'Share catalogs with buyers' },
  
  // Analytics
  analytics_view: { label: 'View Analytics', category: 'Analytics', description: 'View performance analytics' },
  analytics_export: { label: 'Export Reports', category: 'Analytics', description: 'Export analytics reports' },
  
  // Settings
  settings_view: { label: 'View Settings', category: 'Settings', description: 'View supplier settings' },
  settings_edit: { label: 'Edit Settings', category: 'Settings', description: 'Modify supplier settings' },
  
  // Staff Management
  staff_view: { label: 'View Staff', category: 'Staff', description: 'View team members' },
  staff_invite: { label: 'Invite Staff', category: 'Staff', description: 'Invite new team members' },
  staff_manage: { label: 'Manage Staff', category: 'Staff', description: 'Edit roles and permissions' },
  
  // Messages & Communication
  messages_view: { label: 'View Messages', category: 'Messages', description: 'View buyer communications' },
  messages_send: { label: 'Send Messages', category: 'Messages', description: 'Send messages to buyers' }
}

// Default permissions by role
const ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: Object.keys(PERMISSIONS), // All permissions
  admin: [
    'orders_view', 'orders_confirm', 'orders_dispatch', 'orders_cancel',
    'products_view', 'products_create', 'products_edit', 'products_delete', 'products_bulk_import',
    'rfq_view', 'rfq_respond', 'rfq_create',
    'invoices_view', 'invoices_create', 'invoices_edit',
    'settlements_view', 'settlements_manage',
    'disputes_view', 'disputes_respond',
    'catalogs_view', 'catalogs_create', 'catalogs_edit', 'catalogs_share',
    'analytics_view', 'analytics_export',
    'settings_view', 'settings_edit',
    'staff_view', 'staff_invite', 'staff_manage',
    'messages_view', 'messages_send'
  ],
  manager: [
    'orders_view', 'orders_confirm', 'orders_dispatch',
    'products_view', 'products_create', 'products_edit', 'products_bulk_import',
    'rfq_view', 'rfq_respond',
    'invoices_view', 'invoices_create', 'invoices_edit',
    'settlements_view',
    'disputes_view', 'disputes_respond',
    'catalogs_view', 'catalogs_create', 'catalogs_edit', 'catalogs_share',
    'analytics_view', 'analytics_export',
    'messages_view', 'messages_send'
  ],
  staff: [
    'orders_view', 'orders_confirm', 'orders_dispatch',
    'products_view', 'products_edit',
    'rfq_view', 'rfq_respond',
    'invoices_view', 'invoices_create',
    'settlements_view',
    'disputes_view',
    'catalogs_view',
    'messages_view', 'messages_send'
  ],
  viewer: [
    'orders_view',
    'products_view',
    'rfq_view',
    'invoices_view',
    'settlements_view',
    'disputes_view',
    'catalogs_view',
    'analytics_view',
    'messages_view'
  ]
}

// GET /api/supplier/permissions - Get all available permissions and role defaults
export async function GET() {
  return NextResponse.json({
    permissions: PERMISSIONS,
    rolePermissions: ROLE_PERMISSIONS,
    roles: [
      { 
        id: 'owner', 
        label: 'Owner', 
        description: 'Full access to all features including staff management',
        color: '#9333EA'
      },
      { 
        id: 'admin', 
        label: 'Admin', 
        description: 'Manage products, orders, invoices, and settings',
        color: '#00897B'
      },
      { 
        id: 'manager', 
        label: 'Manager', 
        description: 'Handle orders, RFQs, invoices, and catalogs',
        color: '#0369A1'
      },
      { 
        id: 'staff', 
        label: 'Staff', 
        description: 'Process orders and manage day-to-day operations',
        color: '#059669'
      },
      { 
        id: 'viewer', 
        label: 'Viewer', 
        description: 'Read-only access to view orders and products',
        color: '#6B7280'
      }
    ]
  })
}
