'use client'

import Link from 'next/link'
import {
  LayoutDashboard,
  BookOpen,
  ShieldCheck,
  Brain,
  Zap,
  Ticket,
  Grid3x3,
  CreditCard,
  Smartphone,
  LogOut,
  Home,
  Building2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export type GroCoreViewId =
  | 'overview'
  | 'ledger'
  | 'consent'
  | 'decisioning'
  | 'advances'
  | 'vouchers'
  | 'capital'
  | 'gopay'
  | 'device'

interface GroCoreSidebarProps {
  activeView: GroCoreViewId
  onSelect: (view: GroCoreViewId) => void
}

const navItems: Array<{
  id: GroCoreViewId
  label: string
  icon: React.ComponentType<{ className?: string }>
  hint?: string
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'ledger', label: 'Ledger', icon: BookOpen },
  { id: 'consent', label: 'Consent', icon: ShieldCheck },
  { id: 'decisioning', label: 'Decisioning', icon: Brain },
  { id: 'advances', label: 'Top-up Advances', icon: Zap },
  { id: 'vouchers', label: 'Vouchers', icon: Ticket },
  { id: 'capital', label: 'Capital Grid', icon: Grid3x3 },
  { id: 'gopay', label: 'GoPay Settlement', icon: CreditCard },
  { id: 'device', label: 'Device Finance', icon: Smartphone },
]

export default function GroCoreSidebar({ activeView, onSelect }: GroCoreSidebarProps) {
  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 md:left-0 bg-slate-900 text-slate-300 z-30">
      {/* Brand */}
      <div className="flex h-16 items-center gap-2 border-b border-slate-800 px-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#00897B] text-white">
          <Building2 className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold text-white">GroCore</span>
          <span className="text-[10px] text-slate-400">Financial OS</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 custom-scroll">
        {navItems.map((item) => {
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#00897B]/10 text-[#00897B]'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon
                className={`h-4 w-4 flex-shrink-0 ${
                  isActive ? 'text-[#00897B]' : 'text-slate-400 group-hover:text-white'
                }`}
              />
              <span className="truncate">{item.label}</span>
              {item.hint && (
                <Badge className="ml-auto bg-slate-700 text-[10px] text-slate-200">
                  {item.hint}
                </Badge>
              )}
            </button>
          )
        })}
      </nav>

      {/* Footer links */}
      <div className="border-t border-slate-800 px-3 py-4 space-y-1">
        <Link
          href="/grocore"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <Home className="h-4 w-4 text-slate-400" />
          <span>Landing page</span>
        </Link>
        <Link
          href="/grocore/login"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-4 w-4 text-slate-400" />
          <span>Sign out</span>
        </Link>
      </div>
    </aside>
  )
}
