'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Check,
  Loader2,
  Calendar,
  MapPin,
  ChevronRight,
  Ticket,
  Film,
  Music,
  Users
} from 'lucide-react'

interface EventsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'list' | 'details' | 'tickets' | 'confirm' | 'success'

interface Event {
  id: string
  title: string
  venue: string
  date: string
  time: string
  price: number
  type: 'movie' | 'concert' | 'sports' | 'theatre'
  image: string
}

const mockEvents: Event[] = [
  { id: '1', title: 'Avengers: New Era', venue: 'Ster-Kinekor Sandton', date: '2025-05-15', time: '19:30', price: 120, type: 'movie', image: '🎬' },
  { id: '2', title: 'Concert: Amapiano Nights', venue: 'Sun Arena', date: '2025-05-20', time: '20:00', price: 350, type: 'concert', image: '🎵' },
  { id: '3', title: 'Kaizer Chiefs vs Pirates', venue: 'FNB Stadium', date: '2025-05-25', time: '15:00', price: 200, type: 'sports', image: '⚽' },
  { id: '4', title: 'Lion King Musical', venue: 'Teatro Montecasino', date: '2025-05-18', time: '14:00', price: 450, type: 'theatre', image: '🎭' },
]

export function EventsModal({ open, onOpenChange }: EventsModalProps) {
  const [step, setStep] = useState<Step>('list')
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [ticketCount, setTicketCount] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [bookingId, setBookingId] = useState('')

  const handleBook = useCallback(async () => {
    if (!selectedEvent) return
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setBookingId(`EVT${Date.now().toString(36).toUpperCase()}`)
    setStep('success')
    setIsLoading(false)
  }, [selectedEvent])

  const handleClose = useCallback(() => {
    setStep('list')
    setSelectedEvent(null)
    setTicketCount(1)
    onOpenChange(false)
  }, [onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Events & Movies</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'list' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="text-xs">All</Button>
                <Button variant="outline" size="sm" className="text-xs"><Film className="h-3 w-3 mr-1" />Movies</Button>
                <Button variant="outline" size="sm" className="text-xs"><Music className="h-3 w-3 mr-1" />Concerts</Button>
                <Button variant="outline" size="sm" className="text-xs"><Users className="h-3 w-3 mr-1" />Sports</Button>
              </div>

              <div className="space-y-3">
                {mockEvents.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => {
                      setSelectedEvent(event)
                      setStep('details')
                    }}
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-[#00897B] text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                        {event.image}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-[#1A1A1A]">{event.title}</p>
                        <p className="text-xs text-[#757575] flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {event.venue}
                        </p>
                        <p className="text-xs text-[#757575] flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {event.date} • {event.time}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#00897B]">R{event.price}</p>
                        <ChevronRight className="h-5 w-5 text-gray-400 mt-2" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && selectedEvent && (
            <div className="space-y-4">
              <button onClick={() => setStep('list')} className="text-sm text-[#00897B]">
                ← Back to events
              </button>

              <div className="bg-[#E0F2F1] rounded-xl p-6 text-center">
                <span className="text-4xl">{selectedEvent.image}</span>
                <h3 className="text-lg font-bold text-[#1A1A1A] mt-2">{selectedEvent.title}</h3>
                <Badge className="mt-2 bg-[#00897B]/10 text-[#00897B] border-0 capitalize">
                  {selectedEvent.type}
                </Badge>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-[#1A1A1A]">{selectedEvent.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-[#1A1A1A]">{selectedEvent.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[#757575]">Time: {selectedEvent.time}</span>
                </div>
              </div>

              <div className="bg-[#E0F2F1] rounded-xl p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Price per ticket</span>
                  <span className="text-lg font-bold text-[#00897B]">R {selectedEvent.price}</span>
                </div>
              </div>

              <Button
                onClick={() => setStep('tickets')}
                className="w-full bg-[#00897B] hover:bg-[#00695C]"
              >
                Buy Tickets
              </Button>
            </div>
          )}

          {step === 'tickets' && selectedEvent && (
            <div className="space-y-4">
              <button onClick={() => setStep('details')} className="text-sm text-[#00897B]">
                ← Back
              </button>

              <h3 className="text-sm font-semibold text-[#1A1A1A]">Select number of tickets</h3>

              <div className="flex items-center justify-center gap-4 py-4">
                <button
                  onClick={() => setTicketCount(Math.max(1, ticketCount - 1))}
                  className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-xl font-bold hover:bg-gray-200"
                >
                  -
                </button>
                <span className="text-3xl font-bold text-[#1A1A1A] w-16 text-center">{ticketCount}</span>
                <button
                  onClick={() => setTicketCount(ticketCount + 1)}
                  className="w-12 h-12 rounded-full bg-[#00897B] flex items-center justify-center text-xl font-bold text-white hover:bg-[#00695C]"
                >
                  +
                </button>
              </div>

              <div className="bg-[#E0F2F1] rounded-xl p-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-[#757575]">{ticketCount} ticket{ticketCount > 1 ? 's' : ''}</span>
                  <span className="text-sm text-[#1A1A1A]">R {selectedEvent.price} each</span>
                </div>
                <div className="flex justify-between border-t border-[#00897B]/20 pt-2 mt-2">
                  <span className="text-sm font-bold text-[#1A1A1A]">Total</span>
                  <span className="text-xl font-bold text-[#00897B]">R {selectedEvent.price * ticketCount}</span>
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

          {step === 'confirm' && selectedEvent && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-[#1A1A1A]">
                  R {selectedEvent.price * ticketCount}
                </p>
                <p className="text-sm text-[#757575]">{ticketCount} ticket{ticketCount > 1 ? 's' : ''} • {selectedEvent.title}</p>
              </div>

              <Button
                onClick={handleBook}
                disabled={isLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Booking'}
              </Button>

              <Button variant="outline" onClick={() => setStep('tickets')} className="w-full">
                Back
              </Button>
            </div>
          )}

          {step === 'success' && selectedEvent && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-4">
                <Ticket className="h-10 w-10 text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Booking Confirmed!</h3>
              <p className="text-sm text-[#757575] mb-4">
                {ticketCount} ticket{ticketCount > 1 ? 's' : ''} for {selectedEvent.title}
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-[#757575] mb-1">Booking Reference</p>
                <p className="text-lg font-mono font-bold text-[#00897B]">{bookingId}</p>
              </div>
              <div className="flex items-center justify-center gap-2 p-3 bg-[#E0F2F1] rounded-xl mb-4">
                <Ticket className="h-5 w-5 text-[#00897B]" />
                <span className="text-sm font-medium text-[#00897B]">Show QR at venue</span>
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
