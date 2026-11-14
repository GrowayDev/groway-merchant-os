'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, CheckCircle2, Upload, Download, FileSpreadsheet, Zap } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  merchantId: string
  branchId?: string
  onImported?: () => void
}

export function BulkImportModal({ open, onOpenChange, merchantId, branchId, onImported }: Props) {
  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [jsonData, setJsonData] = useState<any[]>([])
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState('')
  const [csvText, setCsvText] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const downloadTemplate = async () => {
    const res = await fetch(`/merchant-os/api/products/bulk-import?format=csv`)
    const csv = await res.text()
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'groway-product-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleFile = (file: File) => {
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setCsvText(text)
      try {
        // Parse CSV
        const lines = text.split('\n').filter(l => l.trim())
        if (lines.length < 2) {
          setError('CSV must have a header row and at least one product row')
          return
        }
        const headers = lines[0].split(',').map(h => h.trim())
        const products: any[] = []
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim())
          const product: any = {}
          headers.forEach((header, idx) => {
            if (values[idx]) product[header] = values[idx]
          })
          if (product.sku || product.barcode) {
            products.push(product)
          }
        }
        if (products.length === 0) {
          setError('No valid products found. Each row needs at least a SKU or barcode.')
          return
        }
        setJsonData(products)
        setStep('preview')
      } catch {
        setError('Failed to parse CSV file')
      }
    }
    reader.readAsText(file)
  }

  const handleManualCsv = () => {
    setError('')
    if (!csvText.trim()) {
      setError('Please paste CSV data or upload a file')
      return
    }
    try {
      const lines = csvText.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        setError('CSV must have a header row and at least one product row')
        return
      }
      const headers = lines[0].split(',').map(h => h.trim())
      const products: any[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim())
        const product: any = {}
        headers.forEach((header, idx) => {
          if (values[idx]) product[header] = values[idx]
        })
        if (product.sku || product.barcode) {
          products.push(product)
        }
      }
      if (products.length === 0) {
        setError('No valid products found. Each row needs at least a SKU or barcode.')
        return
      }
      setJsonData(products)
      setStep('preview')
    } catch {
      setError('Failed to parse CSV data')
    }
  }

  const doImport = async () => {
    try {
      const res = await fetch('/merchant-os/api/products/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, branchId, products: jsonData }),
      })
      const data = await res.json()
      setResult(data)
      setStep('result')
      if (onImported) onImported()
    } catch (e: any) {
      setError(e.message)
    }
  }

  const reset = () => {
    setStep('upload')
    setJsonData([])
    setResult(null)
    setError('')
    setCsvText('')
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o) }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" /> Bulk Import Products (GS1/EAN Compliant)
          </DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            {/* Explainer */}
            <Card className="bg-[#00897B]/5 border-[#00897B]/20">
              <CardContent className="py-3">
                <p className="text-sm text-slate-600">
                  Upload your product price list as a CSV file. Each product needs at least a SKU or 
                  EAN-13 barcode (600-601 prefix for South Africa). Categories are auto-created if they don't exist.
                </p>
              </CardContent>
            </Card>

            {/* Download template */}
            <Button variant="outline" className="w-full" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" /> Download CSV Template
            </Button>

            {/* File upload */}
            <div>
              <Label>Upload CSV File</Label>
              <div 
                className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#00897B] transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <FileSpreadsheet className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Click to select a CSV file</p>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            </div>

            {/* OR paste CSV */}
            <div>
              <Label>Or paste CSV data directly</Label>
              <textarea
                className="mt-1 w-full rounded-md border border-gray-200 p-3 text-sm font-mono h-32"
                placeholder="sku,barcode,name,category,costPrice,sellingPrice,stock&#10;SKU-001,6001234567890,Maize Meal 5kg,Staples,45.00,65.00,100"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              />
              <Button variant="outline" size="sm" className="mt-2" onClick={handleManualCsv}>
                Parse CSV Data
              </Button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" /> {error}
              </div>
            )}

            {/* Supported fields */}
            <Card>
              <CardContent className="py-3">
                <p className="text-xs font-semibold mb-2">Supported Fields (CSV header):</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
                  <span><Badge variant="outline" className="text-[9px] mr-1">Required</Badge>sku</span>
                  <span>barcode (EAN-13)</span>
                  <span><Badge variant="outline" className="text-[9px] mr-1">Required</Badge>name</span>
                  <span>description</span>
                  <span>category</span>
                  <span>unit (each/kg/L/pack)</span>
                  <span>costPrice</span>
                  <span><Badge variant="outline" className="text-[9px] mr-1">Required</Badge>sellingPrice</span>
                  <span>compareAtPrice</span>
                  <span>vatRate (15.0 default)</span>
                  <span>stock</span>
                  <span>lowStockThreshold</span>
                  <span>reorderPoint</span>
                  <span>reorderQuantity</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Preview: {jsonData.length} products to import</p>
              <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>Back</Button>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-left">
                    <th className="p-2">SKU</th>
                    <th className="p-2">Barcode</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Cost</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {jsonData.slice(0, 50).map((p, i) => (
                    <tr key={i} className="border-t">
                      <td className="p-2 font-mono">{p.sku || '-'}</td>
                      <td className="p-2 font-mono">{p.barcode || '-'}</td>
                      <td className="p-2 truncate max-w-[200px]">{p.name || p.description || '-'}</td>
                      <td className="p-2">R{p.costPrice || '0'}</td>
                      <td className="p-2 font-medium">R{p.sellingPrice || '0'}</td>
                      <td className="p-2">{p.stock || '0'}</td>
                    </tr>
                  ))}
                  {jsonData.length > 50 && (
                    <tr><td colSpan={6} className="p-2 text-center text-gray-400">...and {jsonData.length - 50} more</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <Button className="w-full bg-[#00897B] hover:bg-[#00897B]/90" onClick={doImport}>
              <Upload className="h-4 w-4 mr-2" /> Import {jsonData.length} Products
            </Button>
          </div>
        )}

        {step === 'result' && result && (
          <div className="space-y-4">
            <Card className={result.imported > 0 ? 'border-green-300 bg-green-50' : 'border-amber-300 bg-amber-50'}>
              <CardContent className="py-6 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <p className="text-lg font-bold">{result.imported} products imported successfully!</p>
                {result.skipped > 0 && (
                  <p className="text-sm text-amber-600 mt-1">{result.skipped} products skipped (duplicates or errors)</p>
                )}
              </CardContent>
            </Card>

            {result.errors?.length > 0 && (
              <Card>
                <CardContent className="py-3">
                  <p className="text-xs font-semibold mb-2">Errors ({result.errors.length}):</p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.errors.slice(0, 20).map((err: string, i: number) => (
                      <p key={i} className="text-xs text-red-500">{err}</p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Button variant="outline" className="w-full" onClick={() => { reset(); onOpenChange(false) }}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
