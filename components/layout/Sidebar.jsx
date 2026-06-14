'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Target,
  Users,
  Rss,
  ShieldCheck,
  LogOut,
  X,
  Award,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getEmployee, clearAuth, authApi } from '@/lib/auth'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['*'] },
  { href: '/goals', label: 'My Goals', icon: Target, roles: ['*'] },
  { href: '/team', label: 'Team', icon: Users, roles: ['*'] },
  { href: '/feed', label: 'News Feed', icon: Rss, roles: ['*'] },
  { href: '/admin', label: 'Admin', icon: ShieldCheck, roles: ['hr_admin'] },
]

export function Sidebar({ onClose }) {
  const pathname = usePathname()
  const router = useRouter()
  const [employee, setEmployee] = useState(null)

  useEffect(() => {
    setEmployee(getEmployee())
  }, [])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {}
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

  const getRoleLabel = (r) => {
    const map = { hr_admin: 'HR Admin', supervisor: 'Supervisor', employee: 'Employee' }
    return map[r] || r
  }

  return (
    <div className="flex h-full flex-col bg-white border-r border-slate-200">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-100">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-sm">
            <Award className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-800 tracking-tight">TU Praise</span>
        </Link>
        <button
          onClick={onClose}
          className="lg:hidden rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {visibleItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer: Employee info + Logout */}
      <div className="border-t border-slate-100 p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
            {getInitials((employee?.employee_name || employee?.name))}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{(employee?.employee_name || employee?.name) || 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{getRoleLabel(role)}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  )
}
