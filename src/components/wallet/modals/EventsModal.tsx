'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
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
  ArrowLeft,
  AlertCircle,
  Ticket,
  QrCode,
  Calendar,
  MapPin,
  Clock,
  ChevronRight,
  Minus,
  Plus,
} from 'lucide-react'

interface EventsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Category {
  value: string
  label: string
  icon: string
  desc: string
}
interface TicketType {
  value: string
  label: string
  desc: string
  multiplier: number
}
interface EventItem {
  id: string
  category: string
  type: string
  title: string
  venue: string
  venueId: string
  city: string
  date: string
  dateLabel: string
  time: string
  durationMinutes: number
  ageRating: string
  image: string
  description: string
  basePriceCents: string
  availableTickets: number
  seatMap: boolean
}

interface BookingResult {
  ticketNo: string
  qrCode: string
  receiptNo: string
  event: {
    id: string
    title: string
    venue: string
    city: string
    date: string
    dateLabel: string
    time: string
    durationMinutes: number
    ageRating: string
    category: string
    image: string
  }
  ticketType: { value: string; label: string; desc: string }
  tickets: Array<{
    sequence: number
    seat: string | null
    ticketType: string
    ticketTypeLabel: string
    holderName: string | null
    entryCode: string
  }>
  totalAmount: string
  unitPrice: string
  currency: string
  transactionId: string
  notice: string
}

type Step = 'list' | 'details' | 'tickets' | 'confirm' | 'result'

