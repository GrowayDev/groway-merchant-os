'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { apiGet, apiPost, formatMoney } from '@/components/wallet/lib/api'
import {
  X,
  Check,
  Loader2,
  Bus,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Ticket,
  QrCode,
  Users,
  Calendar,
  Clock,
  MapPin,
} from 'lucide-react'

interface BusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface City {
  id: string
  name: string
  country: string
}
interface Operator {
  id: string
  name: string
  country: string
  phone: string
}
interface BusQuote {
  id: string
  operatorId: string
  operatorName: string
  fromCityId: string
  toCityId: string
  fromCity: string
  toCity: string
  busType: string
  departure: string
  arrival: string
  duration: string
  priceCents: string
  seatsAvailable: number
  amenities: string[]
}

interface PassengerForm {
  name: string
  idNumber: string
  type: 'adult' | 'child'
}

interface BookingResult {
  bookingRef: string
  ticketNumber: string
  receiptNo: string
  bus: BusQuote
  passengers: Array<PassengerForm & { sequence: number; seatNumber: number; ticketNumber: string }>
  totalAmount: string
  currency: string
  transactionId: string
  notice: string
}

type Step = 'search' | 'results' | 'passengers' | 'confirm' | 'ticket'

export function BusModal({ open, onOpenChange }: BusModalProps) {
  const [step, setStep] = useState<Step>('search')
  const [cities, setCities] = useState<City[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [buses, setBuses] = useState<BusQuote[]>([])
  const [fromCityId, setFromCityId] = useState('')
  const [toCityId, setToCityId] = useState('')
  const [date, setDate] = useState('')
  const [selectedBus, setSelectedBus] = useState<BusQuote | null>(null)
  const [passengers, setPassengers] = useState<PassengerForm[]>([
    { name: '', idNumber: '', type: 'adult' },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<BookingResult | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function loadCatalog() {
      try {
        const res = await apiGet<{ cities: City[]; operators: Operator[] }>(
          '/travel/buses'
        )
        if (cancelled) return
        if (Array.isArray(res.cities)) setCities(res.cities)
        if (Array.isArray(res.operators)) setOperators(res.operators)
      } catch {
        // ignore
      }
    }
    loadCatalog()
    return () => {
      cancelled = true
    }
  }, [open])

  const citiesByCountry = useMemo(() => {
    const map = new Map<string, City[]>()
    for (const c of cities) {
      const arr = map.get(c.country) ?? []
      arr.push(c)
      map.set(c.country, arr)
    }
    return Array.from(map.entries()).map(([country, items]) => ({ country, items }))
  }, [cities])

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const handleSearch = useCallback(async () => {
    if (!fromCityId || !toCityId || !date) return
    if (fromCityId === toCityId) {
      setError('Departure and destination cities must be different')
      return
    }
    setSearchLoading(true)
    setError(null)
    try {
      const res = await apiGet<{ buses: BusQuote[] }>(
        `/travel/buses?from=${encodeURIComponent(fromCityId)}&to=${encodeURIComponent(toCityId)}&date=${encodeURIComponent(date)}`
      )
      setBuses(Array.isArray(res.buses) ? res.buses : [])
      setStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setBuses([])
    } finally {
      setSearchLoading(false)
    }
  }, [fromCityId, toCityId, date])

  const handleBook = useCallback(async () => {
    if (!selectedBus) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiPost<BookingResult>('/travel/buses', {
        busId: selectedBus.id,
        fromCity: selectedBus.fromCityId,
        toCity: selectedBus.toCityId,
        date,
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
  }, [selectedBus, date, passengers])

  const handleClose = useCallback(() => {
    setStep('search')
    setSelectedBus(null)
    setError(null)
    setBooking(null)
    setBuses([])
    setPassengers([{ name: '', idNumber: '', type: 'adult' }])
    onOpenChange(false)
  }, [onOpenChange])

  const updatePassenger = (idx: number, field: keyof PassengerForm, value: string) => {
    setPassengers((prev) =>
      prev.map((p, i) =>
        i === idx
          ? { ...p, [field]: field === 'type' ? (value as 'adult' | 'child') : value }
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
            <Bus className="h-5 w-5 text-[#00897B]" />
            <h2 className="text-lg font-bold text-[#1A1A1A]">Book a Bus</h2>
          </div>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'search' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#757575] flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> From
                  </label>
                  <Select value={fromCityId} onValueChange={setFromCityId}>
                    <SelectTrigger className="w-full h-12 mt-1">
                      <SelectValue placeholder="Select departure city" />
                    </SelectTrigger>
                    <SelectContent>
                      {citiesByCountry.map((group) => (
                        <SelectGroup key={group.country}>
                          <SelectLabel>
                            {group.country === 'ZA' ? 'South Africa' : group.country === 'MW' ? 'Malawi' : group.country}
                          </SelectLabel>
                          {group.items.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const a = fromCityId
                      setFromCityId(toCityId)
                      setToCityId(a)
                    }}
                    className="w-9 h-9 rounded-full bg-[#E0F2F1] flex items-center justify-center hover:bg-[#B2DFDB]"
                    aria-label="Swap cities"
                  >
                    <ArrowRight className="h-4 w-4 text-[#00897B] rotate-90" />
                  </button>
                </div>

                <div>
                  <label className="text-xs text-[#757575] flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> To
                  </label>
                  <Select value={toCityId} onValueChange={setToCityId}>
                    <SelectTrigger className="w-full h-12 mt-1">
                      <SelectValue placeholder="Select destination city" />
                    </SelectTrigger>
                    <SelectContent>
                      {citiesByCountry.map((group) => (
                        <SelectGroup key={group.country}>
                          <SelectLabel>
                            {group.country === 'ZA' ? 'South Africa' : group.country === 'MW' ? 'Malawi' : group.country}
                          </SelectLabel>
                          {group.items.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs text-[#757575] flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Date
                </label>
                <Input
                  type="date"
                  min={todayStr}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 mt-1"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <Button
                onClick={handleSearch}
                disabled={!fromCityId || !toCityId || !date || searchLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                {searchLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search Buses'}
              </Button>

              {operators.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-[#757575] mb-2">Operators</p>
                  <div className="flex flex-wrap gap-2">
                    {operators.map((o) => (
                      <Badge key={o.id} variant="outline" className="text-xs">
                        {o.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('search')}
                className="text-sm text-[#00897B] flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Modify search
              </button>

              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm font-medium text-[#1A1A1A]">
                  {selectedCityName(cities, fromCityId)}{' '}
                  <ArrowRight className="h-3 w-3 inline text-gray-400" />{' '}
                  {selectedCityName(cities, toCityId)}
                </span>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" /> {date}
                </Badge>
              </div>

              {buses.length === 0 ? (
                <p className="text-sm text-[#757575] text-center py-6">
                  No buses found for this route on the selected date.
                </p>
              ) : (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Operator</TableHead>
                        <TableHead className="text-xs">Departure</TableHead>
                        <TableHead className="text-xs">Arrival</TableHead>
                        <TableHead className="text-xs">Bus type</TableHead>
                        <TableHead className="text-xs text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {buses.map((bus) => (
                        <TableRow
                          key={bus.id}
                          onClick={() => {
                            setSelectedBus(bus)
                            setStep('passengers')
                          }}
                          className="cursor-pointer hover:bg-[#E0F2F1]"
                        >
                          <TableCell>
                            <p className="text-sm font-bold text-[#1A1A1A]">{bus.operatorName}</p>
                            <p className="text-[10px] text-[#757575]">{bus.duration}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{bus.departure}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{bus.arrival}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs">{bus.busType}</p>
                            <p className="text-[10px] text-[#757575]">{bus.seatsAvailable} seats</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="text-sm font-bold text-[#00897B]">
                              {formatMoney(bus.priceCents)}
                            </p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <p className="text-xs text-[#757575] text-center">Tap a row to select your bus</p>
            </div>
          )}

          {step === 'passengers' && selectedBus && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('results')}
                className="text-sm text-[#00897B] flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Back to results
              </button>

              <div className="bg-[#E0F2F1] rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-[#1A1A1A]">{selectedBus.operatorName}</span>
                  <Badge className="bg-[#00897B] text-white">{selectedBus.busType}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[#1A1A1A]">{selectedBus.departure}</p>
                    <p className="text-[#757575]">{selectedBus.fromCity}</p>
                  </div>
                  <Bus className="h-4 w-4 text-[#00897B]" />
                  <div className="text-right">
                    <p className="font-bold text-[#1A1A1A]">{selectedBus.arrival}</p>
                    <p className="text-[#757575]">{selectedBus.toCity}</p>
                  </div>
                </div>
                {selectedBus.amenities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {selectedBus.amenities.map((a) => (
                      <Badge key={a} variant="outline" className="text-[10px]">
                        {a}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-1">
                  <Users className="h-4 w-4" /> Passenger Details
                </h3>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addPassenger}
                  disabled={passengers.length >= 9 || passengers.length >= selectedBus.seatsAvailable}
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
                      placeholder="ID / Passport number"
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
                        <SelectItem value="child">Child (under 12) - 50% off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-3 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#757575]">Base price per adult</span>
                  <span className="text-[#1A1A1A]">{formatMoney(selectedBus.priceCents)}</span>
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

          {step === 'confirm' && selectedBus && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-[#1A1A1A]">
                  {formatMoney(totalCents(selectedBus, passengers).toString())}
                </p>
                <p className="text-sm text-[#757575]">
                  {selectedBus.operatorName} - {passengers.length} passenger(s)
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <Row label="Route" value={`${selectedBus.fromCity} -> ${selectedBus.toCity}`} />
                <Row label="Date" value={date} />
                <Row label="Departure" value={selectedBus.departure} />
                <Row label="Arrival" value={selectedBus.arrival} />
                <Row label="Duration" value={selectedBus.duration} />
                <Row label="Bus type" value={selectedBus.busType} />
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
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm & Pay'}
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
                <h3 className="text-lg font-bold text-[#1A1A1A]">Bus Ticket Issued</h3>
                <p className="text-xs text-[#757575]">Your booking is confirmed</p>
              </div>

              <div className="rounded-2xl border-2 border-dashed border-[#00897B]/40 overflow-hidden">
                <div className="bg-[#00897B] text-white p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] opacity-80">BOOKING REF</p>
                    <p className="text-lg font-mono font-bold tracking-widest">{booking.bookingRef}</p>
                  </div>
                  <Bus className="h-6 w-6" />
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#757575]">FROM</p>
                      <p className="text-base font-bold text-[#1A1A1A]">{booking.bus.fromCity}</p>
                      <p className="text-[10px] text-[#757575]">Dep: {booking.bus.departure}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-[#00897B]" />
                    <div className="text-right">
                      <p className="text-[10px] text-[#757575]">TO</p>
                      <p className="text-base font-bold text-[#1A1A1A]">{booking.bus.toCity}</p>
                      <p className="text-[10px] text-[#757575]">Arr: {booking.bus.arrival}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Info2 label="Operator" value={booking.bus.operatorName} />
                    <Info2 label="Bus type" value={booking.bus.busType} />
                    <Info2 label="Date" value={date} />
                    <Info2 label="Duration" value={booking.bus.duration} />
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3">
                    <p className="text-[10px] text-[#757575] mb-1">TICKET NUMBER</p>
                    <p className="text-sm font-mono font-bold text-[#00897B]">{booking.ticketNumber}</p>
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3">
                    <p className="text-[10px] text-[#757575] mb-1">PASSENGERS & SEATS</p>
                    <div className="space-y-1">
                      {booking.passengers.map((p) => (
                        <div key={p.sequence} className="flex items-center justify-between text-xs">
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{p.name}</p>
                            <p className="text-[10px] text-[#757575]">ID: {p.idNumber} - {p.type}</p>
                          </div>
                          <Badge variant="outline" className="text-[10px]">Seat {p.seatNumber}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3 flex items-center gap-3">
                    <div className="w-16 h-16 bg-white border border-gray-300 rounded-md flex items-center justify-center">
                      <QrCode className="h-12 w-12 text-[#1A1A1A]" />
                    </div>
                    <div className="text-xs text-[#757575]">
                      <p className="font-medium text-[#1A1A1A]">Boarding pass</p>
                      <p>Present at boarding 30 minutes before departure with valid ID.</p>
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

function totalCents(bus: BusQuote, passengers: PassengerForm[]): bigint {
  return passengers.reduce((sum, p) => {
    const base = BigInt(bus.priceCents)
    return sum + (p.type === 'child' ? BigInt(Math.round(Number(base) * 0.5)) : base)
  }, BigInt(0))
}

function selectedCityName(cities: City[], id: string): string {
  return cities.find((c) => c.id === id)?.name ?? id
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
