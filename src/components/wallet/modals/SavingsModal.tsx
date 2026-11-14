'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { apiGet, apiPost, apiPut, formatMoney } from '@/components/wallet/lib/api'
import {
  PiggyBank,
  Plus,
  ArrowUpCircle,
  ArrowDownCircle,
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Target,
  Lock,
  Users,
  Bot,
  ChevronRight,
} from 'lucide-react'

interface SavingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SavingsType {
  value: string
  label: string
  icon: string
  desc: string
}

interface Pocket {
  id: string
  name: string
  type: string
  typeLabel: string
  typeIcon: string
  typeDesc: string
  icon: string
  color: string
  targetCents: string | null
  currentCents: string
  interestRate: number
  interestEarnedCents: string
  targetDate: string | null
  progress: number | null
  status: string
  createdAt: string
}

const POCKET_COLORS = [
  '#00897B', '#4CAF50', '#FF9800', '#9C27B0',
  '#E91E63', '#FF5722', '#795548', '#607D8B',
]

const POCKET_ICONS = ['🎯', '💰', '🔒', '👥', '🤖', '🏠', '✈️', '🎓', '🏖️', '🎁']

type Step = 'explainer' | 'list' | 'create' | 'transact' | 'success'

export function SavingsModal({ open, onOpenChange }: SavingsModalProps) {
  const [step, setStep] = useState<Step>('explainer')
  const [pockets, setPockets] = useState<Pocket[]>([])
  const [types, setTypes] = useState<SavingsType[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [groaiInsight, setGroaiInsight] = useState<string>('')

  // Create form state
  const [name, setName] = useState('')
  const [type, setType] = useState('goal')
  const [targetRand, setTargetRand] = useState<number>(0)
  const [icon, setIcon] = useState('🎯')
  const [color, setColor] = useState('#00897B')

  // Transact state
  const [activePocket, setActivePocket] = useState<Pocket | null>(null)
  const [transactAction, setTransactAction] = useState<'deposit' | 'withdraw'>('deposit')
  const [transactAmount, setTransactAmount] = useState<number>(0)

  // Success state
  const [receipt, setReceipt] = useState<{ reference: string; message: string } | null>(null)

  const loadPockets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiGet<{ success?: boolean; data?: { pockets?: Pocket[]; types?: SavingsType[]; groaiInsight?: string; totalSavedCents?: string } }>('/savings')
      const data = res?.data ?? {}
      setPockets(Array.isArray(data.pockets) ? data.pockets : [])
      setTypes(Array.isArray(data.types) ? data.types : [])
      setGroaiInsight(data.groaiInsight ?? '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load savings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    loadPockets()
  }, [open, loadPockets])

  const resetForm = () => {
    setName('')
    setType('goal')
    setTargetRand(0)
    setIcon('🎯')
    setColor('#00897B')
    setTransactAmount(0)
    setReceipt(null)
    setError(null)
  }

  const handleClose = () => {
    setStep('explainer')
    resetForm()
    setActivePocket(null)
    onOpenChange(false)
  }

  const handleCreate = useCallback(async () => {
    if (!name.trim()) {
      setError('Please give your pocket a name')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await apiPost('/savings', {
        name: name.trim(),
        type,
        targetCents: targetRand > 0 ? Math.round(targetRand * 100) : null,
        icon,
        color,
      })
      await loadPockets()
      setStep('list')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create pocket')
    } finally {
      setSaving(false)
    }
  }, [name, type, targetRand, icon, color, loadPockets])

  const handleTransact = useCallback(async () => {
    if (!activePocket || transactAmount <= 0) return
    setSaving(true)
    setError(null)
    try {
      const res = await apiPut<{ success?: boolean; data?: { reference: string; message: string; receiptNo?: string }; error?: string }>('/savings', {
        pocketId: activePocket.id,
        action: transactAction,
        amount: Math.round(transactAmount * 100),
      })
      if (res?.success === false) {
        setError(res.error || 'Transaction failed')
        return
      }
      const data = (res?.data ?? {}) as any
      setReceipt({
        reference: data.reference ?? data.receiptNo ?? `SAV-${Date.now()}`,
        message: data.message ?? `${transactAction === 'deposit' ? 'Deposit' : 'Withdrawal'} complete`,
      })
      await loadPockets()
      setStep('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transaction failed')
    } finally {
      setSaving(false)
    }
  }, [activePocket, transactAction, transactAmount, loadPockets])

  const selectedTypeMeta = types.find((t) => t.value === type)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 text-[#00897B]" />
            Savings Pockets
          </DialogTitle>
          <DialogDescription>
            Save towards goals, stash cash, lock deposits, run a stokvel or auto-save.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Explainer */}
        {step === 'explainer' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-2">
              {[
                { icon: Target, color: '#00897B', title: 'Goal-based', desc: 'Save towards a specific target with a target date.' },
                { icon: PiggyBank, color: '#4CAF50', title: 'Pocket', desc: 'Flexible savings — withdraw anytime, no lock-in.' },
                { icon: Lock, color: '#9C27B0', title: 'Fixed Deposit', desc: 'Lock money for a fixed term and earn higher interest.' },
                { icon: Users, color: '#FF9800', title: 'Stokvel', desc: 'Group savings with family or friends — shared goals.' },
                { icon: Bot, color: '#E91E63', title: 'Auto-Save', desc: 'Automatically round up every transaction and save the change.' },
              ].map((row) => {
                const Icon = row.icon
                return (
                  <div key={row.title} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-100">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${row.color}15` }}>
                      <Icon className="h-4 w-4" style={{ color: row.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1A1A1A]">{row.title}</p>
                      <p className="text-xs text-[#757575]">{row.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {groaiInsight && (
              <div className="flex items-start gap-2 p-3 bg-[#E0F2F1] rounded-xl">
                <Sparkles className="h-4 w-4 text-[#00897B] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-[#00897B]">GroAI Insight</p>
                  <p className="text-xs text-[#1A1A1A] mt-1">{groaiInsight}</p>
                </div>
              </div>
            )}

            <Button onClick={() => setStep('list')} className="w-full bg-[#00897B] hover:bg-[#00695C]">
              View My Pockets
            </Button>
          </div>
        )}

        {/* List of pockets */}
        {step === 'list' && (
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 text-[#00897B] animate-spin" />
              </div>
            ) : pockets.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-xl">
                <PiggyBank className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-[#1A1A1A]">No savings pockets yet</p>
                <p className="text-xs text-[#757575] mt-1">Create your first pocket to start saving.</p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-[#00897B] to-[#4CAF50] rounded-xl p-4 text-white">
                  <p className="text-white/80 text-xs">Total Saved</p>
                  <p className="text-2xl font-bold">
                    {formatMoney(pockets.reduce((sum, p) => sum + BigInt(p.currentCents), 0n))}
                  </p>
                </div>
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {pockets.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setActivePocket(p)
                        setTransactAction('deposit')
                        setTransactAmount(0)
                        setStep('transact')
                      }}
                      className="w-full p-3 rounded-xl bg-white border border-gray-200 text-left hover:border-[#00897B] transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{p.icon}</span>
                          <div>
                            <p className="text-sm font-medium text-[#1A1A1A]">{p.name}</p>
                            <p className="text-[10px] text-[#757575]">{p.typeIcon} {p.typeLabel}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {(p.interestRate * 100).toFixed(1)}% p.a.
                        </Badge>
                      </div>
                      <Progress value={p.progress ?? 0} className="h-2 mb-1" />
                      <div className="flex justify-between text-[10px] text-[#757575]">
                        <span>{formatMoney(p.currentCents)} saved</span>
                        <span>{p.targetCents ? `of ${formatMoney(p.targetCents)}` : 'No target'}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <Button onClick={() => { resetForm(); setStep('create') }} className="w-full bg-[#00897B] hover:bg-[#00695C]">
              <Plus className="h-4 w-4 mr-2" /> Create New Pocket
            </Button>
          </div>
        )}

        {/* Create pocket */}
        {step === 'create' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sav-name">Pocket Name</Label>
              <Input
                id="sav-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. December School Fees"
              />
            </div>

            <div className="space-y-2">
              <Label>Savings Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {types.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.icon} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedTypeMeta && (
                <p className="text-xs text-[#757575]">{selectedTypeMeta.desc}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sav-target">Target Amount (R) — optional</Label>
              <Input
                id="sav-target"
                type="number"
                min={0}
                value={targetRand || ''}
                onChange={(e) => setTargetRand(Number(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-10 gap-1">
                {POCKET_ICONS.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={`h-9 rounded-lg flex items-center justify-center text-base border-2 transition-all ${
                      icon === ic ? 'border-[#00897B] bg-[#E0F2F1]' : 'border-gray-200'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="grid grid-cols-8 gap-1">
                {POCKET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`h-8 rounded-lg border-2 transition-all ${
                      color === c ? 'border-[#1A1A1A]' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Pick colour ${c}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('list')} className="flex-1">Back</Button>
              <Button
                onClick={handleCreate}
                disabled={saving || !name.trim()}
                className="flex-1 bg-[#00897B] hover:bg-[#00695C]"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Create Pocket
              </Button>
            </div>
          </div>
        )}

        {/* Deposit / Withdraw */}
        {step === 'transact' && activePocket && (
          <div className="space-y-4">
            <button onClick={() => setStep('list')} className="text-xs text-[#00897B]">
              ← Back to pockets
            </button>

            <div className="rounded-xl p-4 text-white" style={{ backgroundColor: activePocket.color }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{activePocket.icon}</span>
                <Badge className="bg-white/20 text-white border-0">{activePocket.typeLabel}</Badge>
              </div>
              <p className="text-sm text-white/80">{activePocket.name}</p>
              <p className="text-2xl font-bold">{formatMoney(activePocket.currentCents)}</p>
              {activePocket.targetCents && (
                <>
                  <Progress value={activePocket.progress ?? 0} className="h-2 mt-2 bg-white/30" />
                  <p className="text-[10px] text-white/80 mt-1">
                    {formatMoney(activePocket.currentCents)} of {formatMoney(activePocket.targetCents)}
                  </p>
                </>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTransactAction('deposit')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                  transactAction === 'deposit' ? 'border-[#00897B] bg-[#E0F2F1]' : 'border-gray-200'
                }`}
              >
                <ArrowUpCircle className="h-5 w-5 text-[#00897B]" />
                <span className="text-xs font-medium text-[#1A1A1A]">Deposit</span>
              </button>
              <button
                onClick={() => setTransactAction('withdraw')}
                className={`p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${
                  transactAction === 'withdraw' ? 'border-[#FF5722] bg-orange-50' : 'border-gray-200'
                }`}
              >
                <ArrowDownCircle className="h-5 w-5 text-[#FF5722]" />
                <span className="text-xs font-medium text-[#1A1A1A]">Withdraw</span>
              </button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sav-amount">Amount (R)</Label>
              <Input
                id="sav-amount"
                type="number"
                min={0}
                value={transactAmount || ''}
                onChange={(e) => setTransactAmount(Number(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[100, 250, 500, 1000].map((amt) => (
                <Button
                  key={amt}
                  variant={transactAmount === amt ? 'default' : 'outline'}
                  onClick={() => setTransactAmount(amt)}
                  className={transactAmount === amt ? 'bg-[#00897B] hover:bg-[#00695C]' : ''}
                >
                  R{amt}
                </Button>
              ))}
            </div>

            <Button
              onClick={handleTransact}
              disabled={saving || transactAmount <= 0}
              className={`w-full ${
                transactAction === 'deposit'
                  ? 'bg-[#00897B] hover:bg-[#00695C]'
                  : 'bg-[#FF5722] hover:bg-[#E64A19]'
              }`}
            >
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : transactAction === 'deposit' ? (
                <ArrowUpCircle className="h-4 w-4 mr-2" />
              ) : (
                <ArrowDownCircle className="h-4 w-4 mr-2" />
              )}
              {transactAction === 'deposit' ? 'Deposit to Pocket' : 'Withdraw from Pocket'}
            </Button>
          </div>
        )}

        {/* Success */}
        {step === 'success' && receipt && (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-1">Transaction Complete</h3>
            <p className="text-sm text-[#757575] mb-4">{receipt.message}</p>
            <div className="bg-gray-50 rounded-xl p-3 mb-4">
              <p className="text-[10px] text-[#757575] uppercase">Receipt No</p>
              <p className="text-sm font-mono font-medium text-[#1A1A1A]">{receipt.reference}</p>
            </div>
            <Button onClick={handleClose} className="w-full bg-[#00897B] hover:bg-[#00695C]">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
