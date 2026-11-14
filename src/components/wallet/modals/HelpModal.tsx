'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HelpCircle, Sparkles, Send, Phone, Mail, MessageSquare, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const faqs = [
  { q: 'How do I send money to another Groway user?', a: 'Tap "Send" on the home screen, enter the recipient\'s phone number, enter the amount, and confirm with your PIN. The transfer is instant and free.' },
  { q: 'How do I buy electricity?', a: 'Go to Services > Bills > Electricity. Select your provider (Eskom, City Power, etc.), enter your meter number, choose an amount, and you\'ll receive a 20-digit STS token instantly.' },
  { q: 'What is Pay+ and how does it work?', a: 'Pay+ is a short-term cash advance backed by your earned wages. You pay a flat service fee (not interest) — this is NCR compliant. Select your bank, enter the amount, accept the terms, and confirm with OTP.' },
  { q: 'How do I apply for a loan?', a: 'Go to Services > Credit. Select the loan type, purpose, amount and term. We\'ll check your affordability and credit score instantly. If pre-qualified, you\'ll see your approved amount and monthly instalment.' },
  { q: 'What is BNPL (Buy Now Pay Later)?', a: 'BNPL lets you buy now and pay later in instalments. Choose a provider (PayJustNow, MobiCred, Payflex), enter the purchase amount, and you\'ll see the instalment schedule. 0% interest with most providers.' },
  { q: 'How do I send money abroad?', a: 'Go to Services > Send Abroad. Select the destination country, enter the amount in ZAR, choose a collection method (bank, mobile money, cash pickup), and enter the recipient details. We show live FX rates and fees upfront.' },
  { q: 'How do I save money?', a: 'Go to Services > Savings. You can create a goal-based pocket, a flexible pocket, a fixed deposit, or join a stokvel. Set up auto-save to round up transactions and save automatically.' },
  { q: 'Is my money safe?', a: 'Yes. Your wallet is protected by PIN, biometric login, and 2FA. All transactions are encrypted and monitored for fraud. Your money is held in a trust account regulated by SARB.' },
]

export function HelpModal({ open, onOpenChange }: Props) {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0)
  const [groaiQuery, setGroaiQuery] = useState('')
  const [groaiResponse, setGroaiResponse] = useState('')

  const askGroAI = () => {
    if (!groaiQuery.trim()) return
    const q = groaiQuery.toLowerCase()
    let response = ''
    if (q.includes('send') || q.includes('transfer')) response = 'To send money: tap "Send" on the home screen, enter the recipient\'s phone number, enter the amount, and confirm with your PIN. Transfers between Groway users are instant and free.'
    else if (q.includes('electricity') || q.includes('token')) response = 'To buy electricity: go to Services > Bills > Electricity, select your provider, enter your meter number (11 or 20 digits), choose an amount, and you\'ll get a 20-digit STS token to enter into your meter.'
    else if (q.includes('loan') || q.includes('credit')) response = 'To apply for a loan: go to Services > Credit, fill in the form with your loan type, purpose, amount, employment status and income. We\'ll check your eligibility and show you if you\'re pre-qualified instantly.'
    else if (q.includes('save') || q.includes('savings')) response = 'To save money: go to Services > Savings and create a savings pocket. You can choose goal-based, flexible, fixed deposit, stokvel, or auto-save. GroAI can suggest how much to save based on your spending patterns.'
    else if (q.includes('insurance')) response = 'To buy insurance: go to Services > Insurance, choose a category (funeral, life, health, vehicle, etc.), select a provider, and enter your details. No credit score is required for insurance.'
    else if (q.includes('pay') || q.includes('advance')) response = 'Pay+ is a short-term cash advance backed by earned wages. Go to Services > Pay+, select your bank, enter the amount, accept the terms (it\'s a service fee, not interest — NCR compliant), and confirm with OTP.'
    else if (q.includes('abroad') || q.includes('remittance') || q.includes('send')) response = 'To send money abroad: go to Services > Send Abroad, select the destination country, enter the amount, choose a collection method (bank, mobile money, cash pickup), and enter recipient details. We show live FX rates.'
    else response = 'I can help with sending money, buying electricity/airtime, applying for loans, insurance, BNPL, Pay+, Grant+, savings, sending money abroad, and more. Ask me a specific question!'
    setGroaiResponse(response)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><HelpCircle className="h-5 w-5 text-[#00897B]" /> Help & Support</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* GroAI Chat */}
          <Card className="border-[#00897B]/20 bg-[#00897B]/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-[#00897B]" />
                <span className="text-sm font-semibold text-[#00897B]">Ask GroAI</span>
              </div>
              <p className="text-xs text-[#757575] mb-3">Get instant answers about any Groway Wallet feature</p>
              <div className="flex gap-2">
                <Input value={groaiQuery} onChange={(e) => setGroaiQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && askGroAI()} placeholder="Ask a question..." />
                <Button size="icon" className="bg-[#00897B] hover:bg-[#00897B]/90" onClick={askGroAI}><Send className="h-4 w-4" /></Button>
              </div>
              {groaiResponse && (
                <div className="mt-3 p-3 bg-white rounded-lg">
                  <p className="text-xs text-[#1A1A1A]">{groaiResponse}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* FAQ */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Frequently Asked Questions</h3>
            <div className="space-y-1">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50">
                    <span className="text-sm font-medium text-[#1A1A1A]">{faq.q}</span>
                    {expandedFaq === i ? <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                  </button>
                  {expandedFaq === i && (
                    <div className="p-3 pt-0">
                      <p className="text-xs text-[#757575]">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Contact Us</h3>
              <div className="space-y-2">
                <a href="tel:0801234567" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <Phone className="h-4 w-4 text-[#00897B]" />
                  <div><p className="text-sm font-medium">Call us</p><p className="text-xs text-[#757575]">080 123 4567 (toll free)</p></div>
                </a>
                <a href="mailto:support@groway.co.za" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <Mail className="h-4 w-4 text-[#00897B]" />
                  <div><p className="text-sm font-medium">Email us</p><p className="text-xs text-[#757575]">support@groway.co.za</p></div>
                </a>
                <a href="https://wa.me/27800123456" className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                  <MessageSquare className="h-4 w-4 text-[#00897B]" />
                  <div><p className="text-sm font-medium">WhatsApp</p><p className="text-xs text-[#757575]">+27 80 012 3456</p></div>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
