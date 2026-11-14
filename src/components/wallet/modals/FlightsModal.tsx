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
import { apiGet, apiPost, formatMoney, formatDate } from '@/components/wallet/lib/api'
import {
  X,
  Check,
  Loader2,
  Plane,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Ticket,
  QrCode,
  Info,
  Users,
  Calendar,
  Clock,
} from 'lucide-react'

interface FlightsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Airport {
  code: string
  name: string
  city: string
  country: string
}
interface Airline {
  id: string
  name: string
  code: string
  country: string
  iata: string
}
interface Flight {
  id: string
  flightNumber: string
  airlineId: string
  airlineName: string
  airlineCode: string
  aircraft: string
  fromCode: string
  toCode: string
  fromCity: string
  toCity: string
  departure: string
  arrival: string
  duration: string
  priceCents: string
  seatsAvailable: number
  cabin: string
}

interface PassengerForm {
  name: string
  idNumber: string
  type: 'adult' | 'child'
}

interface BookingResult {
  bookingRef: string
  eTicketNumber: string
  receiptNo: string
  flight: Flight
  passengers: Array<PassengerForm & { sequence: number; eTicketNumber: string }>
  totalAmount: string
  currency: string
  iataNotice: string
  transactionId: string
}

type Step = 'search' | 'results' | 'passengers' | 'confirm' | 'ticket'

