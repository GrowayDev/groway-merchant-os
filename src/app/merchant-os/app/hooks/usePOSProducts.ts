'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAllSKUs as getStaticSKUs } from '../data/skuCatalog'

export interface POSProduct {
  id: string
  name: string
  price: number
  category: string
  sku?: string
  barcode?: string
  stock?: number
  inStock?: boolean
  icon?: any // For backward compatibility with static SKUs
}

export interface UsePOSProductsOptions {
  merchantId?: string
  verticalId: string
  subVerticalId: string
  useDatabase?: boolean // If true, try database first; fallback to static
}

export interface UsePOSProductsReturn {
  products: POSProduct[]
  categories: string[]
  loading: boolean
  error: string | null
  refetch: () => void
  isUsingFallback: boolean // True if using static catalog
}

/**
 * Hook to fetch products for POS
 * 
 * Strategy:
 * 1. Try to fetch from database API
 * 2. If no products found or error, fall back to static catalog
 * 3. Static catalog includes icons for backward compatibility
 */
export function usePOSProducts({
  merchantId,
  verticalId,
  subVerticalId,
  useDatabase = true
}: UsePOSProductsOptions): UsePOSProductsReturn {
  const [products, setProducts] = useState<POSProduct[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isUsingFallback, setIsUsingFallback] = useState(false)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError(null)
    setIsUsingFallback(false)

    // Try database first if enabled and we have a merchantId
    if (useDatabase && merchantId) {
      try {
        const response = await fetch(
          `/merchant-os/api/products/pos?merchantId=${merchantId}`
        )
        
        if (response.ok) {
          const result = await response.json()
          
          if (result.success && result.data.products.length > 0) {
            setProducts(result.data.products)
            setCategories(result.data.categories)
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.warn('Failed to fetch products from database, falling back to static catalog:', err)
      }
    }

    // Fallback to static catalog
    try {
      const staticProducts = getStaticSKUs(verticalId, subVerticalId)
      
      if (staticProducts.length > 0) {
        const formattedProducts: POSProduct[] = staticProducts.map((sku, index) => ({
          id: `static-${index}`,
          name: sku.name,
          price: sku.price,
          category: sku.category,
          icon: sku.icon,
          stock: 999, // Assume unlimited for static
          inStock: true
        }))
        
        const uniqueCategories = ['all', ...new Set(staticProducts.map(p => p.category))]
        
        setProducts(formattedProducts)
        setCategories(uniqueCategories)
        setIsUsingFallback(true)
      } else {
        setError('No products found for this business type')
      }
    } catch (err) {
      setError('Failed to load products')
      console.error('Error loading products:', err)
    } finally {
      setLoading(false)
    }
  }, [merchantId, verticalId, subVerticalId, useDatabase])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    categories,
    loading,
    error,
    refetch: fetchProducts,
    isUsingFallback
  }
}

/**
 * Simple hook for just getting products quickly
 */
export function useProducts(merchantId: string | undefined, verticalId: string, subVerticalId: string) {
  return usePOSProducts({
    merchantId,
    verticalId,
    subVerticalId,
    useDatabase: true
  })
}
