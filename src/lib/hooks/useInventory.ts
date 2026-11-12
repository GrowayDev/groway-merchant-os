/**
 * Inventory API Hooks
 * 
 * React hooks for connecting frontend to inventory backend services
 * Phase 10: Frontend Connection
 */

import { useState, useEffect, useCallback } from 'react'

// Base API URL helper
const getApiUrl = (path: string, port?: number) => {
  if (port) {
    return `/api${path}?XTransformPort=${port}`
  }
  return `/api${path}`
}

// Generic fetch helper
async function apiFetch<T>(
  path: string,
  options?: RequestInit & { port?: number }
): Promise<{ data: T | null; error: string | null }> {
  try {
    const { port, ...fetchOptions } = options || {}
    const url = getApiUrl(path, port)
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions?.headers,
      },
      ...fetchOptions,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return { data: null, error: errorData.error || 'Request failed' }
    }

    const data = await response.json()
    return { data, error: null }
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : 'Unknown error' }
  }
}

// ============ TYPES ============

export interface Product {
  id: string
  name: string
  sku: string
  barcode?: string
  category: string
  price: number
  cost: number
  currentStock: number
  reorderPoint: number
  reorderQuantity: number
  minStock: number
  maxStock?: number
  unit: string
  location?: string
  supplier?: string
  supplierLeadTime?: number
  batchTracked: boolean
  expiryTracked: boolean
  lastUpdated: string
  velocity?: number
  daysOfStock?: number
}

export interface StockMovement {
  id: string
  type: 'sale' | 'return' | 'grn' | 'adjustment' | 'transfer_in' | 'transfer_out' | 'stocktake'
  direction: 'in' | 'out'
  productName: string
  sku: string
  quantity: number
  reason?: string
  user: string
  timestamp: string
  value: number
}

export interface StockTransfer {
  id: string
  transferNo: string
  status: 'draft' | 'pending_approval' | 'approved' | 'in_transit' | 'completed' | 'rejected' | 'reversed'
  sourceLocation: string
  destinationLocation: string
  items: { productId: string; productName: string; quantity: number }[]
  requestedBy: string
  requestedAt: string
  approvedBy?: string
  expectedArrival?: string
  notes?: string
  totalValue: number
}

export interface DemandForecast {
  productId: string
  productName: string
  sku: string
  currentStock: number
  forecast7Days: number
  forecast30Days: number
  confidence: number
  trend: 'increasing' | 'stable' | 'decreasing'
  seasonality: 'high' | 'medium' | 'low'
  stockOutRisk: 'critical' | 'high' | 'medium' | 'low'
  recommendedOrder: number
  recommendedOrderDate: string
  insights: string[]
}

export interface ExpiryAlert {
  batchId: string
  batchNo: string
  productId: string
  productName: string
  sku: string
  quantity: number
  expiryDate: string
  daysUntilExpiry: number
  alertLevel: 'critical' | 'warning' | 'notice'
  action: 'dispose' | 'discount' | 'return' | 'sell_soon'
  estimatedValue: number
}

export interface StockAlert {
  id: string
  productId: string
  productName: string
  sku: string
  alertType: 'out_of_stock' | 'low_stock' | 'overstock' | 'negative_stock' | 'slow_moving'
  severity: 'critical' | 'high' | 'medium' | 'low'
  currentStock: number
  reorderPoint: number
  message: string
  suggestedAction: string
}

export interface COGSReport {
  period: string
  openingStock: number
  purchases: number
  closingStock: number
  cogs: number
  grossMargin: number
  grossMarginPercent: number
}

export interface InventoryValuation {
  method: 'cost' | 'retail' | 'lower_of_cost_or_market'
  totalValue: number
  itemCount: number
  valuationDate: string
  breakdown: { category: string; value: number; itemCount: number }[]
}

export interface JournalEntry {
  id: string
  entryNo: string
  date: string
  type: 'grn' | 'sale' | 'adjustment' | 'transfer' | 'stocktake'
  description: string
  debit: { account: string; amount: number }
  credit: { account: string; amount: number }
  reference?: string
}

