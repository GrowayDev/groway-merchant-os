'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { apiGet } from '@/components/wallet/lib/api'
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Search,
  Filter,
  Smartphone,
  Zap,
  Droplets,
  Tv,
  ShoppingBag,
  Gift,
  Ticket,
  ChevronRight,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface TransactionHistoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Transaction {
  id: string
  type: 'airtime' | 'electricity' | 'water' | 'dstv' | 'voucher' | 'laybye' | 'bnpl' | 'send' | 'receive'
  description: string
  amount: number
  direction: 'credit' | 'debit'
  timestamp: Date
  status: 'completed' | 'pending' | 'failed'
  token?: string
  reference: string
  provider?: string
  details?: Record<string, string>
}

// Mock transaction history data
const mockTransactions: Transaction[] = [
  {
    id: 'TXN1',
    type: 'electricity',
    description: 'City Power - Prepaid',
    amount: 350,
    direction: 'debit',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    status: 'completed',
    token: '1234 5678 9012 3456 7890',
    reference: 'BILABC123',
    provider: 'City Power',
    details: { meterNumber: '01234567890', units: '85.5 kWh' }
  },
  {
    id: 'TXN2',
    type: 'airtime',
    description: 'Vodacom Airtime',
    amount: 55,
    direction: 'debit',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    status: 'completed',
    token: 'VOD-ABCD-EFGH-IJKL',
    reference: 'AIRDEF456',
    provider: 'Vodacom',
    details: { phoneNumber: '082 123 4567' }
  },
  {
    id: 'TXN3',
    type: 'receive',
    description: 'Received from Sipho',
    amount: 500,
    direction: 'credit',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    status: 'completed',
    reference: 'RCVGHI789',
    details: { sender: 'Sipho Nkosi', senderId: 'GW-SIPHO-1234' }
  },
  {
    id: 'TXN4',
    type: 'water',
    description: 'Johannesburg Water',
    amount: 125.50,
    direction: 'debit',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    status: 'completed',
    token: 'WTR-9876-5432-1098',
    reference: 'BILJKL012',
    provider: 'Johannesburg Water',
    details: { accountNumber: 'ACC123456' }
  },
  {
    id: 'TXN5',
    type: 'voucher',
    description: 'Netflix Gift Card',
    amount: 199,
    direction: 'debit',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    status: 'completed',
    token: 'NET-XXXX-XXXX-XXXX',
    reference: 'VOUMNO345',
    provider: 'Netflix',
    details: { voucherCode: 'NET-XXXX-XXXX-XXXX' }
  },
  {
    id: 'TXN6',
    type: 'dstv',
    description: 'DStv Premium',
    amount: 879,
    direction: 'debit',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    status: 'completed',
    reference: 'BILPQR678',
    provider: 'MultiChoice',
    details: { smartCardNumber: '12345678901' }
  },
  {
    id: 'TXN7',
    type: 'send',
    description: 'Sent to Maria',
    amount: 1000,
    direction: 'debit',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
    status: 'completed',
    reference: 'SNDSTU901',
    details: { recipient: 'Maria Santos', recipientId: 'GW-MARIA-5678' }
  },
  {
    id: 'TXN8',
    type: 'bnpl',
    description: 'Samsung TV - BNPL',
    amount: 2250,
    direction: 'debit',
    timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    status: 'completed',
    reference: 'BNPLVWX234',
    provider: 'Groway BNPL',
    details: { item: 'Samsung 32" Smart TV', installment: '1 of 2' }
  },
  {
    id: 'TXN9',
    type: 'laybye',
    description: 'Nike Air Max - Laybye',
    amount: 225,
    direction: 'debit',
    timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
    status: 'completed',
    reference: 'LYBYZA567',
    provider: 'Sports Store',
    details: { item: 'Nike Air Max Sneakers', weeklyPayment: 'R225' }
  },
  {
    id: 'TXN10',
    type: 'airtime',
    description: 'MTN Data Bundle',
    amount: 99,
    direction: 'debit',
    timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
    status: 'failed',
    token: 'MTN-FAILED',
    reference: 'AIRBCD890',
    provider: 'MTN',
    details: { phoneNumber: '083 987 6543', reason: 'Insufficient funds' }
  }
]

