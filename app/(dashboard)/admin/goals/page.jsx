'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { adminGoalsApi, GOAL_STATUSES } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Target, ArrowLeft, Search, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'


const STATUS_COLORS = {
  1: 'bg-slate-100 text-slate-600',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-indigo-100 text-indigo-700',
  4: 'bg-green-100 text-green-700',
  5: 'bg-red-100 text-red-700',
  6: 'bg-purple-100 text-purple-700',
}

export default function AdminGoalsPage() {
  const router = useRouter()
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchGoals() {
    try {
      const res = await adminGoalsApi.list()
      const data = res.data?.data || res.data?.goals || (Array.isArray(res.data) ? res.data : [])
      setGoals(data)
    } catch (err) {
      toast.error('Failed to load goals')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const init = () => fetchGoals()
    init()
  }, [])

  const q = search.toLowerCase().trim()
  const filtered = q
    ? goals.filter(
        (g) =>
          g.goal_name?.toLowerCase().includes(q) ||
          (g.employee?.employee_name || g.employee?.name || '').toLowerCase().includes(q)
      )
    : goals

  const statusLabel = (s) => GOAL_STATUSES?.[s]?.label || `Status ${s}`

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Admin
        </Link>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Target className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">All Goals</h2>
          </div>
          <p className="text-sm text-slate-500">Read-only view of all employee goals in your organization</p>
        </div>

        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by goal or employee…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-7 w-16 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Target className="h-12 w-12 text-slate-200 mb-4" />
              <p className="font-semibold text-slate-600">
                {search ? 'No goals match your search' : 'No goals found'}
              </p>
              {search && (
                <Button variant="ghost" className="mt-3 text-sm text-slate-500" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="pl-6 font-semibold text-xs uppercase text-slate-500">Goal</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500">Employee</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500">Cycle</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500 text-center">Weight</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500">Status</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500 text-right pr-6">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((goal) => (
                    <TableRow
                      key={goal.goal_no}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => router.push(`/goals/${goal.goal_no}`)}
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 shrink-0">
                            <Target className="h-4 w-4 text-indigo-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-800 text-sm line-clamp-1">{goal.goal_name}</p>
                            {goal.deadline && (
                              <p className="text-[10px] text-slate-400">
                                Due {format(new Date(goal.deadline), 'MMM d, yyyy')}
                              </p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">
                        {goal.employee?.employee_name || goal.employee?.name || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {goal.cycle?.cycle_name || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-700 font-medium text-center">
                        {goal.weight ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`${STATUS_COLORS[goal.status] || 'bg-slate-100 text-slate-500'} border-0 text-xs`}
                        >
                          {statusLabel(goal.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-3 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              router.push(`/goals/${goal.goal_no}`)
                            }}
                          >
                            <ExternalLink className="h-3.5 w-3.5 mr-1" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-slate-400 text-right">
          Showing {filtered.length} of {goals.length} goals
        </p>
      )}
    </div>
  )
}
