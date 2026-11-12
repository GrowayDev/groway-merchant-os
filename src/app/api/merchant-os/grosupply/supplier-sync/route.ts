import { NextRequest, NextResponse } from 'next/server'

// Types for supplier sync
interface SupplierSync {
  id: string
  name: string
  tier: 'bronze' | 'silver' | 'gold' | 'preferred'
  status: 'connected' | 'pending' | 'disconnected'
  rating: number
  leadTime: number
  categories: string[]
  lastSync?: string
  catalogUpdates: number
  priceChanges: number
  newProducts: number
  paymentTerms: string
  autoRFQEnabled: boolean
  syncSettings: {
    autoSync: boolean
    priceAlerts: boolean
    newProductAlerts: boolean
    syncFrequency: 'realtime' | 'hourly' | 'daily'
  }
}

// GET /api/merchant-os/grosupply/supplier-sync - Get sync status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')

    // In production, fetch from database
    const suppliers: SupplierSync[] = [
      {
        id: 'sup-001',
        name: 'Cape Fresh Produce',
        tier: 'gold',
        status: 'connected',
        rating: 4.8,
        leadTime: 1,
        categories: ['Fresh Produce', 'Dairy'],
        lastSync: '2026-02-19T08:30:00Z',
        catalogUpdates: 3,
        priceChanges: 1,
        newProducts: 2,
        paymentTerms: 'Net 30',
        autoRFQEnabled: true,
        syncSettings: {
          autoSync: true,
          priceAlerts: true,
          newProductAlerts: true,
          syncFrequency: 'daily',
        },
      },
      {
        id: 'sup-002',
        name: 'Metro Wholesale',
        tier: 'preferred',
        status: 'connected',
        rating: 4.9,
        leadTime: 2,
        categories: ['Grocery', 'Beverages', 'Snacks'],
        lastSync: '2026-02-19T09:15:00Z',
        catalogUpdates: 0,
        priceChanges: 2,
        newProducts: 5,
        paymentTerms: 'Net 30',
        autoRFQEnabled: true,
        syncSettings: {
          autoSync: true,
          priceAlerts: true,
          newProductAlerts: true,
          syncFrequency: 'realtime',
        },
      },
      {
        id: 'sup-003',
        name: 'SA Dairy Distributors',
        tier: 'silver',
        status: 'connected',
        rating: 4.5,
        leadTime: 2,
        categories: ['Dairy', 'Refrigerated'],
        lastSync: '2026-02-18T16:45:00Z',
        catalogUpdates: 1,
        priceChanges: 0,
        newProducts: 0,
        paymentTerms: 'Net 15',
        autoRFQEnabled: false,
        syncSettings: {
          autoSync: true,
          priceAlerts: false,
          newProductAlerts: true,
          syncFrequency: 'daily',
        },
      },
      {
        id: 'sup-004',
        name: 'Pride Milling Co',
        tier: 'gold',
        status: 'connected',
        rating: 4.7,
        leadTime: 3,
        categories: ['Dry Goods', 'Grains'],
        lastSync: '2026-02-19T07:00:00Z',
        catalogUpdates: 2,
        priceChanges: 0,
        newProducts: 1,
        paymentTerms: 'Net 30',
        autoRFQEnabled: true,
        syncSettings: {
          autoSync: true,
          priceAlerts: true,
          newProductAlerts: true,
          syncFrequency: 'daily',
        },
      },
      {
        id: 'sup-005',
        name: 'Tiger Brands',
        tier: 'preferred',
        status: 'pending',
        rating: 4.6,
        leadTime: 5,
        categories: ['Groceries', 'Snacks', 'Beverages'],
        paymentTerms: 'Net 60',
        autoRFQEnabled: false,
        catalogUpdates: 0,
        priceChanges: 0,
        newProducts: 0,
        syncSettings: {
          autoSync: false,
          priceAlerts: false,
          newProductAlerts: false,
          syncFrequency: 'daily',
        },
      },
    ]

    // Filter by status if provided
    const filteredSuppliers = status 
      ? suppliers.filter(s => s.status === status)
      : suppliers

    // Get single supplier if supplierId provided
    if (supplierId) {
      const supplier = suppliers.find(s => s.id === supplierId)
      if (!supplier) {
        return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
      }
      return NextResponse.json({ supplier })
    }

    // Calculate stats
    const stats = {
      total: filteredSuppliers.length,
      connected: filteredSuppliers.filter(s => s.status === 'connected').length,
      pending: filteredSuppliers.filter(s => s.status === 'pending').length,
      disconnected: filteredSuppliers.filter(s => s.status === 'disconnected').length,
      totalCatalogUpdates: filteredSuppliers.reduce((sum, s) => sum + s.catalogUpdates, 0),
      totalPriceChanges: filteredSuppliers.reduce((sum, s) => sum + s.priceChanges, 0),
      totalNewProducts: filteredSuppliers.reduce((sum, s) => sum + s.newProducts, 0),
      autoRFQEnabled: filteredSuppliers.filter(s => s.autoRFQEnabled).length,
    }

    // Get notifications (suppliers with changes)
    const notifications = filteredSuppliers
      .filter(s => s.priceChanges > 0 || s.newProducts > 0)
      .map(s => ({
        supplierId: s.id,
        supplierName: s.name,
        priceChanges: s.priceChanges,
        newProducts: s.newProducts,
        lastSync: s.lastSync,
      }))

    return NextResponse.json({
      suppliers: filteredSuppliers,
      stats,
      notifications,
    })
  } catch (error) {
    console.error('Error fetching supplier sync status:', error)
    return NextResponse.json({ error: 'Failed to fetch supplier sync status' }, { status: 500 })
  }
}

