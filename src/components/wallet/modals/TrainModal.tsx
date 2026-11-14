'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiGet, apiPost, formatMoney } from '@/components/wallet/lib/api'
import {
  X,
  Check,
  Loader2,
  Train as TrainIcon,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Ticket,
  QrCode,
  Users,
  ChevronRight,
} from 'lucide-react'

interface TrainModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface TrainRoute {
  id: string
  from: string
  to: string
  price: number
  priceCents: string
  duration: string
}
interface Operator {
  id: string
  name: string
  country: string
  routes: TrainRoute[]
}

interface PassengerForm {
  name: string
  idNumber: string
  type: 'adult' | 'child' | 'pensioner'
}

interface BookingResult {
  bookingRef: string
  ticketNumber: string
  receiptNo: string
  operator: { id: string; name: string; country: string }
  route: { id: string; from: string; to: string; duration: string; priceCents: string }
  passengers: Array<
    PassengerForm & {
      sequence: number
      coach: string
      seatNumber: string
      ticketNumber: string
    }
  >
  totalAmount: string
  currency: string
  transactionId: string
  notice: string
}

type Step = 'operator' | 'route' | 'passengers' | 'confirm' | 'ticket'

export function TrainModal({ open, onOpenChange }: TrainModalProps) {
  const [step, setStep] = useState<Step>('operator')
  const [operators, setOperators] = useState<Operator[]>([])
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null)
  const [selectedRoute, setSelectedRoute] = useState<TrainRoute | null>(null)
  const [passengers, setPassengers] = useState<PassengerForm[]>([
    { name: '', idNumber: '', type: 'adult' },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [catalogLoading, setCatalogLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<BookingResult | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function loadCatalog() {
      setCatalogLoading(true)
      try {
        const res = await apiGet<{ operators: Operator[] }>('/travel/trains')
        if (cancelled) return
        if (Array.isArray(res.operators)) setOperators(res.operators)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    }
    loadCatalog()
    return () => {
      cancelled = true
    }
  }, [open])

  const handleBook = useCallback(async () => {
    if (!selectedOperator || !selectedRoute) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiPost<BookingResult>('/travel/trains', {
        operatorId: selectedOperator.id,
        routeId: selectedRoute.id,
        passengers: passengers.map((p) => ({
          name: p.name,
          idNumber: p.idNumber,
          type: p.type,
        })),
      })
      setBooking(res)
      setStep('ticket')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setIsLoading(false)
    }
  }, [selectedOperator, selectedRoute, passengers])

  const handleClose = useCallback(() => {
    setStep('operator')
    setSelectedOperator(null)
    setSelectedRoute(null)
    setError(null)
    setBooking(null)
    setPassengers([{ name: '', idNumber: '', type: 'adult' }])
    onOpenChange(false)
  }, [onOpenChange])

  const updatePassenger = (idx: number, field: keyof PassengerForm, value: string) => {
    setPassengers((prev) =>
      prev.map((p, i) =>
        i === idx
          ? { ...p, [field]: field === 'type' ? (value as 'adult' | 'child' | 'pensioner') : value }
          : p
      )
    )
  }

  const addPassenger = () => {
    if (passengers.length >= 9) return
    setPassengers((prev) => [...prev, { name: '', idNumber: '', type: 'adult' }])
  }

  const removePassenger = (idx: number) => {
    if (passengers.length <= 1) return
    setPassengers((prev) => prev.filter((_, i) => i !== idx))
  }

  const passengersValid = passengers.every((p) => p.name.trim() && p.idNumber.trim())

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <TrainIcon className="h-5 w-5 text-[#00897B]" />
            <h2 className="text-lg font-bold text-[#1A1A1A]">Book a Train</h2>
          </div>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'operator' && (
            <div className="space-y-4">
              <p className="text-sm text-[#757575]">Select train operator</p>

              {catalogLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 text-[#00897B] animate-spin" />
                </div>
              )}

              <div className="space-y-3">
                {operators.map((op) => (
                  <button
                    key={op.id}
                    onClick={() => {
                      setSelectedOperator(op)
                      setSelectedRoute(null)
                      setStep('route')
                    }}
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-[#00897B] text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-[#E0F2F1] flex items-center justify-center">
                        <TrainIcon className="h-6 w-6 text-[#00897B]" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#1A1A1A]">{op.name}</p>
                        <p className="text-xs text-[#757575]">
                          {op.country === 'ZA' ? 'South Africa' : op.country} - {op.routes.length} route(s)
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </button>
                ))}
                {!catalogLoading && operators.length === 0 && (
                  <p className="text-sm text-[#757575] text-center py-4">
                    Train operators unavailable.
                  </p>
                )}
              </div>
            </div>
          )}

          {step === 'route' && selectedOperator && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('operator')}
                className="text-sm text-[#00897B] flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Change operator
              </button>

              <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-2">
                <TrainIcon className="h-5 w-5 text-[#00897B]" />
                <span className="text-sm font-bold text-[#1A1A1A]">{selectedOperator.name}</span>
              </div>

              <h3 className="text-sm font-semibold text-[#1A1A1A]">Select route</h3>

              <div className="space-y-2">
                {selectedOperator.routes.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedRoute(r)
                      setStep('passengers')
                    }}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      selectedRoute?.id === r.id
                        ? 'border-[#00897B] bg-[#E0F2F1]'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[#1A1A1A]">
                          {r.from} <ArrowRight className="h-3 w-3 inline text-gray-400" /> {r.to}
                        </p>
                        <p className="text-xs text-[#757575]">Duration: {r.duration}</p>
                      </div>
                      <span className="text-sm font-bold text-[#00897B]">
                        {formatMoney(r.priceCents)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'passengers' && selectedOperator && selectedRoute && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('route')}
                className="text-sm text-[#00897B] flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Back to routes
              </button>

              <div className="bg-[#E0F2F1] rounded-xl p-3 text-center">
                <p className="text-sm font-medium text-[#1A1A1A]">
                  {selectedRoute.from} <ArrowRight className="h-3 w-3 inline text-gray-500" /> {selectedRoute.to}
                </p>
                <p className="text-xs text-[#757575]">
                  {selectedOperator.name} - {selectedRoute.duration}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-1">
                  <Users className="h-4 w-4" /> Passengers
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addPassenger}
                  disabled={passengers.length >= 9}
                >
                  Add passenger
                </Button>
              </div>

              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {passengers.map((p, idx) => (
                  <div key={idx} className="p-3 border border-gray-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-[#757575]">Passenger {idx + 1}</p>
                      {passengers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePassenger(idx)}
                          className="text-xs text-red-500 hover:underline"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <Input
                      placeholder="Full name (as per ID)"
                      value={p.name}
                      onChange={(e) => updatePassenger(idx, 'name', e.target.value)}
                      className="h-10"
                    />
                    <Input
                      placeholder="ID number"
                      value={p.idNumber}
                      onChange={(e) => updatePassenger(idx, 'idNumber', e.target.value)}
                      className="h-10"
                    />
                    <Select value={p.type} onValueChange={(v) => updatePassenger(idx, 'type', v)}>
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adult">Adult</SelectItem>
                        <SelectItem value="child">Child - 50% off</SelectItem>
                        <SelectItem value="pensioner">Pensioner (60+) - 30% off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#757575]">Base price per adult</span>
                  <span className="text-[#1A1A1A]">{formatMoney(selectedRoute.priceCents)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#757575]">Passengers</span>
                  <span className="text-[#1A1A1A]">{passengers.length}</span>
                </div>
              </div>

              <Button
                onClick={() => setStep('confirm')}
                disabled={!passengersValid}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                Continue to payment
              </Button>
            </div>
          )}

          {step === 'confirm' && selectedOperator && selectedRoute && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-[#1A1A1A]">
                  {formatMoney(totalCents(selectedRoute, passengers).toString())}
                </p>
                <p className="text-sm text-[#757575]">
                  {selectedOperator.name} - {passengers.length} passenger(s)
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <Row label="Operator" value={selectedOperator.name} />
                <Row label="Route" value={`${selectedRoute.from} -> ${selectedRoute.to}`} />
                <Row label="Duration" value={selectedRoute.duration} />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                onClick={handleBook}
                disabled={isLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Buy Ticket'}
              </Button>

              <Button variant="outline" onClick={() => setStep('passengers')} className="w-full">
                Back
              </Button>
            </div>
          )}

          {step === 'ticket' && booking && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-2">
                  <Check className="h-7 w-7 text-[#4CAF50]" />
                </div>
                <h3 className="text-lg font-bold text-[#1A1A1A]">Train Ticket Issued</h3>
                <p className="text-xs text-[#757575]">Your journey is confirmed</p>
              </div>

              <div className="rounded-2xl border-2 border-dashed border-[#00897B]/40 overflow-hidden">
                <div className="bg-[#00897B] text-white p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] opacity-80">BOOKING REF</p>
                    <p className="text-lg font-mono font-bold tracking-widest">{booking.bookingRef}</p>
                  </div>
                  <TrainIcon className="h-6 w-6" />
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#757575]">FROM</p>
                      <p className="text-base font-bold text-[#1A1A1A]">{booking.route.from}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#00897B]" />
                    <div className="text-right">
                      <p className="text-[10px] text-[#757575]">TO</p>
                      <p className="text-base font-bold text-[#1A1A1A]">{booking.route.to}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Info2 label="Operator" value={booking.operator.name} />
                    <Info2 label="Duration" value={booking.route.duration} />
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3">
                    <p className="text-[10px] text-[#757575] mb-1">TICKET NUMBER</p>
                    <p className="text-sm font-mono font-bold text-[#00897B]">{booking.ticketNumber}</p>
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3">
                    <p className="text-[10px] text-[#757575] mb-1">PASSENGERS, COACH & SEAT</p>
                    <div className="space-y-1">
                      {booking.passengers.map((p) => (
                        <div key={p.sequence} className="flex items-center justify-between text-xs">
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{p.name}</p>
                            <p className="text-[10px] text-[#757575]">ID: {p.idNumber} - {p.type}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            Coach {p.coach} - Seat {p.seatNumber}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3 flex items-center gap-3">
                    <div className="w-16 h-16 bg-white border border-gray-300 rounded-md flex items-center justify-center">
                      <QrCode className="h-12 w-12 text-[#1A1A1A]" />
                    </div>
                    <div className="text-xs text-[#757575]">
                      <p className="font-medium text-[#1A1A1A]">Scan at gate</p>
                      <p>Present the QR code at the station gate with valid ID.</p>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] text-[#757575]">TOTAL PAID</p>
                      <p className="text-lg font-bold text-[#00897B]">{formatMoney(booking.totalAmount)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#757575]">RECEIPT</p>
                      <p className="text-xs font-mono">{booking.receiptNo}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleClose} className="w-full bg-[#00897B] hover:bg-[#00695C] h-12">
                Done
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function totalCents(route: TrainRoute, passengers: PassengerForm[]): bigint {
  return passengers.reduce((sum, p) => {
    const base = BigInt(route.priceCents)
    const mult = p.type === 'child' ? 0.5 : p.type === 'pensioner' ? 0.7 : 1.0
    return sum + BigInt(Math.round(Number(base) * mult))
  }, BigInt(0))
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[#757575]">{label}</span>
      <span className="font-medium text-[#1A1A1A]">{value}</span>
    </div>
  )
}

function Info2({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[#757575]">{label}</p>
      <p className="text-sm font-medium text-[#1A1A1A]">{value}</p>
    </div>
  )
}
