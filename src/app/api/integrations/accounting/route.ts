import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// =====================================================
// ACCOUNTING SOFTWARE INTEGRATION API
// Supports: Xero, Sage, QuickBooks
// =====================================================

interface AccountingProvider {
  id: string
  name: string
  oauthUrl: string
  scopes: string[]
  features: string[]
}

const accountingProviders: Record<string, AccountingProvider> = {
  xero: {
    id: 'xero',
    name: 'Xero',
    oauthUrl: 'https://login.xero.com/identity/connect/authorize',
    scopes: ['openid', 'profile', 'email', 'accounting.transactions', 'accounting.settings'],
    features: ['chart_of_accounts', 'invoices', 'bills', 'journal_entries', 'bank_feeds', 'reconciliation']
  },
  sage: {
    id: 'sage',
    name: 'Sage',
    oauthUrl: 'https://oauth.accounting.sage.com/oauth2/auth',
    scopes: ['full_access', 'read_write'],
    features: ['chart_of_accounts', 'invoices', 'bills', 'journal_entries', 'bank_feeds']
  },
  quickbooks: {
    id: 'quickbooks',
    name: 'QuickBooks',
    oauthUrl: 'https://appcenter.intuit.com/connect/oauth2',
    scopes: ['com.intuit.quickbooks.accounting'],
    features: ['chart_of_accounts', 'invoices', 'bills', 'journal_entries', 'bank_feeds']
  }
}

// GET - List all accounting integrations for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const merchantId = searchParams.get('merchantId')
    const action = searchParams.get('action')

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // List all connections and their status
    if (action === 'list') {
      const connections = await db.integrationConnection.findMany({
        where: {
          merchantId,
          integrationType: 'accounting'
        },
        include: {
          _count: {
            select: {
              IntegrationSyncLog: true,
              AccountingMapping: true
            }
          }
        }
      })

      return NextResponse.json({
        providers: accountingProviders,
        connections: connections.map(c => ({
          id: c.id,
          provider: c.provider,
          providerName: accountingProviders[c.provider]?.name || c.provider,
          status: c.status,
          displayName: c.displayName,
          externalOrgName: c.externalOrgName,
          syncEnabled: c.syncEnabled,
          syncFrequency: c.syncFrequency,
          lastSyncAt: c.lastSyncAt,
          lastSyncStatus: c.lastSyncStatus,
          lastSyncError: c.lastSyncError,
          mappingCount: c._count.AccountingMapping,
          syncLogCount: c._count.IntegrationSyncLog,
          createdAt: c.createdAt
        }))
      })
    }

    // Get chart of accounts mapping
    if (action === 'chart-of-accounts') {
      const connectionId = searchParams.get('connectionId')
      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
      }

      const mappings = await db.accountingMapping.findMany({
        where: { connectionId },
        orderBy: { localAccountCode: 'asc' }
      })

      return NextResponse.json({ mappings })
    }

    // Get sync logs
    if (action === 'sync-logs') {
      const connectionId = searchParams.get('connectionId')
      const limit = parseInt(searchParams.get('limit') || '20')

      const logs = await db.integrationSyncLog.findMany({
        where: connectionId ? { connectionId } : undefined,
        orderBy: { startedAt: 'desc' },
        take: limit,
        include: {
          IntegrationConnection: {
            select: { provider: true, displayName: true }
          }
        }
      })

      return NextResponse.json({ logs })
    }

    // Get reconciliation status
    if (action === 'reconciliation') {
      const connectionId = searchParams.get('connectionId')
      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
      }

      const reconciliations = await db.accountingReconciliation.findMany({
        where: { connectionId },
        orderBy: { externalDate: 'desc' },
        take: 50
      })

      const summary = {
        total: reconciliations.length,
        matched: reconciliations.filter(r => r.matchStatus === 'matched').length,
        unmatched: reconciliations.filter(r => r.matchStatus === 'unmatched').length,
        suggested: reconciliations.filter(r => r.matchStatus === 'suggested').length,
        totalVariance: reconciliations.reduce((sum, r) => sum + (r.varianceAmount || 0), 0)
      }

      return NextResponse.json({ reconciliations, summary })
    }

    // Get invoice sync status
    if (action === 'invoice-sync') {
      const connectionId = searchParams.get('connectionId')
      const limit = parseInt(searchParams.get('limit') || '50')

      const invoiceSyncs = await db.accountingInvoiceSync.findMany({
        where: connectionId ? { connectionId } : { merchantId },
        orderBy: { createdAt: 'desc' },
        take: limit
      })

      return NextResponse.json({ invoiceSyncs })
    }

    // Default: return available providers
    return NextResponse.json({ providers: accountingProviders })

  } catch (error) {
    console.error('Accounting integration GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounting integration data' },
      { status: 500 }
    )
  }
}

