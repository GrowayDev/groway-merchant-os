'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Sun,
  Moon,
  LogOut,
  Menu,
  ChevronDown,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface GroCoreHeaderProps {
  title: string
  description?: string
  onOpenMobileNav?: () => void
}

function readInitialUserName(): string {
  if (typeof window === 'undefined') return 'GroCore Operator'
  try {
    const raw = localStorage.getItem('grocore_session')
    if (raw) {
      const parsed = JSON.parse(raw) as { user?: { name?: string; email?: string } }
      if (parsed.user?.name) return parsed.user.name
    }
  } catch {
    // ignore
  }
  return 'GroCore Operator'
}

function readInitialTenantId(): string {
  if (typeof window === 'undefined') return 'demo-tenant'
  try {
    return localStorage.getItem('grocore_tenant_id') || 'demo-tenant'
  } catch {
    return 'demo-tenant'
  }
}

export default function GroCoreHeader({ title, description, onOpenMobileNav }: GroCoreHeaderProps) {
  const [isDark, setIsDark] = useState(false)
  const [userName] = useState<string>(readInitialUserName)
  const [tenantId] = useState<string>(readInitialTenantId)

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Mobile menu */}
      <div className="flex items-center gap-2 md:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="h-9 w-9"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Title */}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">{title}</h1>
          <Badge className="bg-[#00897B]/10 text-[#00897B] border-[#00897B]/20 hover:bg-[#00897B]/10">
            GroCore
          </Badge>
        </div>
        {description && (
          <p className="truncate text-xs text-slate-500 sm:text-sm">{description}</p>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 lg:flex">
          <span className="text-[10px] uppercase tracking-wide text-slate-500">Tenant</span>
          <code className="font-mono text-xs text-[#00897B]">{tenantId}</code>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="h-9 w-9 text-slate-600 hover:text-[#00897B]"
        >
          {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2 hover:bg-slate-100">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-[#00897B] text-xs text-white">
                  {userName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left md:block">
                <p className="text-xs font-medium text-slate-900">{userName}</p>
                <p className="text-[10px] text-slate-500">Operator</p>
              </div>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{userName}</span>
                <span className="text-xs font-normal text-slate-500">grocore@groway.co.za</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/grocore" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Landing page
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/grocore/login" className="flex items-center gap-2 text-red-600">
                <LogOut className="h-4 w-4" />
                Sign out
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
