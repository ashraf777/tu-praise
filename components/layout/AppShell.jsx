'use client'

import { cn } from '@/lib/utils'
import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { isLoggedIn, getEmployee, authApi, saveAuth, clearAuth } from '@/lib/auth'

export function AppShell({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [ctx, setCtx] = useState('web')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [employee, setEmployee] = useState(null)

  useEffect(() => {
    const init = async () => {
      setMounted(true)
      const params = new URLSearchParams(window.location.search)
      const ctxParam = params.get('ctx') || 'web'
      setCtx(ctxParam)

      // Auth check
      if (!isLoggedIn()) {
        router.replace('/login')
        return
      }

      const emp = getEmployee()
      setEmployee(emp)
      if (pathname.startsWith('/admin') && emp?.role !== 'hr_admin') {
        router.replace('/dashboard')
      }
      if (pathname.startsWith('/team') && emp?.role !== 'hr_admin' && emp?.role !== 'supervisor' && !emp?.is_reviewer) {
        router.replace('/dashboard')
      }

      // Sync fresh profile from API
      try {
        const res = await authApi.me()
        const updatedEmp = res.data?.employee || res.data?.data || res.data
        if (updatedEmp) {
          setEmployee(updatedEmp)
          const token = localStorage.getItem('praise_token')
          saveAuth(token, updatedEmp)
          
          if (pathname.startsWith('/admin') && updatedEmp.role !== 'hr_admin') {
            router.replace('/dashboard')
          }
          if (pathname.startsWith('/team') && updatedEmp.role !== 'hr_admin' && updatedEmp.role !== 'supervisor' && !updatedEmp.is_reviewer) {
            router.replace('/dashboard')
          }
        }
      } catch (err) {
        console.error('Profile sync failed:', err)
        if (err?.response?.status === 401) {
          clearAuth()
          router.replace('/login')
        }
      }
    }
    init()
  }, [router, pathname])

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center animate-pulse">
            <span className="text-white font-bold text-sm">TP</span>
          </div>
          <p className="text-slate-500 text-sm">Loading…</p>
        </div>
      </div>
    )
  }

  const isEmbedded = ctx === 'dtalk' || ctx === 'tuapp'

  if (isEmbedded) {
    return (
      <div className="min-h-screen bg-slate-50">
        <main className="p-4">{children}</main>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-30 flex w-64 flex-col transition-transform duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <Sidebar employee={employee} onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
