'use client'

import { Menu } from 'lucide-react'
import { getEmployee, clearAuth, authApi } from '@/lib/auth'
import { useEffect, useState, Suspense } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import Link from 'next/link'

function TopBarContent({ onMenuClick }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [employee, setEmployee] = useState(null)

  useEffect(() => {
    const init = () => setEmployee(getEmployee())
    init()
  }, [])

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } catch {}
    clearAuth()
    router.replace('/login')
    toast.success('Logged out successfully')
  }

  const isCreated = searchParams?.get('created') === 'true'

  // Generate breadcrumb path array
  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(Boolean)
    const crumbs = [{ label: 'Home', href: '/dashboard' }]

    if (parts.length === 0) return crumbs

    let currentPath = ''
    parts.forEach((part) => {
      currentPath += `/${part}`
      let label = part.charAt(0).toUpperCase() + part.slice(1)

      if (part === 'dashboard') {
        return // skip dashboard as Home represents it
      }

      if (part === 'goals') {
        label = isCreated ? 'Created Goals' : 'My Goals'
      } else if (part === 'new') {
        label = 'New Goal'
      } else if (!isNaN(part)) {
        label = 'Goal Details'
      } else if (part === 'team') {
        label = 'Team'
      } else if (part === 'admin') {
        label = 'Admin'
      } else if (part === 'employees') {
        label = 'Employees'
      } else if (part === 'cycles') {
        label = 'Cycles'
      } else if (part === 'clients') {
        label = 'Clients'
      }

      crumbs.push({ label, href: currentPath })
    })

    return crumbs
  }

  const crumbs = getBreadcrumbs()

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#dee2e6] bg-white px-4 lg:px-6 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Toggle Sidebar Button */}
        <button
          onClick={onMenuClick}
          className="rounded p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          aria-label="Toggle Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* AdminLTE style breadcrumbs path */}
        <nav className="hidden md:flex items-center gap-2 text-xs text-slate-400">
          {crumbs.map((crumb, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <span className="text-[10px] text-slate-300">/</span>}
              {idx === crumbs.length - 1 ? (
                <span className="text-slate-700 font-semibold">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-primary hover:underline transition-colors">
                  {crumb.label}
                </Link>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* User Name & Logout Dropdown */}
      <div className="flex items-center gap-1.5 cursor-pointer group relative py-3">
        <Link href="/goals?created=true" className="text-xs font-semibold text-slate-700 hover:text-primary transition-colors">
          {employee?.employee_name || employee?.name || 'User'}
        </Link>
        <span className="text-[9px] text-slate-400">▼</span>

        {/* Dropdown Menu */}
        <div className="absolute right-0 top-full mt-0 hidden group-hover:block z-50 bg-white border border-[#dee2e6] rounded shadow-md py-1 w-32">
          <Link
            href="/goals?created=true"
            className="block w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors font-medium"
          >
            Created Goals
          </Link>
          <button
            onClick={handleLogout}
            className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-red-600 border-t border-slate-100 transition-colors font-medium cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  )
}

export function TopBar(props) {
  return (
    <Suspense fallback={<header className="h-14 bg-white border-b border-[#dee2e6]" />}>
      <TopBarContent {...props} />
    </Suspense>
  )
}
