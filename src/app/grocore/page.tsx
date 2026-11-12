import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Landmark, BookOpen, ShieldCheck, Brain, Zap, Ticket, Grid3x3, CreditCard, Smartphone, Globe, ArrowRight, Lock } from 'lucide-react'

const features = [
  { icon: BookOpen, title: 'Double-Entry Ledger', desc: 'Every entry nets to zero. Balanced postings, idempotency keys, trial balance, reversals.' },
  { icon: ShieldCheck, title: 'Consent-Driven Decisioning', desc: 'POPIA-compliant consent first. Hard stops, affordability checks, reason codes, full trace.' },
  { icon: CreditCard, title: 'GoPay Settlement', desc: 'Capture, fee, settlement split, payout. Disabled until licensed — Wave 2 gate enforced in code.' },
  { icon: Zap, title: 'Top-Up Advances', desc: 'Airtime, data, electricity advances with claw-back recovery. SA and Malawi market presets.' },
  { icon: Grid3x3, title: 'Capital Funding Grid', desc: 'Lender, balance-sheet, supplier credit, grant sources. Cheapest-source allocator per currency.' },
  { icon: Ticket, title: 'Voucher Engine', desc: 'Serial + PIN + QR generation. Direct recharge, printed vouchers, QR vouchers. 29 vendors.' },
  { icon: Smartphone, title: 'Device Finance', desc: 'M-KOPA-style daily-payment contracts. Device locking, repossession grace periods, unlock on payoff.' },
  { icon: Lock, title: 'SmartPole Edge', desc: 'Signed offline decision envelopes (Ed25519). Spend caps tracked at the hub, synced over WiFi/LTE.' },
  { icon: Globe, title: 'Multi-Currency (ZAR / MWK)', desc: 'Integer minor units — cents for Rand, tambala for Kwacha. Never netted across currencies.' },
]

const compliance = [
  { code: 'NCA', name: 'National Credit Act', desc: 'Affordability rules, fee ceilings, registration threshold is nil since 2016.' },
  { code: 'POPIA', name: 'Protection of Personal Information Act', desc: 'Consent for credit use, purpose limits, restrictions on solely automated decisions.' },
  { code: 'RBM', name: 'Reserve Bank of Malawi', desc: 'Payment Systems Act 2016. Licensed provider required for mobile money collections and payouts.' },
  { code: 'FICA', name: 'Financial Intelligence Centre Act', desc: 'AML programme, sanctions screening, goAML reporting obligations.' },
]

export default function GroCoreLanding() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/grocore" className="flex items-center gap-2">
            <img src="/groway-logo.png" alt="Groway" className="h-8 w-auto" />
            <span className="text-lg font-bold tracking-tight">GroCore</span>
            <Badge className="ml-1 bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20 hover:bg-[#0F766E]/10">Financial OS</Badge>
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-[#0F766E]">Features</a>
            <a href="#compliance" className="text-sm font-medium text-slate-600 hover:text-[#0F766E]">Compliance</a>
            <Link href="/grocore/login"><Button variant="ghost" size="sm">Login</Button></Link>
            <Link href="/grocore/login"><Button size="sm" className="bg-[#0F766E] hover:bg-[#0F766E]/90">Request a demo</Button></Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge className="mb-4 bg-[#0F766E]/10 text-[#0F766E] border-[#0F766E]/20">Africa's Integrated Financial Operating System</Badge>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">The financial engine behind <span className="text-[#0F766E]">Groway</span></h1>
            <p className="mt-6 text-lg text-slate-600">Double-entry ledger, consent-aware decisioning, GoPay settlement, top-up advances, capital funding grid, voucher engine and device finance — all in one module. Built for the township economy, compliant by design.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link href="/grocore/login"><Button size="lg" className="bg-[#0F766E] hover:bg-[#0F766E]/90">Login to GroCore <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
              <Link href="/grocore/login"><Button size="lg" variant="outline">Request a demo</Button></Link>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">One ledger. Nine capabilities.</h2>
            <p className="mt-4 text-slate-600">Every GroCore capability is a TypeScript module with a port-based architecture. Extract any module into a microservice when you need to — no rewrite required.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f.title} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex rounded-lg bg-[#0F766E]/10 p-3 text-[#0F766E]"><f.icon className="h-6 w-6" /></div>
                  <h3 className="font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold">Money that moves at the speed of the spaza shop.</h2>
            <p className="mt-4 text-slate-600">GroCore is built for the informal economy where a R5 airtime advance or a R35/day solar kit payment matters. Integer cents, not floats. Offline-capable edge decisions. Claw-back recovery on the next top-up. This is fintech that fits in a spaza shop, not a boardroom.</p>
          </div>
        </div>
      </section>

      <section id="compliance" className="bg-slate-900 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold">Compliance is the foundation, not a feature.</h2>
            <p className="mt-4 text-slate-400">Every GroCore route applies a tenant guard. Every credit decision checks consent first. Every money movement is a ledger entry with an idempotency key.</p>
          </div>
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {compliance.map((c) => (
              <Card key={c.code} className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <Badge className="mb-3 bg-[#0F766E] text-white">{c.code}</Badge>
                  <h3 className="font-semibold text-white">{c.name}</h3>
                  <p className="mt-2 text-sm text-slate-400">{c.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold">See GroCore in action.</h2>
          <p className="mt-4 text-slate-600">Login with demo credentials and explore the full dashboard.</p>
          <div className="mt-8">
            <Link href="/grocore/login"><Button size="lg" className="bg-[#0F766E] hover:bg-[#0F766E]/90">Login to GroCore <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-slate-200 bg-slate-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2"><Landmark className="h-4 w-4 text-[#0F766E]" /><span>GroCore v1.0 — Financial OS</span></div>
            <div className="flex items-center gap-4"><span>Money stored as integer minor units.</span><span>Groway (Pty) Ltd</span><span>All actions are audited</span></div>
          </div>
        </div>
      </footer>
    </div>
  )
}