// ============ PRODUCTS HOOKS ============

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      setLoading(true)
      const result = await apiFetch<Product[]>('/inventory/products')
      if (mounted) {
        setProducts(result.data || [])
        setError(result.error)
        setLoading(false)
      }
    }
    
    fetchData()
    
    return () => { mounted = false }
  }, [])

  const createProduct = useCallback(async (product: Partial<Product>) => {
    const result = await apiFetch<Product>('/inventory/products', {
      method: 'POST',
      body: JSON.stringify(product),
    })
    if (result.data) {
      setProducts(prev => [...prev, result.data!])
    }
    return result
  }, [])

  const updateProduct = useCallback(async (id: string, updates: Partial<Product>) => {
    const result = await apiFetch<Product>(`/inventory/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
    if (result.data) {
      setProducts(prev => prev.map(p => p.id === id ? result.data! : p))
    }
    return result
  }, [])

  const deleteProduct = useCallback(async (id: string) => {
    const result = await apiFetch(`/inventory/products/${id}`, { method: 'DELETE' })
    if (!result.error) {
      setProducts(prev => prev.filter(p => p.id !== id))
    }
    return result
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    const result = await apiFetch<Product[]>('/inventory/products')
    setProducts(result.data || [])
    setError(result.error)
    setLoading(false)
  }, [])

  return { products, loading, error, refetch, createProduct, updateProduct, deleteProduct }
}

// ============ STOCK MOVEMENTS HOOKS ============

export function useStockMovements(limit: number = 50) {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      setLoading(true)
      const result = await apiFetch<{ movements: StockMovement[] }>(`/inventory/movements?limit=${limit}`)
      if (mounted) {
        setMovements(result.data?.movements || [])
        setError(result.error)
        setLoading(false)
      }
    }
    
    fetchData()
    
    return () => { mounted = false }
  }, [limit])

  const createMovement = useCallback(async (movement: Partial<StockMovement>) => {
    const result = await apiFetch<StockMovement>('/inventory/movements', {
      method: 'POST',
      body: JSON.stringify(movement),
    })
    if (result.data) {
      setMovements(prev => [result.data!, ...prev])
    }
    return result
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    const result = await apiFetch<{ movements: StockMovement[] }>(`/inventory/movements?limit=${limit}`)
    setMovements(result.data?.movements || [])
    setError(result.error)
    setLoading(false)
  }, [limit])

  return { movements, loading, error, refetch, createMovement }
}

// ============ TRANSFERS HOOKS ============

export function useTransfers() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      setLoading(true)
      const result = await apiFetch<{ transfers: StockTransfer[] }>('/inventory/transfers')
      if (mounted) {
        setTransfers(result.data?.transfers || [])
        setError(result.error)
        setLoading(false)
      }
    }
    
    fetchData()
    
    return () => { mounted = false }
  }, [])

  const createTransfer = useCallback(async (transfer: Partial<StockTransfer>) => {
    const result = await apiFetch<StockTransfer>('/inventory/transfers', {
      method: 'POST',
      body: JSON.stringify(transfer),
    })
    if (result.data) {
      setTransfers(prev => [result.data!, ...prev])
    }
    return result
  }, [])

  const approveTransfer = useCallback(async (id: string) => {
    const result = await apiFetch<StockTransfer>('/inventory/transfers/approval', {
      method: 'POST',
      body: JSON.stringify({ transferId: id, action: 'approve' }),
    })
    if (result.data) {
      setTransfers(prev => prev.map(t => t.id === id ? result.data! : t))
    }
    return result
  }, [])

  const rejectTransfer = useCallback(async (id: string, reason: string) => {
    const result = await apiFetch<StockTransfer>('/inventory/transfers/approval', {
      method: 'POST',
      body: JSON.stringify({ transferId: id, action: 'reject', reason }),
    })
    if (result.data) {
      setTransfers(prev => prev.map(t => t.id === id ? result.data! : t))
    }
    return result
  }, [])

  const completeTransfer = useCallback(async (id: string) => {
    const result = await apiFetch<StockTransfer>(`/inventory/transfers/${id}/complete`, { method: 'POST' })
    if (result.data) {
      setTransfers(prev => prev.map(t => t.id === id ? result.data! : t))
    }
    return result
  }, [])

  const reverseTransfer = useCallback(async (id: string, reason: string) => {
    const result = await apiFetch<StockTransfer>('/inventory/transfers/reversal', {
      method: 'POST',
      body: JSON.stringify({ transferId: id, reason }),
    })
    if (result.data) {
      setTransfers(prev => prev.map(t => t.id === id ? result.data! : t))
    }
    return result
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    const result = await apiFetch<{ transfers: StockTransfer[] }>('/inventory/transfers')
    setTransfers(result.data?.transfers || [])
    setError(result.error)
    setLoading(false)
  }, [])

  return {
    transfers, loading, error, refetch, createTransfer, approveTransfer,
    rejectTransfer, completeTransfer, reverseTransfer,
  }
}

// ============ FORECAST HOOKS ============

export function useForecasts() {
  const [forecasts, setForecasts] = useState<DemandForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      setLoading(true)
      const result = await apiFetch<{ forecasts: DemandForecast[] }>('/inventory/forecast')
      if (mounted) {
        setForecasts(result.data?.forecasts || [])
        setError(result.error)
        setLoading(false)
      }
    }
    
    fetchData()
    
    return () => { mounted = false }
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    const result = await apiFetch<{ forecasts: DemandForecast[] }>('/inventory/forecast')
    setForecasts(result.data?.forecasts || [])
    setError(result.error)
    setLoading(false)
  }, [])

  return { forecasts, loading, error, refetch }
}

export function useInsights() {
  const [insights, setInsights] = useState<{ type: string; title: string; message: string; action?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      setLoading(true)
      const result = await apiFetch<{ insights: typeof insights }>('/inventory/insights')
      if (mounted) {
        setInsights(result.data?.insights || [])
        setError(result.error)
        setLoading(false)
      }
    }
    
    fetchData()
    
    return () => { mounted = false }
  }, [])

  const refetch = useCallback(async () => {
    setLoading(true)
    const result = await apiFetch<{ insights: typeof insights }>('/inventory/insights')
    setInsights(result.data?.insights || [])
    setError(result.error)
    setLoading(false)
  }, [])

  return { insights, loading, error, refetch }
}

// ============ EXPIRY ALERTS HOOKS ============

export function useExpiryAlerts(port: number = 3005) {
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      setLoading(true)
      const result = await apiFetch<{ alerts: ExpiryAlert[] }>('/alerts', port)
      if (mounted) {
        setAlerts(result.data?.alerts || [])
        setError(result.error)
        setLoading(false)
      }
    }
    
    fetchData()
    
    return () => { mounted = false }
  }, [port])

  const markExpired = useCallback(async (batchId: string) => {
    const result = await apiFetch('/batch/expire', {
      method: 'POST',
      body: JSON.stringify({ batchId }),
      port,
    })
    if (!result.error) {
      setAlerts(prev => prev.filter(a => a.batchId !== batchId))
    }
    return result
  }, [port])

  const extendExpiry = useCallback(async (batchId: string, newExpiryDate: string, reason: string) => {
    const result = await apiFetch('/batch/extend', {
      method: 'POST',
      body: JSON.stringify({ batchId, newExpiryDate, reason }),
      port,
    })
    return result
  }, [port])

  const refetch = useCallback(async () => {
    setLoading(true)
    const result = await apiFetch<{ alerts: ExpiryAlert[] }>('/alerts', port)
    setAlerts(result.data?.alerts || [])
    setError(result.error)
    setLoading(false)
  }, [port])

  return { alerts, loading, error, refetch, markExpired, extendExpiry }
}

// ============ STOCK ALERTS HOOKS ============

export function useStockAlerts(port: number = 3006) {
  const [alerts, setAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      setLoading(true)
      const result = await apiFetch<{ alerts: StockAlert[] }>('/alerts', port)
      if (mounted) {
        setAlerts(result.data?.alerts || [])
        setError(result.error)
        setLoading(false)
      }
    }
    
    fetchData()
    
    return () => { mounted = false }
  }, [port])

  const acknowledge = useCallback(async (alertId: string) => {
    const result = await apiFetch('/alerts/acknowledge', {
      method: 'POST',
      body: JSON.stringify({ alertId }),
      port,
    })
    if (!result.error) {
      setAlerts(prev => prev.filter(a => a.id !== alertId))
    }
    return result
  }, [port])

  const getSummary = useCallback(async () => {
    return apiFetch<{
      total: number
      bySeverity: Record<string, number>
      byType: Record<string, number>
    }>('/summary', port)
  }, [port])

  const refetch = useCallback(async () => {
    setLoading(true)
    const result = await apiFetch<{ alerts: StockAlert[] }>('/alerts', port)
    setAlerts(result.data?.alerts || [])
    setError(result.error)
    setLoading(false)
  }, [port])

  return { alerts, loading, error, refetch, acknowledge, getSummary }
}

// ============ ACCOUNTING HOOKS ============

export function useCOGS(period?: string) {
  const [cogs, setCogs] = useState<COGSReport | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      setLoading(true)
      const query = period ? `?period=${period}` : ''
      const result = await apiFetch<COGSReport>(`/inventory/cogs${query}`)
      if (mounted) {
        setCogs(result.data)
        setError(result.error)
        setLoading(false)
      }
    }
    
    fetchData()
    
    return () => { mounted = false }
  }, [period])

  const refetch = useCallback(async () => {
    setLoading(true)
    const query = period ? `?period=${period}` : ''
    const result = await apiFetch<COGSReport>(`/inventory/cogs${query}`)
    setCogs(result.data)
    setError(result.error)
    setLoading(false)
  }, [period])

  return { cogs, loading, error, refetch }
}

export function useValuation(method: 'cost' | 'retail' | 'lower_of_cost_or_market' = 'cost') {
  const [valuation, setValuation] = useState<InventoryValuation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      setLoading(true)
      const result = await apiFetch<InventoryValuation>(`/inventory/valuation?method=${method}`)
      if (mounted) {
        setValuation(result.data)
        setError(result.error)
        setLoading(false)
      }
    }
    
    fetchData()
    
    return () => { mounted = false }
  }, [method])

  const refetch = useCallback(async () => {
    setLoading(true)
    const result = await apiFetch<InventoryValuation>(`/inventory/valuation?method=${method}`)
    setValuation(result.data)
    setError(result.error)
    setLoading(false)
  }, [method])

  return { valuation, loading, error, refetch }
}

export function useJournalEntries(limit: number = 50) {
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const fetchData = async () => {
      setLoading(true)
      const result = await apiFetch<{ entries: JournalEntry[] }>(`/inventory/journal-entries?limit=${limit}`)
      if (mounted) {
        setEntries(result.data?.entries || [])
        setError(result.error)
        setLoading(false)
      }
    }
    
    fetchData()
    
    return () => { mounted = false }
  }, [limit])

  const refetch = useCallback(async () => {
    setLoading(true)
    const result = await apiFetch<{ entries: JournalEntry[] }>(`/inventory/journal-entries?limit=${limit}`)
    setEntries(result.data?.entries || [])
    setError(result.error)
    setLoading(false)
  }, [limit])

  return { entries, loading, error, refetch }
}

// ============ GRN HOOKS ============

export function useGRN() {
  const createGRN = useCallback(async (grn: {
    supplierId: string
    items: { productId: string; quantity: number; cost: number; batchNo?: string; expiry?: string }[]
    notes?: string
  }) => {
    return apiFetch<{ grnId: string; grnNumber: string }>('/grosupply/grn', {
      method: 'POST',
      body: JSON.stringify(grn),
    })
  }, [])

  return { createGRN }
}

// ============ STOCKTAKE HOOKS ============

export function useStocktake() {
  const createSession = useCallback(async (type: 'full' | 'category' | 'low_stock' | 'blind', category?: string) => {
    return apiFetch<{ sessionId: string; itemCount: number }>('/inventory/stocktake', {
      method: 'POST',
      body: JSON.stringify({ action: 'create', type, category }),
    })
  }, [])

  const updateCount = useCallback(async (sessionId: string, productId: string, countedQty: number, notes?: string) => {
    return apiFetch(`/inventory/stocktake/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify({ action: 'count', productId, countedQty, notes }),
    })
  }, [])

  const completeSession = useCallback(async (sessionId: string) => {
    return apiFetch<{ sessionId: string; variances: number }>(`/inventory/stocktake/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify({ action: 'complete' }),
    })
  }, [])

  const approveSession = useCallback(async (sessionId: string) => {
    return apiFetch<{ sessionId: string; variancesApplied: number }>(`/inventory/stocktake/${sessionId}`, {
      method: 'PUT',
      body: JSON.stringify({ action: 'approve' }),
    })
  }, [])

  return { createSession, updateCount, completeSession, approveSession }
}

// ============ EXPORT HOOK ============

export function useExport() {
  const exportToCSV = useCallback(async (type: 'products' | 'movements' | 'transfers' | 'valuation') => {
    const result = await apiFetch<Blob>(`/inventory/export?type=${type}`)
    if (result.data) {
      const url = URL.createObjectURL(result.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
    return result
  }, [])

  return { exportToCSV }
}
