'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Mail, Lock } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card'
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
      setError('Please enter your email and password.')
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
    <div className="min-h-screen bg-[#e9ecef] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* AdminLTE style Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-light text-slate-800 tracking-tight">
            <span className="font-bold">TU</span>Praise
          </h1>
        </div>

        <Card className="rounded-none border border-slate-200 shadow-md bg-white">
          <CardHeader className="pb-4 pt-6 text-center">
            <CardDescription className="text-slate-600 text-sm">Sign in to start your session</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pb-6">
              {/* Error alert */}
              {error && (
                <div className="rounded bg-red-50 border border-red-200 px-3 py-2.5 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1 relative">
                <Input
                  id="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                  className="h-10 pr-10 rounded-none border-slate-300 focus:border-primary"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>

              {/* Password */}
              <div className="space-y-1 relative">
                <Input
                  id="password"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  className="h-10 pr-10 rounded-none border-slate-300 focus:border-primary"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>

              {/* Actions */}
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-10 bg-primary hover:bg-primary/95 text-white font-semibold text-sm rounded-none shadow-sm cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    'Sign In'
                  )}
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>

        <p className="text-center text-[10px] text-slate-400 mt-6">
          © {new Date().getFullYear()} TU Praise · All rights reserved
        </p>
      </div>
    </div>
  )
}
