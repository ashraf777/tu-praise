'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard,
  Target,
  Users,
  ShieldCheck,
  LogOut,
  X,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getEmployee, clearAuth, authApi } from '@/lib/auth'
import { toast } from 'sonner'
import { useEffect, useState, Suspense } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['*'] },
  { href: '/goals', label: 'My Goals', icon: Target, roles: ['*'] },
  { href: '/team', label: 'Team', icon: Users, roles: ['hr_admin', 'supervisor'] },
  { href: '/admin', label: 'Admin', icon: ShieldCheck, roles: ['hr_admin'] },
]

function SidebarContent({ onClose }) {
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [employee, setEmployee] = useState(null)

  useEffect(() => {
    const init = () => setEmployee(getEmployee())
    init()
  }, [])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch { }
    clearAuth()
    router.replace('/login')
    toast.success('Logged out successfully')
  }

  const role = employee?.role || ''

  const visibleItems = navItems.filter((item) => {
    if (item.roles.includes('*')) return true
    return item.roles.includes(role)
  })

  const getInitials = (name = '') => {
    return name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
  }

  const companyName = employee?.client?.client_name || 'TU Praise'
  const isCreated = searchParams?.get('created') === 'true'

  return (
    <div className="flex h-full flex-col bg-[#343a40] border-r border-[#4b545c] text-[#c2c7d0] font-sans">
      {/* AdminLTE style Logo / Brand */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-[#4f5962] bg-[#343a40] shrink-0" style={{ borderColor: '#4f5962' }}>
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white font-bold text-xs shrink-0 shadow-sm">
            TP
          </div>
          <span className="text-base font-semibold text-white tracking-tight truncate">
            {companyName}
          </span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden rounded p-1 text-[#c2c7d0] hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* AdminLTE style Profile Panel */}
      <Link href="/goals?created=true" className="flex items-center gap-3 py-4 px-4 border-b border-[#4f5962] bg-[#343a40] shrink-0 hover:bg-white/5 transition-colors" style={{ borderColor: '#4f5962' }}>
        <div className="h-9 w-9 rounded-full border border-white/20 overflow-hidden bg-white/10 flex items-center justify-center text-xs font-bold text-white shadow-inner shrink-0">
          {getInitials(employee?.employee_name || employee?.name)}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold text-white truncate block">
            {employee?.employee_name || employee?.name || 'User'}
          </span>
          <span className="flex items-center gap-1 text-[9px] text-slate-400 mt-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#28a745] block"></span>
            Online
          </span>
        </div>
      </Link>

      {/* Navigation list in nav-pills style */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1.5">
        <div className="px-3 pb-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
          Main Navigation
        </div>
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive = item.href.includes('created=true')
            ? isCreated
            : (item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href) && !isCreated)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2 text-xs font-medium transition-all rounded cursor-pointer',
                isActive
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-[#c2c7d0] hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4.5 w-4.5 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer: Sign Out */}
      <div className="border-t border-[#4f5962] p-2 bg-[#343a40] shrink-0" style={{ borderColor: '#4f5962' }}>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded px-3 py-2 text-xs font-medium text-[#c2c7d0] hover:bg-red-500/10 hover:text-red-400 transition-colors cursor-pointer"
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          Sign Out
        </button>
      </div>
    </div>
  )
}

export function Sidebar(props) {
  return (
    <Suspense fallback={<div className="h-full bg-[#343a40] flex items-center justify-center text-white">Loading...</div>}>
      <SidebarContent {...props} />
    </Suspense>
  )
}
