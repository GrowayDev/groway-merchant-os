'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Check,
  Loader2,
  Train as TrainIcon,
  ChevronRight,
  Ticket
} from 'lucide-react'

interface TrainModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'type' | 'route' | 'ticket' | 'confirm' | 'success'

type TrainSystem = 'gautrain' | 'prasa'

const gautrainStations = [
  'OR Tambo Airport', 'Centurion', 'Pretoria', 'Hatfield', 'Rosebank', 
  'Sandton', 'Marlboro', 'Midrand', 'Rhodesfield'
]

const prasaRoutes = [
  { from: 'Johannesburg', to: 'Pretoria' },
  { from: 'Johannesburg', to: 'Cape Town' },
  { from: 'Johannesburg', to: 'Durban' },
  { from: 'Cape Town', to: 'Durban' },
]

const ticketTypes = [
  { id: 'single', name: 'Single Trip', desc: 'One-way ticket' },
  { id: 'return', name: 'Return', desc: 'Round trip' },
  { id: 'weekly', name: 'Weekly Pass', desc: '7-day unlimited' },
  { id: 'monthly', name: 'Monthly Pass', desc: '30-day unlimited' },
]

export function TrainModal({ open, onOpenChange }: TrainModalProps) {
  const [step, setStep] = useState<Step>('type')
  const [trainSystem, setTrainSystem] = useState<TrainSystem>('gautrain')
  const [fromStation, setFromStation] = useState('')
  const [toStation, setToStation] = useState('')
  const [selectedTicketType, setSelectedTicketType] = useState('single')
  const [isLoading, setIsLoading] = useState(false)
  const [ticketId, setTicketId] = useState('')

  const price = trainSystem === 'gautrain' ? 65 : 35

  const handleBuy = useCallback(async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setTicketId(`TRN${Date.now().toString(36).toUpperCase()}`)
    setStep('success')
    setIsLoading(false)
  }, [])

  const handleClose = useCallback(() => {
    setStep('type')
    setTrainSystem('gautrain')
    setFromStation('')
    setToStation('')
    setSelectedTicketType('single')
    onOpenChange(false)
  }, [onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Book Train</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'type' && (
            <div className="space-y-4">
              <p className="text-sm text-[#757575]">Select train system</p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setTrainSystem('gautrain')
                    setStep('route')
                  }}
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-[#00897B] text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <TrainIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1A1A1A]">Gautrain</p>
                      <p className="text-xs text-[#757575]">Gauteng high-speed rail</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                  </div>
                </button>

                <button
                  onClick={() => {
                    setTrainSystem('prasa')
                    setStep('route')
                  }}
                  className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-[#00897B] text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <TrainIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1A1A1A]">PRASA (Shosholoza Meyl)</p>
                      <p className="text-xs text-[#757575]">Long-distance intercity</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {step === 'route' && (
            <div className="space-y-4">
              <button onClick={() => setStep('type')} className="text-sm text-[#00897B]">
                ← Change train system
              </button>

              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                <TrainIcon className={`h-5 w-5 ${trainSystem === 'gautrain' ? 'text-blue-600' : 'text-green-600'}`} />
                <span className="text-sm font-bold text-[#1A1A1A]">
                  {trainSystem === 'gautrain' ? 'Gautrain' : 'PRASA'}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#757575]">From</label>
                  <select
                    value={fromStation}
                    onChange={(e) => setFromStation(e.target.value)}
                    className="w-full h-12 px-3 border border-gray-200 rounded-xl mt-1"
                  >
                    <option value="">Select station</option>
                    {trainSystem === 'gautrain' 
                      ? gautrainStations.map((s) => <option key={s} value={s}>{s}</option>)
                      : prasaRoutes.map((r) => <option key={r.from} value={r.from}>{r.from}</option>)
                    }
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#757575]">To</label>
                  <select
                    value={toStation}
                    onChange={(e) => setToStation(e.target.value)}
                    className="w-full h-12 px-3 border border-gray-200 rounded-xl mt-1"
                  >
                    <option value="">Select station</option>
                    {trainSystem === 'gautrain' 
                      ? gautrainStations.map((s) => <option key={s} value={s}>{s}</option>)
                      : prasaRoutes.filter(r => r.from === fromStation).map((r) => <option key={r.to} value={r.to}>{r.to}</option>)
                    }
                  </select>
                </div>
              </div>

              <Button
                onClick={() => setStep('ticket')}
                disabled={!fromStation || !toStation}
                className="w-full bg-[#00897B] hover:bg-[#00695C]"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 'ticket' && (
            <div className="space-y-4">
              <button onClick={() => setStep('route')} className="text-sm text-[#00897B]">
                ← Back
              </button>

              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-sm font-medium text-[#1A1A1A]">{fromStation} → {toStation}</p>
              </div>

              <h3 className="text-sm font-semibold text-[#1A1A1A]">Select ticket type</h3>

              <div className="space-y-2">
                {ticketTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedTicketType(type.id)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      selectedTicketType === type.id
                        ? 'border-[#00897B] bg-[#E0F2F1]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <p className="text-sm font-medium text-[#1A1A1A]">{type.name}</p>
                    <p className="text-xs text-[#757575]">{type.desc}</p>
                  </button>
                ))}
              </div>

              <div className="bg-[#E0F2F1] rounded-xl p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Price</span>
                  <span className="text-lg font-bold text-[#00897B]">R {price}</span>
                </div>
              </div>

              <Button
                onClick={() => setStep('confirm')}
                className="w-full bg-[#00897B] hover:bg-[#00695C]"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 'confirm' && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-[#1A1A1A]">R {price}</p>
                <p className="text-sm text-[#757575]">{fromStation} → {toStation}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Train</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">
                    {trainSystem === 'gautrain' ? 'Gautrain' : 'PRASA'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Ticket Type</span>
                  <span className="text-sm font-medium text-[#1A1A1A] capitalize">{selectedTicketType}</span>
                </div>
              </div>

              <Button
                onClick={handleBuy}
                disabled={isLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Buy Ticket'}
              </Button>

              <Button variant="outline" onClick={() => setStep('ticket')} className="w-full">
                Back
              </Button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-4">
                <Ticket className="h-10 w-10 text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Ticket Purchased!</h3>
              <p className="text-sm text-[#757575] mb-4">
                {fromStation} → {toStation}
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-[#757575] mb-1">Ticket Number</p>
                <p className="text-lg font-mono font-bold text-[#00897B]">{ticketId}</p>
              </div>
              <div className="flex items-center justify-center gap-2 p-3 bg-[#E0F2F1] rounded-xl mb-4">
                <Ticket className="h-5 w-5 text-[#00897B]" />
                <span className="text-sm font-medium text-[#00897B]">Show QR at gate</span>
              </div>
              <Button onClick={handleClose} className="w-full bg-[#00897B] hover:bg-[#00695C]">
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
