'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { dashboardApi, feedApi } from '@/lib/api'
import { getEmployee } from '@/lib/auth'
import { GoalStatusBadge } from '@/components/praise/GoalStatusBadge'
import { GoalTypeBadge } from '@/components/praise/GoalTypeBadge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Target, TrendingUp, CheckCircle2, XCircle, Plus, BarChart3,
  ChevronUp, Wrench, X, MessageSquare, UserCheck, Rss
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

const FEED_ICONS = {
  1: Target,        // Goal created
  2: BarChart3,     // Baseline set
  3: CheckCircle2,  // Goal successful
  4: XCircle,       // Goal failed
  5: CheckCircle2,  // Goal archived
  6: UserCheck,     // Reviewer added
  7: MessageSquare, // Comment added
}

const FEED_COLORS = {
  1: 'bg-blue-50 text-blue-600 border border-blue-100',
  2: 'bg-indigo-50 text-indigo-600 border border-indigo-100',
  3: 'bg-green-50 text-green-600 border border-green-100',
  4: 'bg-red-50 text-red-600 border border-red-100',
  5: 'bg-amber-50 text-amber-600 border border-amber-100',
  6: 'bg-purple-50 text-purple-600 border border-purple-100',
  7: 'bg-slate-50 text-slate-600 border border-slate-100',
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function FeedItem({ item }) {
  const typeId = item.feed_type || item.type_id
  const Icon = FEED_ICONS[typeId] || Target
  const colorClass = FEED_COLORS[typeId] || 'bg-slate-50 text-slate-600 border border-slate-100'

  return (
    <div className="flex gap-4 py-3 first:pt-0 last:pb-0">
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Avatar className="h-5 w-5 bg-slate-100">
              <AvatarFallback className="bg-slate-100 text-slate-700 text-[9px] font-semibold">
                {getInitials(item.employee_name || '')}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-slate-800">{item.employee_name || 'Someone'}</span>
          </div>
          <span className="text-[10px] text-slate-400 shrink-0">
            {item.created
              ? formatDistanceToNow(new Date(item.created), { addSuffix: true })
              : ''}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-600">
          <span className="text-slate-500">{item.feed_type?.post_type_desc || item.feed_type_desc || item.description || 'Updated a goal'}</span>
          {item.goal?.goal_name && (
            <span className="ml-1 font-medium text-slate-800">&quot;{item.goal.goal_name}&quot;</span>
          )}
        </p>
      </div>
    </div>
  )
}

// Redesigned as AdminLTE Info Box (flat, bordered, colored icon block on the left)
function StatCard({ icon: Icon, label, value, bgClass, loading }) {
  return (
    <Card className="relative overflow-hidden border border-slate-200 bg-white shadow-sm rounded-none flex items-center h-20">
      {loading ? (
        <CardContent className="p-4 space-y-2 flex-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-6 w-8" />
        </CardContent>
      ) : (
        <>
          <div className={cn("h-full w-16 flex items-center justify-center text-white shrink-0", bgClass)}>
            <Icon className="h-6 w-6" />
          </div>
          <div className="pl-4 flex-1 min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">{label}</p>
            <p className="text-xl font-bold text-slate-800 mt-0.5">{value ?? 0}</p>
          </div>
        </>
      )}
    </Card>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [goals, setGoals] = useState([])
  const [feedItems, setFeedItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedLoading, setFeedLoading] = useState(true)
  const [employee, setEmployee] = useState(null)
  const [activeTab, setActiveTab] = useState('feed')

  async function fetchData() {
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

  async function fetchFeed() {
    try {
      const res = await feedApi.list()
      const data = res.data?.feeds || res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : [])
      setFeedItems(data)
    } catch (err) {
      console.error('Feed error:', err)
    } finally {
      setFeedLoading(false)
    }
  }

  useEffect(() => {
    const init = () => {
      setEmployee(getEmployee())
      fetchData()
      fetchFeed()
    }
    init()
  }, [])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Welcome header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            {greeting()}, {(employee?.employee_name || employee?.name)?.split(' ')[0] || 'there'} 👋
          </h2>
          <p className="mt-0.5 text-slate-500 text-xs">Here&apos;s an overview of your performance goals.</p>
        </div>
        <Link href="/goals/new">
          <Button className="bg-primary hover:bg-primary/95 text-white shadow-sm h-9 text-xs font-semibold rounded-none cursor-pointer">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Goal
          </Button>
        </Link>
      </div>

      {/* Stats cards - Styled as Info Boxes */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={Target}
          label="Total Goals"
          value={stats?.total}
          bgClass="bg-[#17a2b8]" /* Teal Info bg */
          loading={loading}
        />
        <StatCard
          icon={TrendingUp}
          label="In Progress"
          value={stats?.baselined}
          bgClass="bg-[#ffc107]" /* Yellow Warning bg */
          loading={loading}
        />
        <StatCard
          icon={CheckCircle2}
          label="Successful"
          value={stats?.successful}
          bgClass="bg-[#28a745]" /* Green Success bg */
          loading={loading}
        />
        <StatCard
          icon={XCircle}
          label="Failed"
          value={stats?.failed}
          bgClass="bg-[#dc3545]" /* Red Danger bg */
          loading={loading}
        />
      </div>

      {/* Tabbed Goals & Feed container - styled as card-primary (top bordered blue) */}
      <Card className="border border-slate-200 border-t-[3px] border-t-primary shadow-sm rounded-none bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-100 space-y-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('feed')}
              className={cn(
                "pb-2.5 text-sm font-semibold border-b-2 transition-colors -mb-2.5 cursor-pointer",
                activeTab === 'feed'
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              Activity Feed
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={cn(
                "pb-2.5 text-sm font-semibold border-b-2 transition-colors -mb-2.5 cursor-pointer",
                activeTab === 'goals'
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              Recent Goals
            </button>
          </div>
          {/* Decorative AdminLTE card tools */}
          <div className="flex items-center gap-2 text-slate-300">
            <ChevronUp className="h-3.5 w-3.5 cursor-pointer hover:text-slate-500 transition-colors" />
            <Wrench className="h-3.5 w-3.5 cursor-pointer hover:text-slate-500 transition-colors" />
            <X className="h-3.5 w-3.5 cursor-pointer hover:text-slate-500 transition-colors" />
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {activeTab === 'goals' ? (
            loading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded" />
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
                <div className="flex h-14 w-14 items-center justify-center rounded bg-slate-50 mb-4 border border-slate-100">
                  <BarChart3 className="h-7 w-7 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700 text-sm">No goals yet</p>
                <p className="mt-1 text-xs text-slate-400">Create your first goal to get started.</p>
                <Link href="/goals/new" className="mt-4">
                  <Button size="sm" className="bg-primary hover:bg-primary/95 text-white h-8 text-xs font-semibold rounded-none cursor-pointer">
                    <Plus className="mr-1.5 h-3 w-3" /> Add Goal
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {goals.slice(0, 5).map((goal) => (
                  <Link
                    key={goal.goal_no}
                    href={`/goals/${goal.goal_no}`}
                    className="flex items-center gap-4 py-3 hover:bg-slate-50 -mx-2 px-2 rounded-none transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                      <Target className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 truncate text-xs">{goal.goal_name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {goal.cycle?.cycle_name} · Weight: {goal.weight}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <GoalTypeBadge type={goal.goal_type} />
                      <GoalStatusBadge status={goal.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )
          ) : (
            feedLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-4 py-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-40" />
                      <Skeleton className="h-3 w-64" />
                    </div>
                  </div>
                ))}
              </div>
            ) : feedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded bg-slate-50 mb-4 border border-slate-100">
                  <Rss className="h-7 w-7 text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700 text-sm">No activity yet</p>
                <p className="mt-1 text-xs text-slate-400">Activity will appear here as goals are updated.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {feedItems.slice(0, 10).map((item, i) => (
                  <FeedItem key={item.feed_no || i} item={item} />
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  )
}
