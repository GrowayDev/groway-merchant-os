'use client'

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  MapPin,
  Trash2,
  Eye,
  FileText,
  HelpCircle,
  Zap,
} from 'lucide-react'

// Types
interface ImportColumn {
  header: string
  index: number
  mappedTo: string | null
  sampleValues: string[]
}

interface ImportRow {
  index: number
  data: Record<string, string>
  status: 'pending' | 'valid' | 'invalid'
  errors: string[]
  product?: {
    name: string
    sku: string
    barcode: string
    category: string
    costPrice: number
    sellingPrice: number
    stock: number
    minStock: number
    unit: string
    location: string
    supplier: string
  }
}

interface BulkImportProps {
  open: boolean
  onClose: () => void
  onImport: (products: ImportRow['product'][]) => void
  categories: string[]
  existingSKUs: string[]
}

// Column mapping options
const fieldOptions = [
  { value: 'name', label: 'Product Name', required: true },
  { value: 'sku', label: 'SKU', required: true },
  { value: 'barcode', label: 'Barcode' },
  { value: 'category', label: 'Category', required: true },
  { value: 'costPrice', label: 'Cost Price', required: true },
  { value: 'sellingPrice', label: 'Selling Price', required: true },
  { value: 'stock', label: 'Current Stock' },
  { value: 'minStock', label: 'Min Stock Level' },
  { value: 'unit', label: 'Unit (each/kg/litre)' },
  { value: 'location', label: 'Location' },
  { value: 'supplier', label: 'Supplier' },
]

