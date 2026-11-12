'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  X,
  Check,
  Loader2,
  Plane,
  ArrowRight,
  Calendar,
  Users,
  ChevronRight
} from 'lucide-react'

interface FlightsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type Step = 'search' | 'results' | 'details' | 'passenger' | 'confirm' | 'success'

const airports = [
  { code: 'JNB', name: 'Johannesburg - OR Tambo' },
  { code: 'CPT', name: 'Cape Town International' },
  { code: 'DUR', name: 'Durban - King Shaka' },
  { code: 'PLZ', name: 'Port Elizabeth' },
  { code: 'ELS', name: 'East London' },
]

const mockFlights = [
  { id: '1', airline: 'SAA', from: 'JNB', to: 'CPT', time: '06:00', arrival: '08:15', price: 1200, class: 'Economy' },
  { id: '2', airline: 'FlySafair', from: 'JNB', to: 'CPT', time: '07:30', arrival: '09:45', price: 850, class: 'Economy' },
  { id: '3', airline: 'kulula', from: 'JNB', to: 'CPT', time: '09:00', arrival: '11:15', price: 920, class: 'Economy' },
]

export function FlightsModal({ open, onOpenChange }: FlightsModalProps) {
  const [step, setStep] = useState<Step>('search')
  const [fromAirport, setFromAirport] = useState('')
  const [toAirport, setToAirport] = useState('')
  const [date, setDate] = useState('')
  const [passengers, setPassengers] = useState(1)
  const [selectedFlight, setSelectedFlight] = useState<typeof mockFlights[0] | null>(null)
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
    setFromAirport('')
    setToAirport('')
    setDate('')
    setPassengers(1)
    setSelectedFlight(null)
    onOpenChange(false)
  }, [onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center sm:items-center">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1A1A1A]">Book Flights</h2>
          <button onClick={handleClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {step === 'search' && (
            <div className="space-y-4">
              <div className="relative">
                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-[#757575]">From</label>
                    <select
                      value={fromAirport}
                      onChange={(e) => setFromAirport(e.target.value)}
                      className="w-full h-12 px-3 border border-gray-200 rounded-xl mt-1"
                    >
                      <option value="">Select departure airport</option>
                      {airports.map((airport) => (
                        <option key={airport.code} value={airport.code}>
                          {airport.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-gray-500 rotate-90" />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-[#757575]">To</label>
                    <select
                      value={toAirport}
                      onChange={(e) => setToAirport(e.target.value)}
                      className="w-full h-12 px-3 border border-gray-200 rounded-xl mt-1"
                    >
                      <option value="">Select destination airport</option>
                      {airports.map((airport) => (
                        <option key={airport.code} value={airport.code}>
                          {airport.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#757575]">Date</label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-12 mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#757575]">Passengers</label>
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(parseInt(e.target.value))}
                    className="w-full h-12 px-3 border border-gray-200 rounded-xl mt-1"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n} passenger{n > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>
              </div>

              <Button
                onClick={handleSearch}
                disabled={!fromAirport || !toAirport || !date || isLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Search Flights'}
              </Button>
            </div>
          )}

          {step === 'results' && (
            <div className="space-y-4">
              <button onClick={() => setStep('search')} className="text-sm text-[#00897B]">
                ← Modify search
              </button>

              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                <span className="text-sm font-medium">{fromAirport} → {toAirport}</span>
                <Badge variant="outline">{passengers} passenger{passengers > 1 ? 's' : ''}</Badge>
              </div>

              <div className="space-y-3">
                {mockFlights.map((flight) => (
                  <button
                    key={flight.id}
                    onClick={() => {
                      setSelectedFlight(flight)
                      setStep('details')
                    }}
                    className="w-full p-4 bg-white border border-gray-200 rounded-xl hover:border-[#00897B] text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-[#1A1A1A]">{flight.airline}</span>
                      <span className="text-lg font-bold text-[#00897B]">R {flight.price}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div>
                        <p className="text-lg font-bold">{flight.time}</p>
                        <p className="text-xs text-[#757575]">{flight.from}</p>
                      </div>
                      <div className="flex-1 border-t border-dashed border-gray-300" />
                      <Plane className="h-4 w-4 text-gray-400" />
                      <div className="flex-1 border-t border-dashed border-gray-300" />
                      <div className="text-right">
                        <p className="text-lg font-bold">{flight.arrival}</p>
                        <p className="text-xs text-[#757575]">{flight.to}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'details' && selectedFlight && (
            <div className="space-y-4">
              <button onClick={() => setStep('results')} className="text-sm text-[#00897B]">
                ← Back to results
              </button>

              <div className="bg-[#E0F2F1] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-[#1A1A1A]">{selectedFlight.airline}</span>
                  <Badge className="bg-[#00897B] text-white">{selectedFlight.class}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{selectedFlight.time}</p>
                    <p className="text-sm text-[#757575]">{selectedFlight.from}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00897B]" />
                    <div className="w-20 h-0.5 bg-[#00897B]" />
                    <Plane className="h-4 w-4 text-[#00897B]" />
                    <div className="w-20 h-0.5 bg-[#00897B]" />
                    <div className="w-2 h-2 rounded-full bg-[#00897B]" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{selectedFlight.arrival}</p>
                    <p className="text-sm text-[#757575]">{selectedFlight.to}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Date</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">{date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Passengers</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">{passengers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#757575]">Price per ticket</span>
                  <span className="text-sm font-medium text-[#1A1A1A]">R {selectedFlight.price}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-[#1A1A1A]">Total</span>
                    <span className="text-lg font-bold text-[#00897B]">R {selectedFlight.price * passengers}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={() => setStep('passenger')}
                className="w-full bg-[#00897B] hover:bg-[#00695C]"
              >
                Continue to Booking
              </Button>
            </div>
          )}

          {step === 'passenger' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-[#1A1A1A]">Passenger Details</h3>

              <div className="space-y-3">
                <Input placeholder="Full name (as per ID)" className="h-12" />
                <Input placeholder="ID Number" className="h-12" />
                <Input placeholder="Email address" type="email" className="h-12" />
                <Input placeholder="Phone number" type="tel" className="h-12" />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('details')} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => setStep('confirm')} className="flex-1 bg-[#00897B] hover:bg-[#00695C]">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 'confirm' && selectedFlight && (
            <div className="space-y-4">
              <div className="text-center mb-4">
                <p className="text-3xl font-bold text-[#1A1A1A]">R {(selectedFlight.price * passengers).toLocaleString()}</p>
                <p className="text-sm text-[#757575]">{selectedFlight.airline} • {fromAirport} → {toAirport}</p>
              </div>

              <Button
                onClick={handleBook}
                disabled={isLoading}
                className="w-full bg-[#00897B] hover:bg-[#00695C] h-12"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirm Booking'}
              </Button>

              <Button variant="outline" onClick={() => setStep('passenger')} className="w-full">
                Back
              </Button>
            </div>
          )}

          {step === 'success' && selectedFlight && (
            <div className="text-center py-6">
              <div className="w-20 h-20 rounded-full bg-[#4CAF50]/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-10 w-10 text-[#4CAF50]" />
              </div>
              <h3 className="text-xl font-bold text-[#1A1A1A] mb-2">Booking Confirmed!</h3>
              <p className="text-sm text-[#757575] mb-4">
                Your flight has been booked successfully
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-[#757575] mb-1">Booking Reference</p>
                <p className="text-lg font-mono font-bold text-[#00897B]">FLT{Date.now().toString(36).toUpperCase()}</p>
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
