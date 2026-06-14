'use client'

import { Menu, Bell } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { getEmployee } from '@/lib/auth'
import { useEffect, useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const pageTitles = {
  '/dashboard': 'Dashboard',
  '/goals': 'My Goals',
  '/goals/new': 'New Goal',
  '/team': 'Team Overview',
  '/feed': 'News Feed',
  '/admin': 'Admin Overview',
  '/admin/clients': 'Clients',
  '/admin/employees': 'Employees',
  '/admin/cycles': 'Cycles',
}

function getTitle(pathname) {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.startsWith('/goals/') && pathname.split('/').length === 3) return 'Goal Details'
  return 'TU Praise'
}

function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

export function TopBar({ onMenuClick }) {
  const pathname = usePathname()
  const [employee, setEmployee] = useState(null)

  useEffect(() => {
    setEmployee(getEmployee())
  }, [])

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-white px-4 lg:px-6 shadow-sm">
      <button
        onClick={onMenuClick}
        className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1">
        <h1 className="text-lg font-semibold text-slate-800">{getTitle(pathname)}</h1>
      </div>

      <div className="flex items-center gap-3">
        <button className="rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors relative">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8 bg-indigo-600">
            <AvatarFallback className="bg-indigo-600 text-white text-xs font-semibold">
              {getInitials((employee?.employee_name || employee?.name))}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-700 leading-none">{(employee?.employee_name || employee?.name) || 'User'}</p>
          </div>
        </div>
      </div>
    </header>
  )
}