// Sample CSV template
const generateCSVTemplate = () => {
  const headers = ['name', 'sku', 'barcode', 'category', 'costPrice', 'sellingPrice', 'stock', 'minStock', 'unit', 'location', 'supplier']
  const sampleData = [
    ['Beef Patty Frozen', 'ING-BP-001', '6001234567890', 'Ingredients', '12.00', '22.50', '100', '30', 'each', 'Freezer A1', 'Crown National'],
    ['Burger Buns 6-pack', 'ING-BB-001', '6001234567891', 'Ingredients', '14.00', '24.00', '50', '20', 'pack', 'Dry Store B2', 'Albany Bakery'],
    ['Coca-Cola 500ml', 'BEV-CC-001', '5449000000285', 'Beverages', '9.50', '18.90', '200', '60', 'each', 'Cold Room D1', 'Coca-Cola Peninsula'],
  ]
  
  const csv = [
    headers.join(','),
    ...sampleData.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'inventory-import-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function BulkImportDialog({ open, onClose, onImport, categories, existingSKUs }: BulkImportProps) {
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [columns, setColumns] = useState<ImportColumn[]>([])
  const [rows, setRows] = useState<ImportRow[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [importStats, setImportStats] = useState({ success: 0, failed: 0, skipped: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Parse CSV file
  const parseCSV = (text: string): { columns: ImportColumn[]; rows: ImportRow[] } => {
    const lines = text.split('\n').filter(line => line.trim())
    if (lines.length < 2) {
      throw new Error('CSV file must have at least a header row and one data row')
    }

    // Parse header
    const headerLine = lines[0]
    const headers = parseCSVLine(headerLine)
    
    // Create columns with sample values
    const parsedColumns: ImportColumn[] = headers.map((header, index) => {
      const sampleValues = lines.slice(1, 4).map(line => {
        const values = parseCSVLine(line)
        return values[index] || ''
      })
      
      // Auto-map columns
      const lowerHeader = header.toLowerCase().replace(/[^a-z]/g, '')
      let mappedTo: string | null = null
      
      if (lowerHeader.includes('name') || lowerHeader.includes('product')) mappedTo = 'name'
      else if (lowerHeader === 'sku' || lowerHeader.includes('code')) mappedTo = 'sku'
      else if (lowerHeader.includes('barcode') || lowerHeader.includes('upc')) mappedTo = 'barcode'
      else if (lowerHeader.includes('category') || lowerHeader.includes('type')) mappedTo = 'category'
      else if (lowerHeader.includes('cost') || lowerHeader.includes('buy')) mappedTo = 'costPrice'
      else if (lowerHeader.includes('sell') || lowerHeader.includes('price') || lowerHeader.includes('retail')) mappedTo = 'sellingPrice'
      else if (lowerHeader.includes('stock') || lowerHeader.includes('qty') || lowerHeader.includes('quantity')) mappedTo = 'stock'
      else if (lowerHeader.includes('min') || lowerHeader.includes('reorder')) mappedTo = 'minStock'
      else if (lowerHeader.includes('unit')) mappedTo = 'unit'
      else if (lowerHeader.includes('location') || lowerHeader.includes('shelf')) mappedTo = 'location'
      else if (lowerHeader.includes('supplier') || lowerHeader.includes('vendor')) mappedTo = 'supplier'
      
      return {
        header: header.trim(),
        index,
        mappedTo,
        sampleValues
      }
    })

    // Parse rows
    const parsedRows: ImportRow[] = lines.slice(1).map((line, index) => {
      const values = parseCSVLine(line)
      const data: Record<string, string> = {}
      headers.forEach((header, i) => {
        data[header.trim()] = values[i] || ''
      })
      return {
        index: index + 2, // 1-based, accounting for header
        data,
        status: 'pending',
        errors: []
      }
    })

    return { columns: parsedColumns, rows: parsedRows }
  }

  // Parse CSV line handling quotes
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())
    return result
  }

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    
    try {
      const text = await uploadedFile.text()
      const { columns: parsedColumns, rows: parsedRows } = parseCSV(text)
      setColumns(parsedColumns)
      setRows(parsedRows)
      setStep('mapping')
    } catch (error) {
      alert('Error parsing CSV file: ' + (error as Error).message)
    }
  }

  // Update column mapping
  const handleMappingChange = (columnIndex: number, mappedTo: string | null) => {
    setColumns(prev => prev.map((col, i) => 
      i === columnIndex ? { ...col, mappedTo } : col
    ))
  }

  // Validate rows based on mapping
  const validateRows = () => {
    const requiredFields = fieldOptions.filter(f => f.required).map(f => f.value)
    
    // Check required fields are mapped
    const mappedFields = columns.filter(c => c.mappedTo).map(c => c.mappedTo)
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f))
    
    if (missingRequired.length > 0) {
      alert(`Please map the following required fields: ${missingRequired.join(', ')}`)
      return
    }

    // Validate each row
    const validatedRows = rows.map(row => {
      const errors: string[] = []
      const product: ImportRow['product'] = {
        name: '',
        sku: '',
        barcode: '',
        category: '',
        costPrice: 0,
        sellingPrice: 0,
        stock: 0,
        minStock: 5,
        unit: 'each',
        location: '',
        supplier: ''
      }

      // Map values from CSV
      columns.forEach(col => {
        if (!col.mappedTo) return
        const value = row.data[col.header] || ''
        
        switch (col.mappedTo) {
          case 'name':
            product.name = value
            if (!value.trim()) errors.push('Product name is required')
            break
          case 'sku':
            product.sku = value
            if (!value.trim()) errors.push('SKU is required')
            else if (existingSKUs.includes(value.trim())) errors.push(`SKU "${value}" already exists`)
            break
          case 'barcode':
            product.barcode = value
            break
          case 'category':
            product.category = value
            if (!value.trim()) errors.push('Category is required')
            break
          case 'costPrice':
            product.costPrice = parseFloat(value) || 0
            if (isNaN(parseFloat(value))) errors.push('Invalid cost price')
            break
          case 'sellingPrice':
            product.sellingPrice = parseFloat(value) || 0
            if (isNaN(parseFloat(value))) errors.push('Invalid selling price')
            else if (product.sellingPrice <= 0) errors.push('Selling price must be greater than 0')
            break
          case 'stock':
            product.stock = parseInt(value) || 0
            if (isNaN(parseInt(value))) errors.push('Invalid stock quantity')
            break
          case 'minStock':
            product.minStock = parseInt(value) || 5
            break
          case 'unit':
            product.unit = value || 'each'
            break
          case 'location':
            product.location = value
            break
          case 'supplier':
            product.supplier = value
            break
        }
      })

      return {
        ...row,
        status: errors.length === 0 ? 'valid' : 'invalid',
        errors,
        product
      }
    })

    setRows(validatedRows)
    setStep('preview')
  }

  // Execute import
  const executeImport = async () => {
    setStep('importing')
    const validProducts = rows.filter(r => r.status === 'valid').map(r => r.product!)
    
    let success = 0
    let failed = 0
    let skipped = rows.filter(r => r.status === 'invalid').length
    
    // Simulate import with progress
    for (let i = 0; i < validProducts.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50)) // Simulate processing
      setImportProgress(Math.round(((i + 1) / validProducts.length) * 100))
      success++
    }

    setImportStats({ success, failed, skipped })
    setStep('complete')
    
    // Call the import callback
    onImport(validProducts)
  }

  // Reset dialog
  const handleReset = () => {
    setStep('upload')
    setFile(null)
    setColumns([])
    setRows([])
    setImportProgress(0)
    setImportStats({ success: 0, failed: 0, skipped: 0 })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Close and reset
  const handleClose = () => {
    handleReset()
    onClose()
  }

  const validCount = rows.filter(r => r.status === 'valid').length
  const invalidCount = rows.filter(r => r.status === 'invalid').length

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-[#00897B]" />
            Bulk Import Inventory
          </DialogTitle>
          <DialogDescription>
            {step === 'upload' && 'Upload a CSV file with your inventory data'}
            {step === 'mapping' && 'Map your CSV columns to product fields'}
            {step === 'preview' && 'Review and validate your import data'}
            {step === 'importing' && 'Importing your inventory...'}
            {step === 'complete' && 'Import complete!'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {/* Step: Upload */}
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Download Template */}
              <div className="flex gap-3">
                <Button variant="outline" onClick={generateCSVTemplate}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              {/* Upload Area */}
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#00897B] hover:bg-[#E0F2F1]/20 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-sm font-medium text-[#1A1A1A] mb-1">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-[#757575]">
                  CSV file with product data (max 1000 rows)
                </p>
              </div>

              {/* Required Fields Info */}
              <Card className="bg-gray-50">
                <CardContent className="p-4">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-[#00897B]" />
                    Required Fields
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {fieldOptions.filter(f => f.required).map(field => (
                      <Badge key={field.value} variant="secondary" className="bg-white">
                        {field.label}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-[#757575] mt-2">
                    Additional fields: {fieldOptions.filter(f => !f.required).map(f => f.label).join(', ')}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step: Mapping */}
          {step === 'mapping' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#757575]">File: {file?.name}</span>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  Upload Different File
                </Button>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>CSV Column</TableHead>
                      <TableHead>Sample Values</TableHead>
                      <TableHead>Map To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {columns.map((col, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{col.header}</TableCell>
                        <TableCell className="text-xs text-[#757575]">
                          {col.sampleValues.slice(0, 3).join(', ')}
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={col.mappedTo || 'none'} 
                            onValueChange={(v) => handleMappingChange(index, v === 'none' ? null : v)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Select field..." />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">-- Skip --</SelectItem>
                              {fieldOptions.map(field => (
                                <SelectItem key={field.value} value={field.value}>
                                  {field.label}
                                  {field.required && <span className="text-red-500 ml-1">*</span>}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-[#757575]">{rows.length} rows detected</span>
              </div>
            </div>
          )}

          {/* Step: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-1 text-green-600" />
                  <p className="text-2xl font-bold text-green-600">{validCount}</p>
                  <p className="text-xs text-green-700">Ready to Import</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 text-center">
                  <XCircle className="h-6 w-6 mx-auto mb-1 text-red-600" />
                  <p className="text-2xl font-bold text-red-600">{invalidCount}</p>
                  <p className="text-xs text-red-700">Invalid Rows</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <FileText className="h-6 w-6 mx-auto mb-1 text-gray-600" />
                  <p className="text-2xl font-bold text-gray-600">{rows.length}</p>
                  <p className="text-xs text-gray-700">Total Rows</p>
                </div>
              </div>

              {/* Data Table */}
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-16">Status</TableHead>
                      <TableHead>Product Name</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Cost</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.index} className={row.status === 'invalid' ? 'bg-red-50' : ''}>
                        <TableCell>
                          {row.status === 'valid' ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <div className="relative group">
                              <XCircle className="h-4 w-4 text-red-600 cursor-help" />
                              <div className="absolute left-0 bottom-full mb-1 bg-red-100 text-red-700 text-xs p-2 rounded shadow-lg hidden group-hover:block z-10 whitespace-nowrap">
                                {row.errors.map((e, i) => (
                                  <div key={i}>• {e}</div>
                                ))}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{row.product?.name || row.data[columns.find(c => c.mappedTo === 'name')?.header || '']}</TableCell>
                        <TableCell>{row.product?.sku || '-'}</TableCell>
                        <TableCell>{row.product?.category || '-'}</TableCell>
                        <TableCell>R{(row.product?.costPrice || 0).toFixed(2)}</TableCell>
                        <TableCell>R{(row.product?.sellingPrice || 0).toFixed(2)}</TableCell>
                        <TableCell>{row.product?.stock || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>

              {invalidCount > 0 && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{invalidCount} rows have errors and will be skipped during import</span>
                </div>
              )}
            </div>
          )}

          {/* Step: Importing */}
          {step === 'importing' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-[#E0F2F1] flex items-center justify-center">
                <Zap className="h-8 w-8 text-[#00897B] animate-pulse" />
              </div>
              <div className="space-y-2">
                <p className="font-medium">Importing products...</p>
                <Progress value={importProgress} className="w-64 mx-auto" />
                <p className="text-sm text-[#757575]">{importProgress}% complete</p>
              </div>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-bold">Import Complete!</h3>
              <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-xl font-bold text-green-600">{importStats.success}</p>
                  <p className="text-xs text-green-700">Imported</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-xl font-bold text-red-600">{importStats.failed}</p>
                  <p className="text-xs text-red-700">Failed</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xl font-bold text-gray-600">{importStats.skipped}</p>
                  <p className="text-xs text-gray-700">Skipped</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'upload' && (
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
          )}
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={handleReset}>Back</Button>
              <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={validateRows}>
                Continue to Preview
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>Back</Button>
              <Button 
                className="bg-[#00897B] hover:bg-[#00695C]" 
                onClick={executeImport}
                disabled={validCount === 0}
              >
                Import {validCount} Products
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </>
          )}
          {step === 'complete' && (
            <Button className="bg-[#00897B] hover:bg-[#00695C]" onClick={handleClose}>
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