const transactionIcons: Record<string, typeof Smartphone> = {
  airtime: Smartphone,
  electricity: Zap,
  water: Droplets,
  dstv: Tv,
  voucher: Gift,
  laybye: ShoppingBag,
  bnpl: ShoppingBag,
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  ticket: Ticket
}

const transactionColors: Record<string, string> = {
  airtime: '#E60000',
  electricity: '#FFC107',
  water: '#2196F3',
  dstv: '#00897B',
  voucher: '#E91E63',
  laybye: '#FF5722',
  bnpl: '#9C27B0',
  send: '#F44336',
  receive: '#4CAF50',
  ticket: '#FF9800'
}

export function TransactionHistoryModal({ open, onOpenChange }: TransactionHistoryModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch real transaction history from the consumer wallet transactions API
  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function loadTransactions() {
      setLoading(true)
      setError(null)
      try {
        const res = await apiGet<{ success?: boolean; data?: { transactions?: any[] } | any[] }>('/wallet/transactions')
        if (cancelled) return
        const raw = res?.data
        const list: any[] = Array.isArray(raw)
          ? raw
          : raw && Array.isArray((raw as any).transactions)
          ? (raw as any).transactions
          : []
        const mapped: Transaction[] = list.map((tx) => {
          const direction = tx.direction === 'credit' ? 'credit' : 'debit'
          const typeRaw = String(tx.type || tx.transactionType || 'send')
          const type = (['airtime','electricity','water','dstv','voucher','laybye','bnpl','send','receive'].includes(typeRaw) ? typeRaw : 'send') as Transaction['type']
          const amountCents = Number(tx.amount ?? tx.amountCents ?? 0)
          return {
            id: String(tx.id || tx.reference || `TXN${Date.now()}`),
            type,
            description: String(tx.description || tx.counterparty?.name || 'Transaction'),
            amount: amountCents / 100,
            direction,
            timestamp: new Date(tx.createdAt || tx.completedAt || Date.now()),
            status: (tx.status === 'pending' ? 'pending' : tx.status === 'failed' ? 'failed' : 'completed') as Transaction['status'],
            token: tx.token ? String(tx.token) : undefined,
            reference: String(tx.reference || tx.id || ''),
            provider: tx.counterparty?.name || tx.provider ? String(tx.counterparty?.name ?? tx.provider) : undefined,
            details: tx.details || (tx.counterparty ? { counterparty: tx.counterparty.name, phone: tx.counterparty.phone } : undefined),
          }
        })
        setTransactions(mapped)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load transactions')
        setTransactions([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadTransactions()
    return () => {
      cancelled = true
    }
  }, [open])

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'airtime', label: 'Airtime' },
    { id: 'electricity', label: 'Electricity' },
    { id: 'water', label: 'Water' },
    { id: 'voucher', label: 'Vouchers' },
    { id: 'send', label: 'Transfers' },
  ]

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.reference.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = selectedFilter === 'all' || tx.type === selectedFilter
    return matchesSearch && matchesFilter
  })

  const formatTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-ZA')
  }

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    setCopiedToken(token)
    setTimeout(() => setCopiedToken(null), 2000)
  }

  const handleClose = () => {
    setSelectedTransaction(null)
    setSearchQuery('')
    setSelectedFilter('all')
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">
            {selectedTransaction ? 'Transaction Details' : 'Transaction History'}
          </h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!selectedTransaction ? (
            <div className="p-4 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
                {filters.map((filter) => (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFilter(filter.id)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      selectedFilter === filter.id
                        ? 'bg-[#00897B] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Transaction List */}
              <div className="space-y-2">
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 text-[#00897B] animate-spin" />
                  </div>
                )}
                {!loading && error && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                    <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}
                {!loading && !error && filteredTransactions.length === 0 && (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-[#757575]">No transactions found</p>
                  </div>
                )}
                {!loading && !error && filteredTransactions.map((tx) => {
                    const Icon = transactionIcons[tx.type] || Smartphone
                    return (
                      <button
                        key={tx.id}
                        onClick={() => setSelectedTransaction(tx)}
                        className="w-full p-3 bg-white rounded-xl border border-gray-100 text-left hover:border-[#00897B] transition-all active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${transactionColors[tx.type]}20` }}
                          >
                            <Icon className="h-5 w-5" style={{ color: transactionColors[tx.type] }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-[#1A1A1A] truncate">{tx.description}</p>
                              <span className={`text-sm font-bold ${tx.direction === 'credit' ? 'text-green-600' : 'text-[#1A1A1A]'}`}>
                                {tx.direction === 'credit' ? '+' : '-'}R {Math.abs(tx.amount).toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between mt-0.5">
                              <p className="text-xs text-[#757575]">{formatTime(tx.timestamp)}</p>
                              <Badge
                                className={`text-[10px] border-0 ${
                                  tx.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : tx.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {tx.status}
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </button>
                    )
                  })
                }
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Back Button */}
              <button
                onClick={() => setSelectedTransaction(null)}
                className="text-sm text-[#00897B]"
              >
                ← Back to transactions
              </button>

              {/* Transaction Header */}
              <div className="text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `${transactionColors[selectedTransaction.type]}20` }}
                >
                  {selectedTransaction.direction === 'credit' ? (
                    <ArrowDownLeft className="h-8 w-8 text-green-600" />
                  ) : (
                    <ArrowUpRight className="h-8 w-8" style={{ color: transactionColors[selectedTransaction.type] }} />
                  )}
                </div>
                <p className="text-3xl font-bold text-[#1A1A1A]">
                  {selectedTransaction.direction === 'credit' ? '+' : '-'}R {Math.abs(selectedTransaction.amount).toFixed(2)}
                </p>
                <p className="text-sm text-[#757575] mt-1">{selectedTransaction.description}</p>
              </div>

              {/* Status */}
              <div className="flex justify-center">
                <Badge
                  className={`text-sm border-0 ${
                    selectedTransaction.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : selectedTransaction.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {selectedTransaction.status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                  {selectedTransaction.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                  {selectedTransaction.status === 'failed' && <XCircle className="h-3 w-3 mr-1" />}
                  {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                </Badge>
              </div>

              {/* Transaction Details */}
              <Card className="bg-gray-50">
                <CardContent className="p-4 space-y-3">
                  <div className="text-center pb-3 border-b border-gray-200">
                    <p className="text-xs text-[#757575] mb-1">Transaction ID</p>
                    <p className="text-sm font-mono font-bold text-[#1A1A1A]">{selectedTransaction.id}</p>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-[#757575]">Type</span>
                    <Badge className="bg-[#00897B]/10 text-[#00897B] border-0 capitalize">
                      {selectedTransaction.type}
                    </Badge>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-[#757575]">Date</span>
                    <span className="text-sm text-[#1A1A1A]">
                      {selectedTransaction.timestamp.toLocaleDateString('en-ZA')} {selectedTransaction.timestamp.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-sm text-[#757575]">Reference</span>
                    <span className="text-sm font-mono text-[#1A1A1A]">{selectedTransaction.reference}</span>
                  </div>

                  {selectedTransaction.provider && (
                    <div className="flex justify-between">
                      <span className="text-sm text-[#757575]">Provider</span>
                      <span className="text-sm font-medium text-[#1A1A1A]">{selectedTransaction.provider}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Additional Details */}
              {selectedTransaction.details && (
                <Card className="bg-gray-50">
                  <CardContent className="p-4 space-y-2">
                    {Object.entries(selectedTransaction.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm text-[#757575] capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-sm font-medium text-[#1A1A1A]">{value}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Token Display */}
              {selectedTransaction.token && selectedTransaction.status === 'completed' && (
                <div className="bg-[#E0F2F1] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className="bg-[#00897B] text-white border-0 text-xs">TOKEN</Badge>
                    <span className="text-xs text-[#757575]">Keep for your records</span>
                  </div>
                  <p className="text-lg font-mono font-bold text-[#00897B] text-center tracking-wider mb-2">
                    {selectedTransaction.token}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleCopyToken(selectedTransaction.token!)}
                  >
                    {copiedToken === selectedTransaction.token ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Token
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Failed Transaction Reason */}
              {selectedTransaction.status === 'failed' && selectedTransaction.details?.reason && (
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-sm text-red-700">
                    <strong>Reason:</strong> {selectedTransaction.details.reason}
                  </p>
                </div>
              )}

              <Button
                onClick={() => setSelectedTransaction(null)}
                className="w-full bg-[#00897B] hover:bg-[#00695C]"
              >
                Back to History
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
