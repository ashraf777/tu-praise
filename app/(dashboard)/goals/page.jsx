'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { goalsApi } from '@/lib/api'
import { GoalStatusBadge } from '@/components/praise/GoalStatusBadge'
import { GoalTypeBadge } from '@/components/praise/GoalTypeBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Target, Calendar, Weight, ArrowRight, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_TABS = [
  { key: 'all', label: 'All', value: null },
  { key: 'created', label: 'Created', value: 1 },
  { key: 'baselined', label: 'Baselined', value: 2 },
  { key: 'successful', label: 'Successful', value: 3 },
  { key: 'failed', label: 'Failed', value: 4 },
  { key: 'archived', label: 'Archived', value: 5 },
]

export default function GoalsPage() {
  const [goals, setGoals] = useState([])
  const [filtered, setFiltered] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')

  const fetchGoals = async () => {
    setLoading(true)
    try {
      const res = await goalsApi.list()
      const data = res.data?.goals || res.data?.data || (Array.isArray(res.data) ? res.data : [])
      setGoals(data)
      setFiltered(data)
    } catch (err) {
      console.error('Goals error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoals()
  }, [])

  useEffect(() => {
    let result = goals

    const tab = STATUS_TABS.find((t) => t.key === activeTab)
    if (tab?.value !== null && tab?.value !== undefined) {
      result = result.filter((g) => g.status === tab.value)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter((g) => g.goal_name?.toLowerCase().includes(q))
    }

    setFiltered(result)
  }, [goals, activeTab, search])

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Goals</h2>
          <p className="text-sm text-slate-500 mt-0.5">Track and manage your performance goals</p>
        </div>
        <Link href="/goals/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            New Goal
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search goals…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Status tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 h-9">
          {STATUS_TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="text-xs h-7">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Goals list */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="border-slate-200">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-60" />
                    <Skeleton className="h-4 w-40" />
                    <div className="flex gap-2 mt-2">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-slate-200 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 mb-4">
              <Target className="h-8 w-8 text-indigo-400" />
            </div>
            <p className="font-semibold text-slate-700 text-base">
              {search ? 'No goals match your search' : 'No goals yet'}
            </p>
            <p className="mt-1 text-sm text-slate-400 max-w-xs">
              {search ? 'Try a different search term or filter.' : 'Create your first goal to start tracking your performance.'}
            </p>
            {!search && (
              <Link href="/goals/new" className="mt-5">
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="mr-2 h-4 w-4" /> Create Goal
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((goal) => (
            <Link key={goal.goal_no} href={`/goals/${goal.goal_no}`}>
              <Card className="border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50 group-hover:bg-indigo-100 transition-colors">
                      <Target className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-slate-800 leading-snug group-hover:text-indigo-700 transition-colors">
                          {goal.goal_name}
                        </p>
                        <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-400 shrink-0 mt-0.5 transition-colors" />
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {goal.cycle?.cycle_name || 'No cycle'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <GoalTypeBadge type={goal.goal_type} />
                        <GoalStatusBadge status={goal.status} />
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Weight className="h-3 w-3" />
                          {goal.weight}%
                        </span>
                        {goal.deadline && (
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(goal.deadline), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
