// Shared in-memory data store for accounting module
// This simulates a database for the demo

export interface Account {
  id: string
  code: string
  name: string
  type: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  subType: string
  balance: number
  currency: string
  isActive: boolean
  parentCode?: string
  description?: string
  taxDeductible?: boolean
  merchantId: string
  createdAt: string
  updatedAt: string
}

export interface JournalEntryLine {
  id: string
  accountId: string
  accountName: string
  accountCode: string
  debit: number
  credit: number
  description: string
}

export interface JournalEntry {
  id: string
  date: string
  reference: string
  description: string
  lines: JournalEntryLine[]
  totalDebit: number
  totalCredit: number
  status: 'draft' | 'posted' | 'reversed'
  createdBy: string
  createdAt: string
  updatedAt: string
  reversedFrom?: string
  merchantId: string
}

export interface InvoiceItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  discount: number
  total: number
  taxable: boolean
}

export interface Invoice {
  id: string
  invoiceNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  date: string
  dueDate: string
  items: InvoiceItem[]
  subtotal: number
  vat: number
  discount: number
  total: number
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled' | 'partial'
  paidDate?: string
  paidAmount?: number
  notes?: string
  terms?: string
  merchantId: string
  createdAt: string
  updatedAt: string
}

export interface BillItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
  accountId: string
}

export interface Bill {
  id: string
  billNumber: string
  supplierName: string
  supplierEmail?: string
  date: string
  dueDate: string
  items: BillItem[]
  subtotal: number
  vat: number
  total: number
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'overdue' | 'partial'
  category: string
  paymentTerms?: string
  notes?: string
  approvedBy?: string
  approvedAt?: string
  merchantId: string
  createdAt: string
  updatedAt: string
}