export function FlightsModal({ open, onOpenChange }: FlightsModalProps) {
  const [step, setStep] = useState<Step>('search')
  const [airports, setAirports] = useState<Airport[]>([])
  const [airlines, setAirlines] = useState<Airline[]>([])
  const [flights, setFlights] = useState<Flight[]>([])
  const [fromCode, setFromCode] = useState('')
  const [toCode, setToCode] = useState('')
  const [date, setDate] = useState('')
  const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null)
  const [passengers, setPassengers] = useState<PassengerForm[]>([
    { name: '', idNumber: '', type: 'adult' },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<BookingResult | null>(null)

  // Load catalog once on open
  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function loadCatalog() {
      try {
        const res = await apiGet<{
          airlines: Airline[]
          airports: Airport[]
        }>('/travel/flights')
        if (cancelled) return
        if (Array.isArray(res.airports)) setAirports(res.airports)
        if (Array.isArray(res.airlines)) setAirlines(res.airlines)
      } catch {
        // keep empty catalog
      }
    }
    loadCatalog()
    return () => {
      cancelled = true
    }
  }, [open])

  // Group airports by country for the dropdowns
  const airportsByCountry = useMemo(() => {
    const map = new Map<string, Airport[]>()
    for (const a of airports) {
      const arr = map.get(a.country) ?? []
      arr.push(a)
      map.set(a.country, arr)
    }
    return Array.from(map.entries()).map(([country, items]) => ({ country, items }))
  }, [airports])

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), [])

  const handleSearch = useCallback(async () => {
    if (!fromCode || !toCode || !date) return
    if (fromCode === toCode) {
      setError('Departure and arrival airports must be different')
      return
    }
    setSearchLoading(true)
    setError(null)
    try {
      const res = await apiGet<{ flights: Flight[] }>(
        `/travel/flights?from=${encodeURIComponent(fromCode)}&to=${encodeURIComponent(toCode)}&date=${encodeURIComponent(date)}`
      )
      setFlights(Array.isArray(res.flights) ? res.flights : [])
      setStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setFlights([])
    } finally {
      setSearchLoading(false)
    }
  }, [fromCode, toCode, date])

  const handleBook = useCallback(async () => {
    if (!selectedFlight) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiPost<BookingResult>('/travel/flights', {
        flightId: selectedFlight.id,
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
  }, [selectedFlight, date, passengers])

  const handleClose = useCallback(() => {
    setStep('search')
    setSelectedFlight(null)
    setError(null)
    setBooking(null)
    setFlights([])
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
            <Plane className="h-5 w-5 text-[#00897B]" />
            <h2 className="text-lg font-bold text-[#1A1A1A]">Book a Flight</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'search' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#757575] flex items-center gap-1">
                    <Plane className="h-3 w-3" /> From
                  </label>
                  <Select value={fromCode} onValueChange={setFromCode}>
                    <SelectTrigger className="w-full h-12 mt-1">
                      <SelectValue placeholder="Select departure airport" />
                    </SelectTrigger>
                    <SelectContent>
                      {airportsByCountry.map((group) => (
                        <SelectGroup key={group.country}>
                          <SelectLabel>
                            {group.country === 'ZA' ? 'South Africa' : group.country === 'MW' ? 'Malawi' : group.country}
                          </SelectLabel>
                          {group.items.map((a) => (
                            <SelectItem key={a.code} value={a.code}>
                              {a.code} - {a.city} ({a.name})
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
                      const a = fromCode
                      setFromCode(toCode)
                      setToCode(a)
                    }}
                    className="w-9 h-9 rounded-full bg-[#E0F2F1] flex items-center justify-center hover:bg-[#B2DFDB]"
                    aria-label="Swap airports"
                  >
                    <ArrowRight className="h-4 w-4 text-[#00897B] rotate-90" />
                  </button>
                </div>

                <div>
                  <label className="text-xs text-[#757575] flex items-center gap-1">
                    <Plane className="h-3 w-3 rotate-90" /> To
                  </label>
                  <Select value={toCode} onValueChange={setToCode}>
                    <SelectTrigger className="w-full h-12 mt-1">
                      <SelectValue placeholder="Select destination airport" />
                    </SelectTrigger>
                    <SelectContent>
                      {airportsByCountry.map((group) => (
                        <SelectGroup key={group.country}>
                          <SelectLabel>
                            {group.country === 'ZA' ? 'South Africa' : group.country === 'MW' ? 'Malawi' : group.country}
                          </SelectLabel>
                          {group.items.map((a) => (
                            <SelectItem key={a.code} value={a.code}>
                              {a.code} - {a.city} ({a.name})
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
                disabled={!fromCode || !toCode || !date || searchLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                {searchLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search Flights'}
              </Button>

              {airlines.length > 0 && (
                <div className="pt-2">
                  <p className="text-xs text-[#757575] mb-2">Supported airlines</p>
                  <div className="flex flex-wrap gap-2">
                    {airlines.map((a) => (
                      <Badge key={a.id} variant="outline" className="text-xs">
                        {a.code} - {a.name}
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
                  {fromCode} <ArrowRight className="h-3 w-3 inline text-gray-400" /> {toCode}
                </span>
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" /> {date}
                </Badge>
              </div>

              {flights.length === 0 ? (
                <p className="text-sm text-[#757575] text-center py-6">
                  No flights found for this route on the selected date.
                </p>
              ) : (
                <div className="rounded-xl border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Airline</TableHead>
                        <TableHead className="text-xs">Departure</TableHead>
                        <TableHead className="text-xs">Arrival</TableHead>
                        <TableHead className="text-xs">Duration</TableHead>
                        <TableHead className="text-xs text-right">Price</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flights.map((flight) => (
                        <TableRow
                          key={flight.id}
                          onClick={() => {
                            setSelectedFlight(flight)
                            setStep('passengers')
                          }}
                          className="cursor-pointer hover:bg-[#E0F2F1]"
                        >
                          <TableCell>
                            <p className="text-sm font-bold text-[#1A1A1A]">{flight.airlineCode}</p>
                            <p className="text-[10px] text-[#757575]">{flight.flightNumber}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{flight.departure}</p>
                            <p className="text-[10px] text-[#757575]">{flight.fromCode}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium">{flight.arrival}</p>
                            <p className="text-[10px] text-[#757575]">{flight.toCode}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs">{flight.duration}</p>
                            <p className="text-[10px] text-[#757575]">{flight.seatsAvailable} seats</p>
                          </TableCell>
                          <TableCell className="text-right">
                            <p className="text-sm font-bold text-[#00897B]">
                              {formatMoney(flight.priceCents)}
                            </p>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              <p className="text-xs text-[#757575] text-center">
                Tap a row to select your flight
              </p>
            </div>
          )}

          {step === 'passengers' && selectedFlight && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('results')}
                className="text-sm text-[#00897B] flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Back to results
              </button>

              <div className="bg-[#E0F2F1] rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-[#1A1A1A]">
                    {selectedFlight.airlineName} {selectedFlight.flightNumber}
                  </span>
                  <Badge className="bg-[#00897B] text-white">{selectedFlight.cabin}</Badge>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-[#1A1A1A]">{selectedFlight.departure}</p>
                    <p className="text-[#757575]">{selectedFlight.fromCode} - {selectedFlight.fromCity}</p>
                  </div>
                  <Plane className="h-4 w-4 text-[#00897B]" />
                  <div className="text-right">
                    <p className="font-bold text-[#1A1A1A]">{selectedFlight.arrival}</p>
                    <p className="text-[#757575]">{selectedFlight.toCode} - {selectedFlight.toCity}</p>
                  </div>
                </div>
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
                      placeholder="Full name (as per ID or passport)"
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
                    <Select
                      value={p.type}
                      onValueChange={(v) => updatePassenger(idx, 'type', v)}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="adult">Adult (12+)</SelectItem>
                        <SelectItem value="child">Child (2-11) - 25% off</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-[#757575]">Base price per adult</span>
                  <span className="text-[#1A1A1A]">{formatMoney(selectedFlight.priceCents)}</span>
                </div>
                <div className="flex justify-between text-xs">
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

          {step === 'confirm' && selectedFlight && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-[#1A1A1A]">
                  {formatMoney(totalCents(selectedFlight, passengers).toString())}
                </p>
                <p className="text-sm text-[#757575]">
                  {selectedFlight.airlineName} - {selectedFlight.flightNumber} - {passengers.length} passenger(s)
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <Row label="From" value={`${selectedFlight.fromCode} - ${selectedFlight.fromCity}`} />
                <Row label="To" value={`${selectedFlight.toCode} - ${selectedFlight.toCity}`} />
                <Row label="Date" value={date} />
                <Row label="Departure" value={selectedFlight.departure} />
                <Row label="Arrival" value={selectedFlight.arrival} />
                <Row label="Duration" value={selectedFlight.duration} />
                <Row label="Aircraft" value={selectedFlight.aircraft} />
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
                <h3 className="text-lg font-bold text-[#1A1A1A]">E-Ticket Issued</h3>
                <p className="text-xs text-[#757575]">Your flight booking is confirmed</p>
              </div>

              {/* Boarding-pass style ticket */}
              <div className="rounded-2xl border-2 border-dashed border-[#00897B]/40 overflow-hidden">
                <div className="bg-[#00897B] text-white p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] opacity-80">BOOKING REF (PNR)</p>
                    <p className="text-lg font-mono font-bold tracking-widest">{booking.bookingRef}</p>
                  </div>
                  <Plane className="h-6 w-6" />
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-[#757575]">{booking.flight.fromCode}</p>
                      <p className="text-xl font-bold text-[#1A1A1A]">{booking.flight.departure}</p>
                      <p className="text-[10px] text-[#757575]">{booking.flight.fromCity}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Plane className="h-4 w-4 text-[#00897B]" />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-[#757575]">{booking.flight.toCode}</p>
                      <p className="text-xl font-bold text-[#1A1A1A]">{booking.flight.arrival}</p>
                      <p className="text-[10px] text-[#757575]">{booking.flight.toCity}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Info2 label="Flight" value={`${booking.flight.airlineCode} ${booking.flight.flightNumber}`} />
                    <Info2 label="Date" value={formatDate(date)} />
                    <Info2 label="Duration" value={booking.flight.duration} />
                    <Info2 label="Aircraft" value={booking.flight.aircraft} />
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3">
                    <p className="text-[10px] text-[#757575] mb-1">E-TICKET NUMBER (IATA 13-digit)</p>
                    <p className="text-sm font-mono font-bold text-[#00897B]">{booking.eTicketNumber}</p>
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3">
                    <p className="text-[10px] text-[#757575] mb-1">PASSENGERS</p>
                    <div className="space-y-1">
                      {booking.passengers.map((p) => (
                        <div key={p.sequence} className="flex items-center justify-between text-xs">
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{p.name}</p>
                            <p className="text-[10px] text-[#757575]">ID: {p.idNumber} - {p.type}</p>
                          </div>
                          <span className="font-mono text-[10px] text-[#00897B]">#{p.eTicketNumber.slice(-6)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3 flex items-center gap-3">
                    <div className="w-16 h-16 bg-white border border-gray-300 rounded-md flex items-center justify-center">
                      <QrCode className="h-12 w-12 text-[#1A1A1A]" />
                    </div>
                    <div className="text-xs text-[#757575]">
                      <p className="font-medium text-[#1A1A1A]">Scan at check-in</p>
                      <p>Present this QR code at the airport counter or self-service kiosk.</p>
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

              {/* IATA explainer */}
              <div className="bg-blue-50 rounded-xl p-3 flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-blue-900">
                  <span className="font-semibold">IATA E-Ticket Standard.</span>{' '}
                  The 13-digit e-ticket number follows IATA Resolution 722f: the first 3 digits
                  are the issuing airline&apos;s IATA code ({booking.flight.airlineCode} = {booking.flight.airlineName}),
                  followed by a 10-digit serial with a Luhn check digit. The 6-character PNR
                  uniquely identifies your booking record.
                </p>
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

function totalCents(flight: Flight, passengers: PassengerForm[]): bigint {
  return passengers.reduce((sum, p) => {
    const base = BigInt(flight.priceCents)
    return sum + (p.type === 'child' ? BigInt(Math.round(Number(base) * 0.75)) : base)
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
