'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { authApi, saveAuth } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password) {
      setError('Please enter your User (Email) and Password.')
      return
    }

    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      const { token, employee } = res.data

      saveAuth(token, employee)
      toast.success(`Welcome back, ${employee.name || employee.employee_name}!`)

      if (employee.must_change_pass === 1) {
        router.replace('/change-password')
      } else {
        router.replace('/dashboard')
      }
    } catch (err) {
      const msg = err?.response?.data?.message || 'Invalid credentials. Please try again.'
      setError(msg)
      toast.error('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left panel: Modern aesthetic image */}
      <div 
        className="hidden md:block md:w-1/2 lg:w-7/12 bg-cover bg-center shrink-0" 
        style={{ backgroundImage: "url('/login_bg.png')" }}
      />

      {/* Right panel: Login form */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex items-center justify-center bg-[#f8f9fa] p-8 sm:p-12 md:p-16 lg:p-24">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-normal text-slate-800 tracking-tight">
              Login to TU Praise
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error display */}
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* User (Email) input */}
            <div className="space-y-1">
              <Input
                type="email"
                placeholder="User"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                autoComplete="email"
                className="h-14 px-5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-0 focus:outline-none transition-all text-base"
              />
            </div>

            {/* Password input */}
            <div className="space-y-1">
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
                className="h-14 px-5 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-indigo-400 focus:ring-0 focus:outline-none transition-all text-base"
              />
            </div>

            {/* Submit button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-14 bg-[#5c6bc0] hover:bg-[#4c5ab0] text-white font-bold text-sm tracking-wider uppercase rounded-xl shadow-md transition-all duration-200 flex items-center justify-center cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Login'
                )}
              </Button>
            </div>
          </form>

          {/* Footer branding */}
          <p className="text-center text-[11px] text-slate-400 mt-12 font-medium">
            © {new Date().getFullYear()} TU Praise · All rights reserved · v1.0.4
          </p>
        </div>
      </div>
    </div>
  )
}
