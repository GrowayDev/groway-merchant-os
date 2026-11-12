'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Wifi,
  WifiOff,
  Cloud,
  Clock,
  CheckCircle2,
  AlertCircle,
  Database,
  Upload,
  Trash2,
  Eye,
  RefreshCw,
  HardDrive,
  Repeat,
} from 'lucide-react'

// Types
interface OfflineTransaction {
  id: string
  type: 'sale' | 'refund' | 'void' | 'payout'
  amount: number
  items: Array<{
    name: string
    quantity: number
    price: number
  }>
  paymentMethod: string
  timestamp: string
  syncStatus: 'pending' | 'syncing' | 'synced' | 'failed'
  syncedAt?: string
  retryCount: number
  verticalId: string
  subVerticalId: string
  cashierId?: string
  notes?: string
}

interface OfflineMetrics {
  totalTransactions: number
  pendingSync: number
  syncedToday: number
  failedSync: number
  oldestPending?: string
  storageUsed: number // in MB
  bufferHours: number
}

// IndexedDB Setup
const DB_NAME = 'GrowayOfflineDB'
const DB_VERSION = 1
const TRANSACTIONS_STORE = 'transactions'

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      
      if (!db.objectStoreNames.contains(TRANSACTIONS_STORE)) {
        const txnStore = db.createObjectStore(TRANSACTIONS_STORE, { keyPath: 'id' })
        txnStore.createIndex('syncStatus', 'syncStatus', { unique: false })
        txnStore.createIndex('timestamp', 'timestamp', { unique: false })
      }
    }
  })
}

// Context for offline state
interface OfflineContextType {
  isOnline: boolean
  pendingTransactions: OfflineTransaction[]
  metrics: OfflineMetrics
  addTransaction: (txn: Omit<OfflineTransaction, 'id' | 'timestamp' | 'syncStatus' | 'retryCount'>) => Promise<string>
  syncNow: () => Promise<void>
  clearSynced: () => Promise<void>
  retryFailed: () => Promise<void>
}

const OfflineContext = createContext<OfflineContextType | null>(null)

export function useOfflineMode() {
  const context = useContext(OfflineContext)
  if (!context) {
    throw new Error('useOfflineMode must be used within OfflineModeProvider')
  }
  return context
}

