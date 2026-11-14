'use client'
import { ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function GroCoreView() {
  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="border-b bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white px-6 py-5">
        <div className="flex items-center gap-3"><div className="h-10 w-10 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center"><ShieldCheck className="h-6 w-6" /></div><div><h1 className="text-xl font-bold tracking-tight">GroCore</h1><p className="text-xs text-emerald-100/90">Financial Services Core</p></div></div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <ShieldCheck className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">GroCore Financial Services</h2>
          <p className="text-slate-600 mb-6">The financial services core runs as a dedicated application with its own dashboard, login, and full CRUD interface for vouchers, device finance, ledger, decisioning, settlement, consent, and capital mesh.</p>
          <Link href="/grocore/login"><Button className="bg-emerald-600 hover:bg-emerald-700 text-white">Open GroCore Dashboard →</Button></Link>
        </div>
      </div>
    </div>
  )
}