// POST - Create connection, sync data, or perform actions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, merchantId, provider, connectionId, data } = body

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 })
    }

    // Initiate OAuth connection
    if (action === 'connect') {
      if (!provider || !accountingProviders[provider]) {
        return NextResponse.json({ error: 'Valid provider is required' }, { status: 400 })
      }

      const providerConfig = accountingProviders[provider]
      
      // Create pending connection
      const connection = await db.integrationConnection.create({
        data: {
          id: `ACCT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          merchantId,
          integrationType: 'accounting',
          provider,
          status: 'pending',
          displayName: providerConfig.name,
          syncEnabled: true,
          syncFrequency: 'hourly',
          updatedAt: new Date()
        }
      })

      // Generate OAuth URL (mock for demo)
      const state = Buffer.from(JSON.stringify({
        connectionId: connection.id,
        merchantId,
        provider
      })).toString('base64')

      const oauthUrl = `${providerConfig.oauthUrl}?response_type=code&client_id=DEMO_CLIENT_ID&redirect_uri=${encodeURIComponent(process.env.OAUTH_REDIRECT_URI || 'https://demo.local/callback')}&scope=${providerConfig.scopes.join(' ')}&state=${state}`

      return NextResponse.json({
        connectionId: connection.id,
        oauthUrl,
        message: 'OAuth flow initiated'
      })
    }

    // Complete OAuth connection (callback handler)
    if (action === 'callback') {
      const { connectionId: connId, code, externalOrgId, externalOrgName } = body

      const connection = await db.integrationConnection.update({
        where: { id: connId },
        data: {
          status: 'connected',
          externalOrgId,
          externalOrgName,
          accessToken: 'demo_access_token_' + Date.now(),
          refreshToken: 'demo_refresh_token_' + Date.now(),
          tokenExpiresAt: new Date(Date.now() + 3600000),
          lastSyncAt: new Date(),
          lastSyncStatus: 'success',
          updatedAt: new Date()
        }
      })

      // Create default account mappings (mock)
      const defaultMappings = [
        { localAccountCode: '1100', localAccountName: 'Inventory Asset', localAccountType: 'asset' },
        { localAccountCode: '2100', localAccountName: 'Accounts Payable', localAccountType: 'liability' },
        { localAccountCode: '4000', localAccountName: 'Sales Revenue', localAccountType: 'income' },
        { localAccountCode: '5000', localAccountName: 'Cost of Goods Sold', localAccountType: 'expense' }
      ]

      for (const mapping of defaultMappings) {
        await db.accountingMapping.create({
          data: {
            id: `MAP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            connectionId: connId,
            merchantId,
            ...mapping,
            mappingType: 'auto',
            isActive: true,
            updatedAt: new Date()
          }
        })
      }

      return NextResponse.json({
        success: true,
        connection,
        message: 'Successfully connected to ' + accountingProviders[connection.provider]?.name
      })
    }

    // Sync chart of accounts
    if (action === 'sync-accounts') {
      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
      }

      const connection = await db.integrationConnection.findFirst({
        where: { id: connectionId, merchantId }
      })

      if (!connection || connection.status !== 'connected') {
        return NextResponse.json({ error: 'Connection not found or not connected' }, { status: 400 })
      }

      // Create sync log
      const syncLog = await db.integrationSyncLog.create({
        data: {
          id: `SYNC-${Date.now()}`,
          connectionId,
          syncType: 'incremental',
          direction: 'bidirectional',
          status: 'running',
          startedAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Mock sync - update mappings
      const mockExternalAccounts = [
        { code: '100', name: 'Inventory', externalId: 'ext-100' },
        { code: '200', name: 'Accounts Payable', externalId: 'ext-200' },
        { code: '400', name: 'Sales', externalId: 'ext-400' },
        { code: '500', name: 'Cost of Sales', externalId: 'ext-500' }
      ]

      let recordsUpdated = 0
      for (const extAcc of mockExternalAccounts) {
        await db.accountingMapping.updateMany({
          where: { connectionId },
          data: {
            externalAccountId: extAcc.externalId,
            externalAccountCode: extAcc.code,
            externalAccountName: extAcc.name,
            updatedAt: new Date()
          }
        })
        recordsUpdated++
      }

      // Complete sync log
      await db.integrationSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          durationMs: 500,
          recordsProcessed: mockExternalAccounts.length,
          recordsUpdated: recordsUpdated,
          updatedAt: new Date()
        }
      })

      // Update connection last sync
      await db.integrationConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncAt: new Date(),
          lastSyncStatus: 'success',
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        syncLogId: syncLog.id,
        recordsSynced: mockExternalAccounts.length,
        message: 'Chart of accounts synced successfully'
      })
    }

    // Sync invoices/receipts
    if (action === 'sync-invoices') {
      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
      }

      // Create sync log
      const syncLog = await db.integrationSyncLog.create({
        data: {
          id: `SYNC-${Date.now()}`,
          connectionId,
          syncType: 'incremental',
          direction: 'outbound',
          status: 'running',
          startedAt: new Date(),
          updatedAt: new Date()
        }
      })

      // Mock invoice sync - in production, this would query actual invoices
      const mockInvoices = [
        { id: 'INV-001', externalId: 'EXT-INV-001', status: 'synced' },
        { id: 'INV-002', externalId: 'EXT-INV-002', status: 'synced' }
      ]

      for (const inv of mockInvoices) {
        await db.accountingInvoiceSync.create({
          data: {
            id: `AIS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            merchantId,
            connectionId,
            invoiceId: inv.id,
            externalInvoiceId: inv.externalId,
            externalInvoiceNumber: inv.externalId,
            syncStatus: 'synced',
            syncedAt: new Date(),
            updatedAt: new Date()
          }
        })
      }

      // Complete sync log
      await db.integrationSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          durationMs: 800,
          recordsProcessed: mockInvoices.length,
          recordsCreated: mockInvoices.length,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        invoicesSynced: mockInvoices.length,
        syncLogId: syncLog.id
      })
    }

    // Create journal entry
    if (action === 'create-journal') {
      if (!connectionId || !data) {
        return NextResponse.json({ error: 'connectionId and data are required' }, { status: 400 })
      }

      const { journalEntryId, reference, description, lines } = data

      // Create journal sync record
      const journalSync = await db.accountingJournalSync.create({
        data: {
          id: `AJS-${Date.now()}`,
          merchantId,
          connectionId,
          journalEntryId: journalEntryId || `JE-${Date.now()}`,
          externalJournalId: `EXT-JE-${Date.now()}`,
          syncStatus: 'synced',
          syncedAt: new Date(),
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        journalSync,
        message: 'Journal entry synced to accounting software'
      })
    }

    // Reconciliation matching
    if (action === 'reconcile') {
      if (!connectionId || !data) {
        return NextResponse.json({ error: 'connectionId and data are required' }, { status: 400 })
      }

      const reconciliation = await db.accountingReconciliation.create({
        data: {
          id: `REC-${Date.now()}`,
          merchantId,
          connectionId,
          internalTransactionId: data.internalTransactionId,
          internalReference: data.internalReference,
          internalAmount: data.internalAmount,
          internalDate: data.internalDate,
          externalTransactionId: data.externalTransactionId,
          externalReference: data.externalReference,
          externalAmount: data.externalAmount,
          externalDate: data.externalDate,
          externalDescription: data.externalDescription,
          matchStatus: data.matchStatus || 'matched',
          matchConfidence: data.matchConfidence || 100,
          matchType: data.matchType || 'auto',
          matchedBy: data.matchedBy,
          matchedAt: new Date(),
          varianceAmount: data.varianceAmount || 0,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        reconciliation,
        message: 'Reconciliation record created'
      })
    }

    // Update account mapping
    if (action === 'update-mapping') {
      if (!connectionId || !data) {
        return NextResponse.json({ error: 'connectionId and data are required' }, { status: 400 })
      }

      const mapping = await db.accountingMapping.update({
        where: { id: data.mappingId },
        data: {
          externalAccountId: data.externalAccountId,
          externalAccountCode: data.externalAccountCode,
          externalAccountName: data.externalAccountName,
          mappingType: 'manual',
          vatRate: data.vatRate,
          externalTaxCode: data.externalTaxCode,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        mapping,
        message: 'Account mapping updated'
      })
    }

    // Test connection
    if (action === 'test-connection') {
      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
      }

      const connection = await db.integrationConnection.findFirst({
        where: { id: connectionId, merchantId }
      })

      if (!connection) {
        return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
      }

      // Mock connection test
      const testResult = {
        success: true,
        provider: connection.provider,
        organization: connection.externalOrgName,
        lastSync: connection.lastSyncAt,
        features: accountingProviders[connection.provider]?.features || [],
        message: 'Connection test successful'
      }

      return NextResponse.json(testResult)
    }

    // Disconnect
    if (action === 'disconnect') {
      if (!connectionId) {
        return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
      }

      await db.integrationConnection.update({
        where: { id: connectionId },
        data: {
          status: 'disconnected',
          accessToken: null,
          refreshToken: null,
          updatedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Disconnected from accounting software'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Accounting integration POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process accounting integration request' },
      { status: 500 }
    )
  }
}

// DELETE - Remove connection
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const connectionId = searchParams.get('connectionId')

    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId is required' }, { status: 400 })
    }

    // Delete all related records and connection
    await db.integrationConnection.delete({
      where: { id: connectionId }
    })

    return NextResponse.json({
      success: true,
      message: 'Integration connection deleted'
    })

  } catch (error) {
    console.error('Accounting integration DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete accounting integration' },
      { status: 500 }
    )
  }
}
