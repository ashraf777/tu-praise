'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { dashboardApi } from '@/lib/api'
import { getEmployee } from '@/lib/auth'
import { GoalStatusBadge } from '@/components/praise/GoalStatusBadge'
import { GoalTypeBadge } from '@/components/praise/GoalTypeBadge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Target, TrendingUp, CheckCircle2, XCircle, Plus, ArrowRight, BarChart3 } from 'lucide-react'
import { format } from 'date-fns'

function StatCard({ icon: Icon, label, value, color, loading }) {
  return (
    <Card className="relative overflow-hidden border-slate-200 shadow-sm">
      <CardContent className="p-6">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-12" />
          </div>
        ) : (
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">{value ?? 0}</p>
            </div>
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [employee, setEmployee] = useState(null)

  useEffect(() => {
    setEmployee(getEmployee())
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await dashboardApi.myGoals()
      const data = res.data?.data || res.data
      setStats(data.stats || data.summary || null)
      setGoals(data.goals || data.recent_goals || [])
    } catch (err) {
      console.error('Dashboard error:', err)
    } finally {
      setLoading(false)
    }
  }

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {greeting()}, {(employee?.employee_name || employee?.name)?.split(' ')[0] || 'there'} 👋
          </h2>
          <p className="mt-1 text-slate-500 text-sm">Here's an overview of your performance goals.</p>
        </div>
        <Link href="/goals/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            New Goal
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Target}
          label="Total Goals"
          value={stats?.total}
          color="bg-indigo-600"
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="In Progress"
          value={stats?.baselined}
          color="bg-blue-500"
          loading={loading}
        />
        <StatCard
          icon={CheckCircle2}
          label="Successful"
          value={stats?.successful}
          color="bg-green-500"
          loading={loading}
        />
        <StatCard
          icon={XCircle}
          label="Failed"
          value={stats?.failed}
          color="bg-red-500"
          loading={loading}
        />
      </div>

      {/* Recent Goals */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-base font-semibold text-slate-800">Recent Goals</CardTitle>
            <CardDescription className="mt-0.5">Your latest 5 goals</CardDescription>
          </div>
          <Link href="/goals">
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 mb-4">
                <BarChart3 className="h-7 w-7 text-indigo-400" />
              </div>
              <p className="font-medium text-slate-700">No goals yet</p>
              <p className="mt-1 text-sm text-slate-400">Create your first goal to get started.</p>
              <Link href="/goals/new" className="mt-4">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Goal
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {goals.slice(0, 5).map((goal) => (
                <Link
                  key={goal.goal_no}
                  href={`/goals/${goal.goal_no}`}
                  className="flex items-center gap-4 py-3.5 hover:bg-slate-50 -mx-2 px-2 rounded-lg transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
                    <Target className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-800 truncate text-sm">{goal.goal_name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {goal.cycle?.cycle_name} · Weight: {goal.weight}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <GoalTypeBadge type={goal.goal_type} />
                    <GoalStatusBadge status={goal.status} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