// Provider Component
export function OfflineModeProvider({ children }: { children: ReactNode }) {
  // Initialize with current online status - use lazy initializer for SSR safety
  const [isOnline, setIsOnline] = useState(() => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
      return navigator.onLine
    }
    return true // Default to online for SSR
  })
  const [pendingTransactions, setPendingTransactions] = useState<OfflineTransaction[]>([])
  const [metrics, setMetrics] = useState<OfflineMetrics>({
    totalTransactions: 0,
    pendingSync: 0,
    syncedToday: 0,
    failedSync: 0,
    storageUsed: 0,
    bufferHours: 72,
  })
  const [db, setDb] = useState<IDBDatabase | null>(null)

  // Update metrics - defined first since it's used by other functions
  const updateMetrics = useCallback((transactions: OfflineTransaction[]) => {
    const pending = transactions.filter(t => t.syncStatus === 'pending')
    const today = new Date().toDateString()
    const syncedToday = transactions.filter(t => 
      t.syncStatus === 'synced' && new Date(t.timestamp).toDateString() === today
    )
    const failed = transactions.filter(t => t.syncStatus === 'failed')
    
    const storageUsed = (transactions.length * 1) / 1024 // MB
    
    const oldestPending = pending.length > 0 
      ? pending.reduce((oldest, t) => 
          new Date(t.timestamp) < new Date(oldest.timestamp) ? t : oldest
        ).timestamp
      : undefined
    
    setMetrics({
      totalTransactions: transactions.length,
      pendingSync: pending.length,
      syncedToday: syncedToday.length,
      failedSync: failed.length,
      oldestPending,
      storageUsed: Math.round(storageUsed * 100) / 100,
      bufferHours: 72,
    })
  }, [])

  // Load transactions from IndexedDB
  const loadTransactions = useCallback((database: IDBDatabase) => {
    const tx = database.transaction(TRANSACTIONS_STORE, 'readonly')
    const store = tx.objectStore(TRANSACTIONS_STORE)
    const request = store.getAll()
    
    request.onsuccess = () => {
      const transactions = request.result as OfflineTransaction[]
      setPendingTransactions(transactions)
      updateMetrics(transactions)
    }
  }, [updateMetrics])

  // Initialize database
  useEffect(() => {
    openDatabase().then(database => {
      setDb(database)
      loadTransactions(database)
    }).catch(console.error)
  }, [loadTransactions])

  // Network status detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Add transaction
  const addTransaction = useCallback(async (txn: Omit<OfflineTransaction, 'id' | 'timestamp' | 'syncStatus' | 'retryCount'>) => {
    if (!db) throw new Error('Database not initialized')
    
    const newTxn: OfflineTransaction = {
      ...txn,
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      syncStatus: 'pending',
      retryCount: 0,
    }
    
    const tx = db.transaction(TRANSACTIONS_STORE, 'readwrite')
    const store = tx.objectStore(TRANSACTIONS_STORE)
    
    return new Promise((resolve, reject) => {
      const request = store.add(newTxn)
      request.onsuccess = () => {
        setPendingTransactions(prev => {
          const updated = [...prev, newTxn]
          updateMetrics(updated)
          return updated
        })
        resolve(newTxn.id)
      }
      request.onerror = () => reject(request.error)
    })
  }, [db, updateMetrics])

  // Helper function to update transaction in IndexedDB with a fresh transaction
  const updateTransactionInDB = useCallback(async (txn: OfflineTransaction): Promise<void> => {
    if (!db) return
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction(TRANSACTIONS_STORE, 'readwrite')
      const store = tx.objectStore(TRANSACTIONS_STORE)
      const request = store.put(txn)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }, [db])

  // Sync transactions
  const syncNow = useCallback(async () => {
    if (!db || !isOnline) return
    
    const pending = pendingTransactions.filter(t => t.syncStatus === 'pending' || t.syncStatus === 'failed')
    
    for (const txn of pending) {
      // Update status to syncing - use fresh transaction
      const syncingTxn = { ...txn, syncStatus: 'syncing' as const }
      try {
        await updateTransactionInDB(syncingTxn)
        setPendingTransactions(prev => 
          prev.map(t => t.id === txn.id ? syncingTxn : t)
        )
      } catch (error) {
        console.error('Failed to update syncing status:', error)
        continue
      }
      
      try {
        // Actually sync with the server API
        const response = await fetch('/merchant-os/api/pos/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            merchantId: 'merchant-001',
            branchId: 'branch-001',
            items: txn.items,
            total: txn.amount,
            paymentMethod: txn.paymentMethod,
            staffId: txn.cashierId,
            notes: txn.notes,
          })
        })
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`)
        }
        
        // Success - update to synced with fresh transaction
        const syncedTxn = { 
          ...txn, 
          syncStatus: 'synced' as const, 
          syncedAt: new Date().toISOString(),
          retryCount: txn.retryCount + 1 
        }
        await updateTransactionInDB(syncedTxn)
        setPendingTransactions(prev => 
          prev.map(t => t.id === txn.id ? syncedTxn : t)
        )
      } catch (error) {
        console.error('Sync failed for transaction:', txn.id, error)
        // Failure - update to failed with fresh transaction
        const failedTxn = { 
          ...txn, 
          syncStatus: 'failed' as const,
          retryCount: txn.retryCount + 1 
        }
        try {
          await updateTransactionInDB(failedTxn)
          setPendingTransactions(prev => 
            prev.map(t => t.id === txn.id ? failedTxn : t)
          )
        } catch (dbError) {
          console.error('Failed to update failed status:', dbError)
        }
      }
    }
    
    setPendingTransactions(prev => {
      updateMetrics(prev)
      return prev
    })
  }, [db, isOnline, pendingTransactions, updateMetrics, updateTransactionInDB])

  // Auto-sync when online
  useEffect(() => {
    if (isOnline && pendingTransactions.some(t => t.syncStatus === 'pending')) {
      const timer = setTimeout(() => syncNow(), 5000)
      return () => clearTimeout(timer)
    }
  }, [isOnline, pendingTransactions, syncNow])

  // Clear synced transactions
  const clearSynced = useCallback(async () => {
    if (!db) return
    
    const tx = db.transaction(TRANSACTIONS_STORE, 'readwrite')
    const store = tx.objectStore(TRANSACTIONS_STORE)
    
    const synced = pendingTransactions.filter(t => t.syncStatus === 'synced')
    for (const txn of synced) {
      store.delete(txn.id)
    }
    
    const remaining = pendingTransactions.filter(t => t.syncStatus !== 'synced')
    setPendingTransactions(remaining)
    updateMetrics(remaining)
  }, [db, pendingTransactions, updateMetrics])

  // Retry failed transactions
  const retryFailed = useCallback(async () => {
    if (!db) return
    
    const tx = db.transaction(TRANSACTIONS_STORE, 'readwrite')
    const store = tx.objectStore(TRANSACTIONS_STORE)
    
    const failed = pendingTransactions.filter(t => t.syncStatus === 'failed')
    for (const txn of failed) {
      const updatedTxn = { ...txn, syncStatus: 'pending' as const }
      store.put(updatedTxn)
    }
    
    const updated = pendingTransactions.map(t => 
      t.syncStatus === 'failed' ? { ...t, syncStatus: 'pending' as const } : t
    )
    setPendingTransactions(updated)
    
    if (isOnline) {
      setTimeout(() => syncNow(), 100)
    }
  }, [db, isOnline, pendingTransactions, syncNow])

  return (
    <OfflineContext.Provider value={{
      isOnline,
      pendingTransactions,
      metrics,
      addTransaction,
      syncNow,
      clearSynced,
      retryFailed,
    }}>
      {children}
    </OfflineContext.Provider>
  )
}

// Status Badge Component
export function OfflineStatusBadge() {
  const { isOnline, metrics } = useOfflineMode()
  
  if (isOnline && metrics.pendingSync === 0) {
    return (
      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700">
        <Wifi className="h-3 w-3 mr-1" />
        Online
      </Badge>
    )
  }
  
  if (!isOnline) {
    return (
      <Badge variant="outline" className="bg-amber-50 border-amber-200 text-amber-700">
        <WifiOff className="h-3 w-3 mr-1" />
        Offline
        {metrics.pendingSync > 0 && (
          <span className="ml-1">({metrics.pendingSync})</span>
        )}
      </Badge>
    )
  }
  
  return (
    <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700">
      <Repeat className="h-3 w-3 mr-1 animate-spin" />
      Syncing ({metrics.pendingSync})
    </Badge>
  )
}

// Main Manager Component
export function OfflineModeManager() {
  const { isOnline, pendingTransactions, metrics, syncNow, clearSynced, retryFailed } = useOfflineMode()
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTxn, setSelectedTxn] = useState<OfflineTransaction | null>(null)

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor(diff / (1000 * 60))
    
    if (hours < 1) return `${minutes} min ago`
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString('en-ZA')
  }

  const getStatusIcon = (status: OfflineTransaction['syncStatus']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-500" />
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case 'synced':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusColor = (status: OfflineTransaction['syncStatus']) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700'
      case 'syncing':
        return 'bg-blue-100 text-blue-700'
      case 'synced':
        return 'bg-green-100 text-green-700'
      case 'failed':
        return 'bg-red-100 text-red-700'
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-[#00897B]" />
              Offline Mode Manager
            </h1>
            <p className="text-sm text-[#757575]">72-hour transaction buffer with automatic sync</p>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Badge className="bg-green-100 text-green-700">
                <Wifi className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-700">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 p-6 bg-gray-50">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${isOnline ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'} flex items-center justify-center`}>
                {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1A1A]">{isOnline ? 'Online' : 'Offline'}</p>
                <p className="text-xs text-[#757575]">Network Status</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <Database className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1A1A]">{metrics.totalTransactions}</p>
                <p className="text-xs text-[#757575]">Total Stored</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1A1A]">{metrics.pendingSync}</p>
                <p className="text-xs text-[#757575]">Pending Sync</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 text-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1A1A]">{metrics.syncedToday}</p>
                <p className="text-xs text-[#757575]">Synced Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                <Cloud className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-[#1A1A1A]">{metrics.storageUsed} MB</p>
                <p className="text-xs text-[#757575]">Storage Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sync Actions */}
      <div className="px-6 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              onClick={syncNow} 
              disabled={!isOnline || metrics.pendingSync === 0}
              className="bg-[#00897B] hover:bg-[#00695C]"
            >
              <Upload className="h-4 w-4 mr-2" />
              Sync Now
            </Button>
            <Button variant="outline" onClick={retryFailed} disabled={metrics.failedSync === 0}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry Failed ({metrics.failedSync})
            </Button>
            <Button variant="outline" onClick={clearSynced} disabled={metrics.syncedToday === 0}>
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Synced
            </Button>
          </div>
          <div className="text-sm text-[#757575]">
            <span className="font-medium text-[#1A1A1A]">Buffer:</span> 72 hours
            {metrics.oldestPending && (
              <span className="ml-2">• Oldest: {formatTime(metrics.oldestPending)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Transaction Queue</CardTitle>
            <CardDescription>
              Offline transactions will sync automatically when connection is restored
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTransactions.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p className="text-[#757575]">No pending transactions</p>
                <p className="text-sm text-gray-400">All transactions are synced</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {pendingTransactions
                    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                    .map(txn => (
                      <div 
                        key={txn.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                        onClick={() => {
                          setSelectedTxn(txn)
                          setDetailOpen(true)
                        }}
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(txn.syncStatus)}
                          <div>
                            <p className="font-medium text-sm text-[#1A1A1A]">
                              {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)} - R{txn.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-[#757575]">
                              {txn.items.length} items • {txn.paymentMethod} • {formatTime(txn.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={getStatusColor(txn.syncStatus)}>
                            {txn.syncStatus}
                          </Badge>
                          {txn.retryCount > 0 && (
                            <span className="text-xs text-gray-400">
                              Retry #{txn.retryCount}
                            </span>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-[#1A1A1A]">IndexedDB Storage</h3>
                  <p className="text-sm text-[#757575] mt-1">
                    Transactions are stored locally in your browser using IndexedDB. 
                    Data persists even if you close the browser or restart your device.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium text-[#1A1A1A]">72-Hour Buffer</h3>
                  <p className="text-sm text-[#757575] mt-1">
                    Operate offline for up to 72 hours. Transactions automatically sync 
                    when connection is restored. Older transactions are flagged for review.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transaction Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-md">
          {selectedTxn && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getStatusIcon(selectedTxn.syncStatus)}
                  Transaction Details
                </DialogTitle>
                <DialogDescription>
                  ID: {selectedTxn.id}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[#757575]">Type</p>
                    <p className="font-medium text-[#1A1A1A] capitalize">{selectedTxn.type}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[#757575]">Amount</p>
                    <p className="font-bold text-[#00897B]">R{selectedTxn.amount.toFixed(2)}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[#757575]">Payment</p>
                    <p className="font-medium text-[#1A1A1A] capitalize">{selectedTxn.paymentMethod}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-[#757575]">Status</p>
                    <Badge className={getStatusColor(selectedTxn.syncStatus)}>
                      {selectedTxn.syncStatus}
                    </Badge>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <p className="text-xs text-[#757575] mb-2">Items ({selectedTxn.items.length})</p>
                  <div className="space-y-2 max-h-32 overflow-auto">
                    {selectedTxn.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-[#1A1A1A]">{item.name} × {item.quantity}</span>
                        <span className="text-[#757575]">R{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[#757575]">Created</p>
                    <p className="text-[#1A1A1A]">{new Date(selectedTxn.timestamp).toLocaleString('en-ZA')}</p>
                  </div>
                  {selectedTxn.syncedAt && (
                    <div>
                      <p className="text-[#757575]">Synced</p>
                      <p className="text-[#1A1A1A]">{new Date(selectedTxn.syncedAt).toLocaleString('en-ZA')}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[#757575]">Retry Count</p>
                    <p className="text-[#1A1A1A]">{selectedTxn.retryCount}</p>
                  </div>
                  <div>
                    <p className="text-[#757575]">Vertical</p>
                    <p className="text-[#1A1A1A]">{selectedTxn.verticalId}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Close
                </Button>
                {selectedTxn.syncStatus === 'failed' && (
                  <Button onClick={() => {
                    retryFailed()
                    setDetailOpen(false)
                  }}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                  </Button>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default OfflineModeManager