// Initialize with sample data
const generateInitialAccounts = (): Account[] => [
  // Assets - Current
  { id: 'ACC-001', code: '1000', name: 'Cash on Hand', type: 'asset', subType: 'Current Asset', balance: 45230, currency: 'ZAR', isActive: true, description: 'Physical cash held at business premises', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-002', code: '1010', name: 'FNB Business Cheque', type: 'asset', subType: 'Bank Account', balance: 156780, currency: 'ZAR', isActive: true, description: 'Primary operating account', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-003', code: '1020', name: 'Capitec Business Savings', type: 'asset', subType: 'Bank Account', balance: 89450, currency: 'ZAR', isActive: true, description: 'Reserve and savings account', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-004', code: '1030', name: 'Standard Bank Cheque', type: 'asset', subType: 'Bank Account', balance: 45000, currency: 'ZAR', isActive: true, description: 'Secondary operating account', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-005', code: '1100', name: 'Accounts Receivable', type: 'asset', subType: 'Current Asset', balance: 67890, currency: 'ZAR', isActive: true, description: 'Outstanding customer invoices', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-006', code: '1110', name: 'Trade Debtors', type: 'asset', subType: 'Current Asset', balance: 45000, currency: 'ZAR', isActive: true, parentCode: '1100', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-007', code: '1120', name: 'Staff Loans', type: 'asset', subType: 'Current Asset', balance: 12890, currency: 'ZAR', isActive: true, parentCode: '1100', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-008', code: '1200', name: 'Inventory', type: 'asset', subType: 'Current Asset', balance: 234560, currency: 'ZAR', isActive: true, description: 'Stock on hand', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-009', code: '1300', name: 'Prepaid Expenses', type: 'asset', subType: 'Current Asset', balance: 12000, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-010', code: '1400', name: 'VAT Input', type: 'asset', subType: 'Current Asset', balance: 28760, currency: 'ZAR', isActive: true, description: 'VAT recoverable from SARS', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Assets - Non-Current
  { id: 'ACC-011', code: '1500', name: 'Fixed Assets', type: 'asset', subType: 'Non-Current Asset', balance: 456780, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-012', code: '1510', name: 'Property & Buildings', type: 'asset', subType: 'Non-Current Asset', balance: 350000, currency: 'ZAR', isActive: true, parentCode: '1500', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-013', code: '1520', name: 'Vehicles', type: 'asset', subType: 'Non-Current Asset', balance: 85000, currency: 'ZAR', isActive: true, parentCode: '1500', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-014', code: '1530', name: 'Equipment', type: 'asset', subType: 'Non-Current Asset', balance: 21780, currency: 'ZAR', isActive: true, parentCode: '1500', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-015', code: '1600', name: 'Accumulated Depreciation', type: 'asset', subType: 'Contra Asset', balance: -45000, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Liabilities - Current
  { id: 'ACC-016', code: '2000', name: 'Accounts Payable', type: 'liability', subType: 'Current Liability', balance: -45670, currency: 'ZAR', isActive: true, description: 'Outstanding supplier bills', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-017', code: '2100', name: 'VAT Payable', type: 'liability', subType: 'Current Liability', balance: -23580, currency: 'ZAR', isActive: true, description: 'VAT owed to SARS', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-018', code: '2200', name: 'PAYE Payable', type: 'liability', subType: 'Current Liability', balance: -8900, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-019', code: '2210', name: 'UIF Payable', type: 'liability', subType: 'Current Liability', balance: -1780, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-020', code: '2220', name: 'SDL Payable', type: 'liability', subType: 'Current Liability', balance: -890, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-021', code: '2300', name: 'Accrued Expenses', type: 'liability', subType: 'Current Liability', balance: -15000, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-022', code: '2400', name: 'Deferred Revenue', type: 'liability', subType: 'Current Liability', balance: -8000, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Liabilities - Non-Current
  { id: 'ACC-023', code: '2500', name: 'GroCredit Facility', type: 'liability', subType: 'Non-Current Liability', balance: -75000, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-024', code: '2600', name: 'Vehicle Finance', type: 'liability', subType: 'Non-Current Liability', balance: -45000, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Equity
  { id: 'ACC-025', code: '3000', name: "Owner's Capital", type: 'equity', subType: 'Equity', balance: -250000, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-026', code: '3100', name: 'Retained Earnings', type: 'equity', subType: 'Equity', balance: -189780, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-027', code: '3200', name: "Owner's Drawings", type: 'equity', subType: 'Equity', balance: 25000, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Income
  { id: 'ACC-028', code: '4000', name: 'Sales Revenue', type: 'income', subType: 'Operating Income', balance: -567890, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-029', code: '4010', name: 'Product Sales', type: 'income', subType: 'Operating Income', balance: -420000, currency: 'ZAR', isActive: true, parentCode: '4000', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-030', code: '4020', name: 'Service Revenue', type: 'income', subType: 'Operating Income', balance: -123450, currency: 'ZAR', isActive: true, parentCode: '4000', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-031', code: '4030', name: 'Installation Revenue', type: 'income', subType: 'Operating Income', balance: -24440, currency: 'ZAR', isActive: true, parentCode: '4000', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-032', code: '4100', name: 'Other Income', type: 'income', subType: 'Other Income', balance: -8900, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-033', code: '4200', name: 'Discount Received', type: 'income', subType: 'Other Income', balance: -3500, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-034', code: '4300', name: 'Interest Income', type: 'income', subType: 'Other Income', balance: -1250, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Expenses - Cost of Sales
  { id: 'ACC-035', code: '5000', name: 'Cost of Goods Sold', type: 'expense', subType: 'Cost of Sales', balance: 234560, currency: 'ZAR', isActive: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-036', code: '5100', name: 'Direct Materials', type: 'expense', subType: 'Cost of Sales', balance: 180000, currency: 'ZAR', isActive: true, parentCode: '5000', taxDeductible: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-037', code: '5200', name: 'Direct Labour', type: 'expense', subType: 'Cost of Sales', balance: 54560, currency: 'ZAR', isActive: true, parentCode: '5000', taxDeductible: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  // Expenses - Operating
  { id: 'ACC-038', code: '6000', name: 'Salaries & Wages', type: 'expense', subType: 'Operating Expense', balance: 145670, currency: 'ZAR', isActive: true, taxDeductible: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-039', code: '6100', name: 'Rent Expense', type: 'expense', subType: 'Operating Expense', balance: 24000, currency: 'ZAR', isActive: true, taxDeductible: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-040', code: '6200', name: 'Utilities', type: 'expense', subType: 'Operating Expense', balance: 8900, currency: 'ZAR', isActive: true, taxDeductible: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-041', code: '6210', name: 'Electricity', type: 'expense', subType: 'Operating Expense', balance: 5500, currency: 'ZAR', isActive: true, parentCode: '6200', taxDeductible: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-042', code: '6220', name: 'Water', type: 'expense', subType: 'Operating Expense', balance: 1200, currency: 'ZAR', isActive: true, parentCode: '6200', taxDeductible: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-043', code: '6230', name: 'Internet & Phone', type: 'expense', subType: 'Operating Expense', balance: 2200, currency: 'ZAR', isActive: true, parentCode: '6200', taxDeductible: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-044', code: '6300', name: 'Marketing & Advertising', type: 'expense', subType: 'Operating Expense', balance: 15600, currency: 'ZAR', isActive: true, taxDeductible: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-045', code: '6400', name: 'Bank Charges', type: 'expense', subType: 'Operating Expense', balance: 3450, currency: 'ZAR', isActive: true, taxDeductible: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-046', code: '6500', name: 'Insurance', type: 'expense', subType: 'Operating Expense', balance: 4500, currency: 'ZAR', isActive: true, taxDeductible: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-047', code: '6600', name: 'Vehicle Expenses', type: 'expense', subType: 'Operating Expense', balance: 8900, currency: 'ZAR', isActive: true, taxDeductible: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-048', code: '6700', name: 'Depreciation', type: 'expense', subType: 'Operating Expense', balance: 12500, currency: 'ZAR', isActive: true, taxDeductible: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-049', code: '6800', name: 'Professional Fees', type: 'expense', subType: 'Operating Expense', balance: 7500, currency: 'ZAR', isActive: true, taxDeductible: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'ACC-050', code: '6900', name: 'Repairs & Maintenance', type: 'expense', subType: 'Operating Expense', balance: 3800, currency: 'ZAR', isActive: true, taxDeductible: true, merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const generateInitialInvoices = (): Invoice[] => [
  { id: 'INV-001', invoiceNumber: 'INV-2026-001', customerName: 'Sipho Dlamini', customerEmail: 'sipho.d@email.com', customerPhone: '+27 82 123 4567', date: '2026-02-10', dueDate: '2026-03-10', items: [{ id: 'ITEM-001', description: 'Consulting Services - February', quantity: 10, unitPrice: 500, discount: 0, total: 5000, taxable: true }], subtotal: 5000, vat: 750, discount: 0, total: 5750, status: 'paid', paidDate: '2026-02-15', paidAmount: 5750, notes: 'Thank you for your business!', terms: 'Payment due within 30 days', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'INV-002', invoiceNumber: 'INV-2026-002', customerName: 'Thandi Mbeki', customerEmail: 'thandi.m@email.com', customerPhone: '+27 83 234 5678', date: '2026-02-12', dueDate: '2026-03-12', items: [{ id: 'ITEM-002', description: 'Product Supply - Batch A', quantity: 50, unitPrice: 120, discount: 0, total: 6000, taxable: true }], subtotal: 6000, vat: 900, discount: 0, total: 6900, status: 'sent', notes: 'Bulk order discount applied', terms: 'Payment due within 30 days', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'INV-003', invoiceNumber: 'INV-2026-003', customerName: 'Johan van der Berg', customerEmail: 'johan.vdb@email.com', customerPhone: '+27 84 345 6789', date: '2026-02-01', dueDate: '2026-02-28', items: [{ id: 'ITEM-003', description: 'Monthly Service Contract', quantity: 1, unitPrice: 2500, discount: 0, total: 2500, taxable: true }], subtotal: 2500, vat: 375, discount: 0, total: 2875, status: 'overdue', notes: 'Retainer agreement', terms: 'Payment due within 30 days', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'INV-004', invoiceNumber: 'INV-2026-004', customerName: 'Precious Ndlovu', customerEmail: 'precious.n@email.com', customerPhone: '+27 85 456 7890', date: '2026-02-14', dueDate: '2026-03-14', items: [{ id: 'ITEM-004', description: 'Equipment Rental - 3 units', quantity: 3, unitPrice: 800, discount: 0, total: 2400, taxable: true }], subtotal: 2400, vat: 360, discount: 0, total: 2760, status: 'draft', notes: 'Rental for event', terms: 'Payment due within 30 days', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'INV-005', invoiceNumber: 'INV-2026-005', customerName: 'David Mokoena', customerEmail: 'david.m@email.com', customerPhone: '+27 86 567 8901', date: '2026-01-15', dueDate: '2026-02-15', items: [{ id: 'ITEM-005', description: 'Bulk Order - Widget A', quantity: 100, unitPrice: 45, discount: 5, total: 4275, taxable: true }], subtotal: 4500, vat: 675, discount: 225, total: 5175, status: 'paid', paidDate: '2026-02-10', paidAmount: 5175, notes: '5% early payment discount', terms: 'Payment due within 30 days', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'INV-006', invoiceNumber: 'INV-2026-006', customerName: 'Nomsa Khumalo', customerEmail: 'nomsa.k@email.com', customerPhone: '+27 87 678 9012', date: '2026-02-08', dueDate: '2026-03-08', items: [{ id: 'ITEM-006', description: 'Installation Services', quantity: 1, unitPrice: 3500, discount: 0, total: 3500, taxable: true }], subtotal: 3500, vat: 525, discount: 0, total: 4025, status: 'partial', paidAmount: 2000, notes: '50% deposit received', terms: 'Payment due within 30 days', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const generateInitialBills = (): Bill[] => [
  { id: 'BIL-001', billNumber: 'BIL-2026-001', supplierName: 'GroSupply SA', supplierEmail: 'accounts@grosupply.co.za', date: '2026-02-10', dueDate: '2026-03-10', items: [{ id: 'BILITEM-001', description: 'Stock Replenishment - Q1', quantity: 1, unitPrice: 15670, total: 15670, accountId: 'ACC-008' }], subtotal: 15670, vat: 2350.50, total: 18020.50, status: 'approved', category: 'Inventory', paymentTerms: 'Net 30', approvedBy: 'Sipho Ndaba', approvedAt: new Date().toISOString(), merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'BIL-002', billNumber: 'BIL-2026-002', supplierName: 'Eskom', date: '2026-02-01', dueDate: '2026-02-28', items: [{ id: 'BILITEM-002', description: 'Electricity - January 2026', quantity: 1, unitPrice: 4500, total: 4500, accountId: 'ACC-041' }], subtotal: 4500, vat: 0, total: 4500, status: 'paid', category: 'Utilities', paymentTerms: 'Due on receipt', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'BIL-003', billNumber: 'BIL-2026-003', supplierName: 'Vodacom Business', supplierEmail: 'billing@vodacom.co.za', date: '2026-02-05', dueDate: '2026-03-05', items: [{ id: 'BILITEM-003', description: 'Data & Voice Services - February', quantity: 1, unitPrice: 2800, total: 2800, accountId: 'ACC-043' }], subtotal: 2800, vat: 420, total: 3220, status: 'pending', category: 'Telecommunications', paymentTerms: 'Net 30', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'BIL-004', billNumber: 'BIL-2026-004', supplierName: 'ABSA Property Finance', date: '2026-02-01', dueDate: '2026-02-28', items: [{ id: 'BILITEM-004', description: 'Monthly Rental - February', quantity: 1, unitPrice: 24000, total: 24000, accountId: 'ACC-039' }], subtotal: 24000, vat: 3600, total: 27600, status: 'overdue', category: 'Rent', paymentTerms: 'Due on 1st', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'BIL-005', billNumber: 'BIL-2026-005', supplierName: 'Metro Police', date: '2026-02-15', dueDate: '2026-02-28', items: [{ id: 'BILITEM-005', description: 'Business License Renewal', quantity: 1, unitPrice: 1500, total: 1500, accountId: 'ACC-049' }], subtotal: 1500, vat: 0, total: 1500, status: 'draft', category: 'Licenses', paymentTerms: 'Immediate', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'BIL-006', billNumber: 'BIL-2026-006', supplierName: 'Sanlam Insurance', supplierEmail: 'premiums@sanlam.co.za', date: '2026-02-01', dueDate: '2026-02-15', items: [{ id: 'BILITEM-006', description: 'Business Insurance - Annual', quantity: 1, unitPrice: 4500, total: 4500, accountId: 'ACC-046' }], subtotal: 4500, vat: 0, total: 4500, status: 'paid', category: 'Insurance', paymentTerms: 'Annual renewal', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

const generateInitialJournalEntries = (): JournalEntry[] => [
  { id: 'JE-001', date: '2026-02-15', reference: 'REC-001', description: 'Daily sales deposit', lines: [{ id: 'JEL-001', accountId: 'ACC-002', accountName: 'FNB Business Cheque', accountCode: '1010', debit: 45670, credit: 0, description: 'POS settlement' }, { id: 'JEL-002', accountId: 'ACC-028', accountName: 'Sales Revenue', accountCode: '4000', debit: 0, credit: 45670, description: 'Daily sales' }], totalDebit: 45670, totalCredit: 45670, status: 'posted', createdBy: 'System', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'JE-002', date: '2026-02-15', reference: 'REC-002', description: 'Inventory purchase from GroSupply', lines: [{ id: 'JEL-003', accountId: 'ACC-008', accountName: 'Inventory', accountCode: '1200', debit: 15670, credit: 0, description: 'Stock purchase' }, { id: 'JEL-004', accountId: 'ACC-016', accountName: 'Accounts Payable', accountCode: '2000', debit: 0, credit: 15670, description: 'Amount owed to GroSupply' }], totalDebit: 15670, totalCredit: 15670, status: 'posted', createdBy: 'Thandi Zwane', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'JE-003', date: '2026-02-14', reference: 'REC-003', description: 'Salary payment - February', lines: [{ id: 'JEL-005', accountId: 'ACC-038', accountName: 'Salaries & Wages', accountCode: '6000', debit: 145670, credit: 0, description: 'Monthly salaries' }, { id: 'JEL-006', accountId: 'ACC-002', accountName: 'FNB Business Cheque', accountCode: '1010', debit: 0, credit: 145670, description: 'Bank transfer' }], totalDebit: 145670, totalCredit: 145670, status: 'posted', createdBy: 'Sipho Ndaba', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'JE-004', date: '2026-02-14', reference: 'REC-004', description: 'Rent payment', lines: [{ id: 'JEL-007', accountId: 'ACC-039', accountName: 'Rent Expense', accountCode: '6100', debit: 24000, credit: 0, description: 'February rent' }, { id: 'JEL-008', accountId: 'ACC-002', accountName: 'FNB Business Cheque', accountCode: '1010', debit: 0, credit: 24000, description: 'Debit order' }], totalDebit: 24000, totalCredit: 24000, status: 'posted', createdBy: 'Sipho Ndaba', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'JE-005', date: '2026-02-16', reference: 'REC-005', description: 'Adjustment - Bank charges', lines: [{ id: 'JEL-009', accountId: 'ACC-045', accountName: 'Bank Charges', accountCode: '6400', debit: 450, credit: 0, description: 'Monthly fees' }, { id: 'JEL-010', accountId: 'ACC-002', accountName: 'FNB Business Cheque', accountCode: '1010', debit: 0, credit: 450, description: 'Bank deduction' }], totalDebit: 450, totalCredit: 450, status: 'draft', createdBy: 'System', merchantId: 'merchant-001', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
]

// In-memory data store
class AccountingDataStore {
  private accounts: Account[] = generateInitialAccounts()
  private invoices: Invoice[] = generateInitialInvoices()
  private bills: Bill[] = generateInitialBills()
  private journalEntries: JournalEntry[] = generateInitialJournalEntries()
  private invoiceCounter = 7
  private billCounter = 7
  private journalCounter = 6
  private accountCounter = 51

  // Accounts
  getAccounts(merchantId: string) {
    return this.accounts.filter(a => a.merchantId === merchantId)
  }

  getAccount(id: string, merchantId: string) {
    return this.accounts.find(a => a.id === id && a.merchantId === merchantId)
  }

  createAccount(data: Partial<Account>, merchantId: string): Account {
    const account: Account = {
      id: `ACC-${Date.now()}`,
      code: data.code || '',
      name: data.name || '',
      type: data.type || 'asset',
      subType: data.subType || 'Current Asset',
      balance: data.balance || 0,
      currency: data.currency || 'ZAR',
      isActive: data.isActive ?? true,
      parentCode: data.parentCode,
      description: data.description,
      taxDeductible: data.taxDeductible,
      merchantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.accounts.push(account)
    this.accounts.sort((a, b) => a.code.localeCompare(b.code))
    return account
  }

  updateAccount(id: string, data: Partial<Account>, merchantId: string): Account | null {
    const index = this.accounts.findIndex(a => a.id === id && a.merchantId === merchantId)
    if (index === -1) return null
    this.accounts[index] = { ...this.accounts[index], ...data, updatedAt: new Date().toISOString() }
    return this.accounts[index]
  }

  deleteAccount(id: string, merchantId: string): boolean {
    const index = this.accounts.findIndex(a => a.id === id && a.merchantId === merchantId)
    if (index === -1) return false
    this.accounts.splice(index, 1)
    return true
  }

  // Invoices
  getInvoices(merchantId: string) {
    return this.invoices.filter(i => i.merchantId === merchantId)
  }

  getInvoice(id: string, merchantId: string) {
    return this.invoices.find(i => i.id === id && i.merchantId === merchantId)
  }

  createInvoice(data: Partial<Invoice>, merchantId: string): Invoice {
    const invoiceNumber = `INV-2026-${String(this.invoiceCounter++).padStart(3, '0')}`
    const invoice: Invoice = {
      id: `INV-${Date.now()}`,
      invoiceNumber,
      customerName: data.customerName || '',
      customerEmail: data.customerEmail || '',
      customerPhone: data.customerPhone,
      date: data.date || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: data.items || [],
      subtotal: data.subtotal || 0,
      vat: data.vat || 0,
      discount: data.discount || 0,
      total: data.total || 0,
      status: data.status || 'draft',
      notes: data.notes,
      terms: data.terms || 'Payment due within 30 days',
      merchantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.invoices.unshift(invoice)
    return invoice
  }

  updateInvoice(id: string, data: Partial<Invoice>, merchantId: string): Invoice | null {
    const index = this.invoices.findIndex(i => i.id === id && i.merchantId === merchantId)
    if (index === -1) return null
    this.invoices[index] = { ...this.invoices[index], ...data, updatedAt: new Date().toISOString() }
    return this.invoices[index]
  }

  deleteInvoice(id: string, merchantId: string): boolean {
    const index = this.invoices.findIndex(i => i.id === id && i.merchantId === merchantId)
    if (index === -1) return false
    this.invoices.splice(index, 1)
    return true
  }

  // Bills
  getBills(merchantId: string) {
    return this.bills.filter(b => b.merchantId === merchantId)
  }

  getBill(id: string, merchantId: string) {
    return this.bills.find(b => b.id === id && b.merchantId === merchantId)
  }

  createBill(data: Partial<Bill>, merchantId: string): Bill {
    const billNumber = `BIL-2026-${String(this.billCounter++).padStart(3, '0')}`
    const bill: Bill = {
      id: `BIL-${Date.now()}`,
      billNumber,
      supplierName: data.supplierName || '',
      supplierEmail: data.supplierEmail,
      date: data.date || new Date().toISOString().split('T')[0],
      dueDate: data.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: data.items || [],
      subtotal: data.subtotal || 0,
      vat: data.vat || 0,
      total: data.total || 0,
      status: data.status || 'draft',
      category: data.category || 'General',
      paymentTerms: data.paymentTerms,
      notes: data.notes,
      merchantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.bills.unshift(bill)
    return bill
  }

  updateBill(id: string, data: Partial<Bill>, merchantId: string): Bill | null {
    const index = this.bills.findIndex(b => b.id === id && b.merchantId === merchantId)
    if (index === -1) return null
    this.bills[index] = { ...this.bills[index], ...data, updatedAt: new Date().toISOString() }
    return this.bills[index]
  }

  deleteBill(id: string, merchantId: string): boolean {
    const index = this.bills.findIndex(b => b.id === id && b.merchantId === merchantId)
    if (index === -1) return false
    this.bills.splice(index, 1)
    return true
  }

  // Journal Entries
  getJournalEntries(merchantId: string) {
    return this.journalEntries.filter(j => j.merchantId === merchantId)
  }

  getJournalEntry(id: string, merchantId: string) {
    return this.journalEntries.find(j => j.id === id && j.merchantId === merchantId)
  }

  createJournalEntry(data: Partial<JournalEntry>, merchantId: string): JournalEntry {
    const reference = `JE-${Date.now().toString(36).toUpperCase()}`
    const entry: JournalEntry = {
      id: `JE-${Date.now()}`,
      date: data.date || new Date().toISOString().split('T')[0],
      reference,
      description: data.description || '',
      lines: data.lines || [],
      totalDebit: data.totalDebit || 0,
      totalCredit: data.totalCredit || 0,
      status: data.status || 'draft',
      createdBy: data.createdBy || 'System',
      merchantId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    this.journalEntries.unshift(entry)
    return entry
  }

  updateJournalEntry(id: string, data: Partial<JournalEntry>, merchantId: string): JournalEntry | null {
    const index = this.journalEntries.findIndex(j => j.id === id && j.merchantId === merchantId)
    if (index === -1) return null
    this.journalEntries[index] = { ...this.journalEntries[index], ...data, updatedAt: new Date().toISOString() }
    return this.journalEntries[index]
  }

  deleteJournalEntry(id: string, merchantId: string): boolean {
    const index = this.journalEntries.findIndex(j => j.id === id && j.merchantId === merchantId)
    if (index === -1) return false
    this.journalEntries.splice(index, 1)
    return true
  }

  // Reports
  getTrialBalance(merchantId: string) {
    const accounts = this.getAccounts(merchantId)
    return accounts.filter(a => a.balance !== 0).map(a => ({
      id: a.id,
      code: a.code,
      name: a.name,
      type: a.type,
      debit: a.balance > 0 ? a.balance : 0,
      credit: a.balance < 0 ? Math.abs(a.balance) : 0
    }))
  }

  getBalanceSheet(merchantId: string) {
    const accounts = this.getAccounts(merchantId)
    return {
      assets: accounts.filter(a => a.type === 'asset'),
      liabilities: accounts.filter(a => a.type === 'liability'),
      equity: accounts.filter(a => a.type === 'equity'),
      totalAssets: accounts.filter(a => a.type === 'asset').reduce((s, a) => s + a.balance, 0),
      totalLiabilities: Math.abs(accounts.filter(a => a.type === 'liability').reduce((s, a) => s + a.balance, 0)),
      totalEquity: Math.abs(accounts.filter(a => a.type === 'equity').reduce((s, a) => s + a.balance, 0))
    }
  }

  getIncomeStatement(merchantId: string) {
    const accounts = this.getAccounts(merchantId)
    const income = accounts.filter(a => a.type === 'income')
    const expenses = accounts.filter(a => a.type === 'expense')
    const totalIncome = Math.abs(income.reduce((s, a) => s + a.balance, 0))
    const totalExpenses = expenses.reduce((s, a) => s + a.balance, 0)
    return {
      income,
      expenses,
      totalIncome,
      totalExpenses,
      netProfit: totalIncome - totalExpenses
    }
  }
}

// Singleton instance
export const accountingStore = new AccountingDataStore()
