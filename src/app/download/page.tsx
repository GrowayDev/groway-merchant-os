'use client'

import { Download, FileText, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function DownloadPage() {
  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = '/Groway_Investor_Pitch_Deck.pptx'
    link.download = 'Groway_Investor_Pitch_Deck.pptx'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const slides = [
    { title: 'Cover', desc: 'Groway Platform Overview' },
    { title: 'The Problem', desc: "Africa's Financial Fragmentation" },
    { title: 'Our Solution', desc: '4-Pillar Strategy' },
    { title: 'Platform Overview', desc: '9 Integrated Applications' },
    { title: 'Consumer Wallet', desc: '2.5M+ Users' },
    { title: 'Merchant OS', desc: '15K+ Merchants, 12 Verticals' },
    { title: 'Commerce Ecosystem', desc: 'GroSell & GroSupply' },
    { title: 'GoPay', desc: 'Payment Gateway' },
    { title: 'Market Opportunity', desc: '$180B TAM' },
    { title: 'Business Model', desc: '6 Revenue Streams' },
    { title: 'Traction', desc: '280% YoY Growth' },
    { title: 'Financial Projections', desc: 'Path to $120M Revenue' },
    { title: 'Funding Ask', desc: '$5M Series A' },
    { title: 'Closing', desc: 'Contact Information' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#080B14] to-[#050710] flex items-center justify-center p-4 sm:p-8">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#00F5A0] to-[#00D492] rounded-2xl flex items-center justify-center shadow-lg">
            <FileText className="w-10 h-10 text-white" />
          </div>
          
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1A1A] mb-2 text-center">
            Groway Platform
          </h1>
          <p className="text-gray-500 text-center mb-6">
            Investor Pitch Deck • Series A
          </p>
          
          {/* File info */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">PowerPoint Presentation</p>
                <p className="text-sm text-gray-500">14 Slides • 133 KB</p>
              </div>
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Ready</span>
              </div>
            </div>
          </div>
          
          {/* Download Button */}
          <Button 
            onClick={handleDownload}
            className="w-full bg-gradient-to-r from-[#00F5A0] to-[#00D492] hover:from-[#00D492] hover:to-[#00C483] text-[#050710] font-bold py-6 text-lg shadow-lg"
          >
            <Download className="mr-2 h-5 w-5" />
            Download Pitch Deck (PPTX)
          </Button>
          
          {/* Direct link */}
          <p className="text-center text-sm text-gray-400 mt-4">
            Or right-click and save:{' '}
            <a 
              href="/Groway_Investor_Pitch_Deck.pptx" 
              className="text-[#00F5A0] underline hover:text-[#00D492]"
            >
              Direct Download Link
            </a>
          </p>
          
          {/* Back link */}
          <Link href="/" className="flex items-center justify-center gap-2 mt-6 text-gray-500 hover:text-[#00F5A0] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
        </div>
        
        {/* Preview info */}
        <div className="mt-6 bg-white/5 rounded-xl p-4 sm:p-6 backdrop-blur-sm border border-white/10">
          <p className="font-semibold mb-4 text-white">Pitch Deck Contents:</p>
          <div className="grid grid-cols-2 gap-2">
            {slides.map((slide, idx) => (
              <div key={idx} className="flex items-start gap-2 text-sm">
                <span className="text-[#00F5A0] font-bold w-5">{idx + 1}.</span>
                <div>
                  <p className="text-white font-medium">{slide.title}</p>
                  <p className="text-gray-400 text-xs">{slide.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
