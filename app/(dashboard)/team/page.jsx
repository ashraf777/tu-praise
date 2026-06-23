'use client'

import { useEffect, useState } from 'react'
import { dashboardApi } from '@/lib/api'
import { GoalStatusBadge } from '@/components/praise/GoalStatusBadge'
import { GoalTypeBadge } from '@/components/praise/GoalTypeBadge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Target } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

export default function TeamPage() {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const res = await dashboardApi.team()
        setGoals(res.data?.data?.goals || res.data?.goals || [])
      } catch (err) {
        console.error('Team error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchTeam()
  }, [])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Team Overview</h2>
        <p className="text-sm text-slate-500 mt-0.5">Goals you are assigned to review</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-600" /> Team Goals
          </CardTitle>
          <CardDescription>All goals where you are assigned as a reviewer</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-24 rounded-full" />
                </div>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 mb-4">
                <Users className="h-7 w-7 text-indigo-400" />
              </div>
              <p className="font-semibold text-slate-700">No team goals</p>
              <p className="text-sm text-slate-400 mt-1">You haven&apos;t been assigned as a reviewer for any goals yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="pl-6 font-semibold text-xs uppercase text-slate-500">Employee</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500">Goal</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500">Cycle</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500">Type</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500">Status</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500">Deadline</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {goals.map((goal) => (
                    <TableRow
                      key={goal.goal_no}
                      className="hover:bg-slate-50 cursor-pointer"
                    >
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 bg-indigo-100">
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                              {getInitials(goal.employee?.employee_name || goal.employee?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-slate-800">{goal.employee?.employee_name || goal.employee?.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Link href={`/goals/${goal.goal_no}`} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium hover:underline">
                          {goal.goal_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">{goal.cycle?.cycle_name || '—'}</TableCell>
                      <TableCell><GoalTypeBadge type={goal.goal_type} /></TableCell>
                      <TableCell><GoalStatusBadge status={goal.status} /></TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {goal.deadline ? format(new Date(goal.deadline), 'MMM d, yyyy') : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