// POST /api/merchant-os/grosupply/supplier-sync - Trigger sync
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Sync single supplier
    if (body.supplierId) {
      const { supplierId } = body

      // In production:
      // 1. Call supplier's API to get latest catalog, prices, products
      // 2. Compare with local data
      // 3. Update database with changes
      // 4. Generate notifications for changes

      const syncResult = {
        supplierId,
        syncedAt: new Date().toISOString(),
        changes: {
          catalogUpdates: Math.floor(Math.random() * 5),
          priceChanges: Math.floor(Math.random() * 3),
          newProducts: Math.floor(Math.random() * 2),
        },
        status: 'success',
      }

      return NextResponse.json({
        message: 'Supplier synced successfully',
        ...syncResult,
      })
    }

    // Sync all connected suppliers
    if (body.syncAll) {
      // In production, queue sync jobs for all connected suppliers
      const syncResults = [
        { supplierId: 'sup-001', status: 'success', syncedAt: new Date().toISOString() },
        { supplierId: 'sup-002', status: 'success', syncedAt: new Date().toISOString() },
        { supplierId: 'sup-003', status: 'success', syncedAt: new Date().toISOString() },
        { supplierId: 'sup-004', status: 'success', syncedAt: new Date().toISOString() },
      ]

      return NextResponse.json({
        message: 'All suppliers synced',
        results: syncResults,
        syncedAt: new Date().toISOString(),
      })
    }

    // Connect new supplier
    if (body.action === 'connect') {
      const { supplierId, apiKey, syncSettings } = body

      // In production:
      // 1. Validate API credentials with supplier
      // 2. Store connection details securely
      // 3. Perform initial sync

      return NextResponse.json({
        message: 'Supplier connected successfully',
        supplierId,
        status: 'connected',
        connectedAt: new Date().toISOString(),
      })
    }

    // Disconnect supplier
    if (body.action === 'disconnect') {
      const { supplierId, reason } = body

      // In production:
      // 1. Remove API credentials
      // 2. Stop auto-sync
      // 3. Keep historical data

      return NextResponse.json({
        message: 'Supplier disconnected',
        supplierId,
        status: 'disconnected',
        disconnectedAt: new Date().toISOString(),
      })
    }

    // Update sync settings
    if (body.action === 'updateSettings') {
      const { supplierId, settings } = body

      // In production, update settings in database

      return NextResponse.json({
        message: 'Sync settings updated',
        supplierId,
        settings,
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error syncing suppliers:', error)
    return NextResponse.json({ error: 'Failed to sync suppliers' }, { status: 500 })
  }
}

// PUT /api/merchant-os/grosupply/supplier-sync - Update supplier settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const { supplierId, updates } = body

    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }

    // In production, update supplier record in database

    return NextResponse.json({
      message: 'Supplier updated',
      supplierId,
      updates,
      updatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
}
