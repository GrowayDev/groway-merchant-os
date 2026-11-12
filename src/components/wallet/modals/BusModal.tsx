'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Check,
  Loader2,
  Bus,
  Calendar,
  MapPin,
  ChevronRight,
  Users,
  Ticket
} from 'lucide-react'

interface BusModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'search' | 'results' | 'seats' | 'details' | 'confirm' | 'success'

const stations = [
  { id: 'jnb', name: 'Johannesburg - Park Station' },
  { id: 'cpt', name: 'Cape Town - Civic Centre' },
  { id: 'dur', name: 'Durban - Warwick Junction' },
  { id: 'ptz', name: 'Pretoria - Bosman Station' },
  { id: 'el', name: 'East London' },
]

const operators = [
  { id: 'greyhound', name: 'Greyhound', color: '#1E3A5F' },
  { id: 'intercape', name: 'Intercape', color: '#00A651' },
  { id: 'eldo', name: 'Eldo Coaches', color: '#E31837' },
  { id: 'citiliner', name: 'Citiliner', color: '#F7931E' },
]

const mockBuses = [
  { id: '1', operator: 'Greyhound', from: 'Johannesburg', to: 'Cape Town', departure: '20:00', arrival: '10:30', price: 450, seats: 12 },
  { id: '2', operator: 'Intercape', from: 'Johannesburg', to: 'Cape Town', departure: '21:00', arrival: '11:45', price: 380, seats: 8 },
  { id: '3', operator: 'Eldo Coaches', from: 'Johannesburg', to: 'Cape Town', departure: '22:00', arrival: '12:00', price: 320, seats: 20 },
]

export function BusModal({ open, onOpenChange }: BusModalProps) {
  const [step, setStep] = useState<Step>('search')
  const [fromStation, setFromStation] = useState('')
  const [toStation, setToStation] = useState('')
  const [date, setDate] = useState('')
  const [selectedBus, setSelectedBus] = useState<typeof mockBuses[0] | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = useCallback(async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setStep('results')
    setIsLoading(false)
  }, [])

  const handleBook = useCallback(async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setStep('success')
    setIsLoading(false)
  }, [])

  const handleClose = useCallback(() => {
    setStep('search')
    setFromStation('')
    setToStation('')
    setDate('')
    setSelectedBus(null)
    setSelectedSeats([])
    onOpenChange(false)
  }, [onOpenChange])

  const toggleSeat = (seat: number) => {
    setSelectedSeats((prev) =>
      prev.includes(seat) ? prev.filter((s) => s !== seat) : [...prev, seat]
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Book Bus Ticket</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'search' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[#757575]">From</label>
                  <select
                    value={fromStation}
                    onChange={(e) => setFromStation(e.target.value)}
                    className="w-full h-12 px-3 border border-gray-200 rounded-xl mt-1"
                  >
                    <option value="">Select departure station</option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#757575]">To</label>
                  <select
                    value={toStation}
                    onChange={(e) => setToStation(e.target.value)}
                    className="w-full h-12 px-3 border border-gray-200 rounded-xl mt-1"
                  >
                    <option value="">Select destination station</option>
                    {stations.map((station) => (
                      <option key={station.id} value={station.id}>
                        {station.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#757575]">Date</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-12 mt-1"
                  />
                </div>
              </div>

              <Button
                onClick={handleSearch}
                disabled={!fromStation || !toStation || !date || isLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search Buses'}
              </Button>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4">
              <button onClick={() => setStep('search')} className="text-sm text-[#00897B]">
                ← Modify search
              </button>

              <div className="space-y-3">
                {mockBuses.map((bus) => (
                  <button
                    key={bus.id}
                    onClick={() => {
                      setSelectedBus(bus)
                      setStep('seats')
                    }}
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-[#00897B] text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-[#1A1A1A]">{bus.operator}</span>
                      <span className="text-lg font-bold text-[#00897B]">R {bus.price}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#757575]">
                      <span>{bus.departure}</span>
                      <span>→</span>
                      <span>{bus.arrival}</span>
                      <Badge variant="outline" className="ml-auto">{bus.seats} seats</Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'seats' && selectedBus && (
            <div className="space-y-4">
              <button onClick={() => setStep('results')} className="text-sm text-[#00897B]">
                ← Back to results
              </button>

              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-sm font-medium text-[#1A1A1A]">{selectedBus.operator}</p>
                <p className="text-xs text-[#757575]">Select your seats</p>
              </div>

              {/* Seat Grid */}
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 16 }, (_, i) => i + 1).map((seat) => (
                  <button
                    key={seat}
                    onClick={() => toggleSeat(seat)}
                    className={`h-10 rounded-lg text-sm font-medium transition-all ${
                      selectedSeats.includes(seat)
                        ? 'bg-[#00897B] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {seat}
                  </button>
                ))}
              </div>

              <div className="bg-[#E0F2F1] rounded-xl p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Selected</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">
                    {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm font-bold text-[#1A1A1A]">Total</span>
                  <span className="text-lg font-bold text-[#00897B]">
                    R {selectedBus.price * selectedSeats.length}
                  </span>
                </div>
              </div>

              <Button
                onClick={() => setStep('details')}
                disabled={selectedSeats.length === 0}
                className="w-full bg-[#00897B] hover:bg-[#00695C]"
              >
                Continue
              </Button>
            </div>
          )}

          {step === 'details' && selectedBus && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Passenger Details</h3>

              {selectedSeats.map((_, index) => (
                <div key={index} className="space-y-2 pb-3 border-b border-gray-100">
                  <p className="text-xs text-[#757575]">Passenger {index + 1}</p>
                  <Input placeholder="Full name" className="h-10" />
                  <Input placeholder="Phone number" type="tel" className="h-10" />
                </div>
              ))}

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('seats')} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep('confirm')} className="flex-1 bg-[#00897B] hover:bg-[#00695C]">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'confirm' && selectedBus && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-[#1A1A1A]">
                  R {selectedBus.price * selectedSeats.length}
                </p>
                <p className="text-sm text-[#757575]">{selectedBus.operator}</p>
              </div>

              <Button
                onClick={handleBook}
                disabled={isLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Booking'}
              </Button>

              <Button variant="outline" onClick={() => setStep('details')} className="w-full">
                Back
              </Button>
            </div>
          )}

          {step === 'success' && selectedBus && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-4">
                <Ticket className="h-10 w-10 text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Booking Confirmed!</h3>
              <p className="text-sm text-[#757575] mb-4">
                {selectedSeats.length} ticket{selectedSeats.length !== 1 ? 's' : ''} booked
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-[#757575] mb-1">Ticket Number</p>
                <p className="text-lg font-mono font-bold text-[#00897B]">BUS{Date.now().toString(36).toUpperCase()}</p>
              </div>
              <div className="flex items-center justify-center gap-2 p-3 bg-[#E0F2F1] rounded-xl mb-4">
                <Ticket className="h-5 w-5 text-[#00897B]" />
                <span className="text-sm font-medium text-[#00897B]">Show QR at boarding</span>
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