export function EventsModal({ open, onOpenChange }: EventsModalProps) {
  const [step, setStep] = useState<Step>('list')
  const [categories, setCategories] = useState<Category[]>([])
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [events, setEvents] = useState<EventItem[]>([])
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [eventsLoading, setEventsLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null)
  const [ticketType, setTicketType] = useState<string>('regular')
  const [quantity, setQuantity] = useState<number>(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booking, setBooking] = useState<BookingResult | null>(null)

  useEffect(() => {
    if (!open) return
    let cancelled = false
    async function loadEvents() {
      setEventsLoading(true)
      try {
        const res = await apiGet<{
          categories: Category[]
          ticketTypes: TicketType[]
          events: EventItem[]
        }>('/events')
        if (cancelled) return
        if (Array.isArray(res.categories)) setCategories(res.categories)
        if (Array.isArray(res.ticketTypes)) setTicketTypes(res.ticketTypes)
        if (Array.isArray(res.events)) setEvents(res.events)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setEventsLoading(false)
      }
    }
    loadEvents()
    return () => {
      cancelled = true
    }
  }, [open])

  const filteredEvents = useMemo(() => {
    if (activeCategory === 'all') return events
    return events.filter((e) => e.category === activeCategory)
  }, [events, activeCategory])

  const handleCategoryChange = useCallback(async (cat: string) => {
    setActiveCategory(cat)
    setEventsLoading(true)
    try {
      const path = cat === 'all' ? '/events' : `/events?category=${encodeURIComponent(cat)}`
      const res = await apiGet<{ events: EventItem[] }>(path)
      if (Array.isArray(res.events)) setEvents(res.events)
    } catch {
      // ignore
    } finally {
      setEventsLoading(false)
    }
  }, [])

  const handleBook = useCallback(async () => {
    if (!selectedEvent) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await apiPost<BookingResult>('/events', {
        eventId: selectedEvent.id,
        ticketType,
        quantity,
      })
      setBooking(res)
      setStep('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Booking failed')
    } finally {
      setIsLoading(false)
    }
  }, [selectedEvent, ticketType, quantity])

  const handleClose = useCallback(() => {
    setStep('list')
    setActiveCategory('all')
    setSelectedEvent(null)
    setTicketType('regular')
    setQuantity(1)
    setError(null)
    setBooking(null)
    onOpenChange(false)
  }, [onOpenChange])


  const selectedTicketType = ticketTypes.find((t) => t.value === ticketType)
  const unitPriceCents = useMemo(() => {
    if (!selectedEvent || !selectedTicketType) return BigInt(0)
    return BigInt(Math.round(Number(selectedEvent.basePriceCents) * selectedTicketType.multiplier))
  }, [selectedEvent, selectedTicketType])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-lg max-h-[92vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Events & Entertainment</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100" aria-label="Close">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'list' && (
            <div className="space-y-4">
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                <CategoryPill
                  active={activeCategory === 'all'}
                  onClick={() => handleCategoryChange('all')}
                  icon="*"
                  label="All"
                />
                {categories.map((c) => (
                  <CategoryPill
                    key={c.value}
                    active={activeCategory === c.value}
                    onClick={() => handleCategoryChange(c.value)}
                    icon={c.icon}
                    label={c.label}
                  />
                ))}
              </div>

              {eventsLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 text-[#00897B] animate-spin" />
                </div>
              )}

              {!eventsLoading && filteredEvents.length === 0 && (
                <p className="text-sm text-[#757575] text-center py-8">
                  No events available in this category.
                </p>
              )}

              <div className="grid grid-cols-1 gap-3">
                {filteredEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event)
                      setStep('details')
                    }}
                    className="w-full p-3 bg-white border border-gray-200 rounded-xl hover:border-[#00897B] text-left flex items-center gap-3"
                  >
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB] flex items-center justify-center text-2xl flex-shrink-0">
                      {event.image}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-[#1A1A1A] truncate">{event.title}</p>
                      <p className="text-xs text-[#757575] flex items-center gap-1 truncate">
                        <MapPin className="h-3 w-3 flex-shrink-0" /> {event.venue}, {event.city}
                      </p>
                      <p className="text-xs text-[#757575] flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {event.dateLabel}
                        <Clock className="h-3 w-3 ml-1" /> {event.time}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#00897B]">
                        {formatMoney(event.basePriceCents)}
                      </p>
                      <Badge variant="outline" className="text-[10px] mt-1">
                        {event.ageRating}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-gray-400 ml-auto mt-1" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && selectedEvent && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('list')}
                className="text-sm text-[#00897B] flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Back to events
              </button>

              <div className="bg-gradient-to-br from-[#E0F2F1] to-[#B2DFDB] rounded-xl p-6 text-center">
                <span className="text-5xl">{selectedEvent.image}</span>
                <h3 className="text-lg font-bold text-[#1A1A1A] mt-2">{selectedEvent.title}</h3>
                <Badge className="mt-2 bg-[#00897B]/10 text-[#00897B] border-0 capitalize">
                  {selectedEvent.category}
                </Badge>
              </div>

              <p className="text-sm text-[#757575]">{selectedEvent.description}</p>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <Row icon={<MapPin className="h-4 w-4" />} label="Venue" value={`${selectedEvent.venue}, ${selectedEvent.city}`} />
                <Row icon={<Calendar className="h-4 w-4" />} label="Date" value={selectedEvent.dateLabel} />
                <Row icon={<Clock className="h-4 w-4" />} label="Time" value={selectedEvent.time} />
                <Row icon={<Ticket className="h-4 w-4" />} label="Age" value={selectedEvent.ageRating} />
                <Row icon={<Clock className="h-4 w-4" />} label="Runtime" value={`${Math.floor(selectedEvent.durationMinutes / 60)}h ${selectedEvent.durationMinutes % 60}m`} />
              </div>

              <div className="bg-[#E0F2F1] rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#757575]">From</p>
                  <p className="text-xl font-bold text-[#00897B]">{formatMoney(selectedEvent.basePriceCents)}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {selectedEvent.availableTickets} tickets left
                </Badge>
              </div>

              <Button
                onClick={() => setStep('tickets')}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                Choose tickets
              </Button>
            </div>
          )}

          {step === 'tickets' && selectedEvent && (
            <div className="space-y-4">
              <button
                onClick={() => setStep('details')}
                className="text-sm text-[#00897B] flex items-center gap-1"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>

              <h3 className="text-sm font-semibold text-[#1A1A1A]">Ticket type</h3>

              <div className="space-y-2">
                {ticketTypes.map((tt) => {
                  const price = BigInt(
                    Math.round(Number(selectedEvent.basePriceCents) * tt.multiplier)
                  )
                  return (
                    <button
                      key={tt.value}
                      onClick={() => setTicketType(tt.value)}
                      className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                        ticketType === tt.value
                          ? 'border-[#00897B] bg-[#E0F2F1]'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-[#1A1A1A]">{tt.label}</p>
                          <p className="text-xs text-[#757575]">{tt.desc}</p>
                        </div>
                        <span className="text-sm font-bold text-[#00897B]">{formatMoney(price)}</span>
                      </div>
                    </button>
                  )
                })}
              </div>

              <h3 className="text-sm font-semibold text-[#1A1A1A] pt-2">Quantity</h3>

              <div className="flex items-center justify-center gap-4 py-2">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                  aria-label="Decrease"
                >
                  <Minus className="h-5 w-5 text-gray-700" />
                </button>
                <span className="text-3xl font-bold text-[#1A1A1A] w-16 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                  className="w-12 h-12 rounded-full bg-[#00897B] flex items-center justify-center hover:bg-[#00695C]"
                  aria-label="Increase"
                >
                  <Plus className="h-5 w-5 text-white" />
                </button>
              </div>

              <div className="bg-[#E0F2F1] rounded-xl p-4">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-[#757575]">{quantity} x {selectedTicketType?.label ?? 'Regular'}</span>
                  <span className="text-[#1A1A1A]">{formatMoney(unitPriceCents.toString())} each</span>
                </div>
                <div className="flex justify-between border-t border-[#00897B]/20 pt-2">
                  <span className="text-sm font-bold text-[#1A1A1A]">Total</span>
                  <span className="text-xl font-bold text-[#00897B]">
                    {formatMoney((unitPriceCents * BigInt(quantity)).toString())}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setStep('confirm')}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                Continue to payment
              </Button>
            </div>
          )}

          {step === 'confirm' && selectedEvent && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-[#1A1A1A]">
                  {formatMoney((unitPriceCents * BigInt(quantity)).toString())}
                </p>
                <p className="text-sm text-[#757575]">
                  {quantity} x {selectedTicketType?.label} - {selectedEvent.title}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <Row icon={<MapPin className="h-4 w-4" />} label="Venue" value={`${selectedEvent.venue}, ${selectedEvent.city}`} />
                <Row icon={<Calendar className="h-4 w-4" />} label="Date" value={selectedEvent.dateLabel} />
                <Row icon={<Clock className="h-4 w-4" />} label="Time" value={selectedEvent.time} />
                <Row icon={<Ticket className="h-4 w-4" />} label="Ticket" value={selectedTicketType?.label ?? 'Regular'} />
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

              <Button variant="outline" onClick={() => setStep('tickets')} className="w-full">
                Back
              </Button>
            </div>
          )}

          {step === 'result' && booking && (
            <div className="space-y-4">
              <div className="text-center py-2">
                <div className="w-14 h-14 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-2">
                  <Check className="h-7 w-7 text-[#4CAF50]" />
                </div>
                <h3 className="text-lg font-bold text-[#1A1A1A]">Tickets Confirmed</h3>
                <p className="text-xs text-[#757575]">{booking.tickets.length} ticket(s) issued</p>
              </div>

              <div className="rounded-2xl border-2 border-dashed border-[#00897B]/40 overflow-hidden">
                <div className="bg-[#00897B] text-white p-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] opacity-80">TICKET NUMBER</p>
                    <p className="text-lg font-mono font-bold tracking-widest">{booking.ticketNo}</p>
                  </div>
                  <Ticket className="h-6 w-6" />
                </div>

                <div className="p-4 space-y-3">
                  <div className="text-center">
                    <span className="text-4xl">{booking.event.image}</span>
                    <p className="text-base font-bold text-[#1A1A1A] mt-1">{booking.event.title}</p>
                    <Badge className="mt-1 bg-[#00897B]/10 text-[#00897B] border-0 capitalize">
                      {booking.event.category}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <Info2 label="Venue" value={booking.event.venue} />
                    <Info2 label="City" value={booking.event.city} />
                    <Info2 label="Date" value={booking.event.dateLabel} />
                    <Info2 label="Time" value={booking.event.time} />
                    <Info2 label="Age" value={booking.event.ageRating} />
                    <Info2 label="Type" value={booking.ticketType.label} />
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3">
                    <p className="text-[10px] text-[#757575] mb-1">TICKETS & SEATS</p>
                    <div className="space-y-1">
                      {booking.tickets.map((t) => (
                        <div key={t.sequence} className="flex items-center justify-between text-xs">
                          <div>
                            <p className="font-medium text-[#1A1A1A]">
                              #{t.sequence} {t.ticketTypeLabel}
                            </p>
                            <p className="text-[10px] text-[#757575] font-mono">{t.entryCode}</p>
                          </div>
                          {t.seat && (
                            <Badge variant="outline" className="text-[10px]">Seat {t.seat}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-dashed border-gray-200 pt-3 flex items-center gap-3">
                    <div className="w-20 h-20 bg-white border border-gray-300 rounded-md flex items-center justify-center">
                      <QrCode className="h-14 w-14 text-[#1A1A1A]" />
                    </div>
                    <div className="text-xs text-[#757575]">
                      <p className="font-medium text-[#1A1A1A]">Entry QR</p>
                      <p>Scan at the venue entrance. Valid only for the date and time shown above.</p>
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

function CategoryPill({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: string
  label: string
}) {
  return (
    <button
      onClick={onClick}
      className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-[#00897B] text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <span className="mr-1">{icon}</span>
      {label}
    </button>
  )
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-gray-400 flex-shrink-0">{icon}</span>
      <span className="text-xs text-[#757575] w-20">{label}</span>
      <span className="text-sm text-[#1A1A1A] flex-1 text-right">{value}</span>
    </div>
  )
}

function Info2({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] text-[#757575]">{label}</p>
      <p className="text-sm font-medium text-[#1A1A1A] truncate">{value}</p>
    </div>
  )
}
