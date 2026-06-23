'use client'

import { useEffect, useState } from 'react'
import { feedApi } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Target, CheckCircle2, XCircle, Archive, BarChart3,
  UserCheck, MessageSquare, Rss, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'

const FEED_ICONS = {
  1: Target,        // Goal created
  2: BarChart3,     // Baseline set
  3: CheckCircle2,  // Goal successful
  4: XCircle,       // Goal failed
  5: Archive,       // Goal archived
  6: UserCheck,     // Reviewer added
  7: MessageSquare, // Comment added
}

const FEED_COLORS = {
  1: 'bg-indigo-100 text-indigo-600',
  2: 'bg-blue-100 text-blue-600',
  3: 'bg-green-100 text-green-600',
  4: 'bg-red-100 text-red-600',
  5: 'bg-amber-100 text-amber-600',
  6: 'bg-purple-100 text-purple-600',
  7: 'bg-slate-100 text-slate-600',
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function FeedItem({ item }) {
  const typeId = item.feed_type || item.type_id
  const Icon = FEED_ICONS[typeId] || Target
  const colorClass = FEED_COLORS[typeId] || 'bg-slate-100 text-slate-600'

  return (
    <div className="flex gap-4 py-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colorClass}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Avatar className="h-6 w-6 bg-indigo-100">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-[10px] font-semibold">
                {getInitials(item.employee_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-semibold text-slate-800">{item.employee_name || 'Someone'}</span>
          </div>
          <span className="text-xs text-slate-400 shrink-0">
            {item.created
              ? formatDistanceToNow(new Date(item.created), { addSuffix: true })
              : ''}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          <span className="text-slate-500">{item.feed_type?.post_type_desc || item.feed_type_desc || item.description || 'Updated a goal'}</span>
          {item.goal?.goal_name && (
            <span className="ml-1 font-medium text-slate-800">&quot;{item.goal.goal_name}&quot;</span>
          )}
        </p>
      </div>
    </div>
  )
}

export default function FeedPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchFeed = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    try {
      const res = await feedApi.list()
      setItems(res.data?.feeds || res.data?.items || res.data?.data || (Array.isArray(res.data) ? res.data : []))
    } catch (err) {
      console.error('Feed error:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const init = () => fetchFeed()
    init()
  }, [])

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">News Feed</h2>
          <p className="text-sm text-slate-500 mt-0.5">Latest activity across your organization</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchFeed(true)}
          disabled={refreshing}
          className="h-9"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 divide-y divide-slate-100">
          {loading ? (
            <>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-4 py-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                </div>
              ))}
            </>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 mb-4">
                <Rss className="h-7 w-7 text-indigo-400" />
              </div>
              <p className="font-semibold text-slate-700">No activity yet</p>
              <p className="text-sm text-slate-400 mt-1">Activity will appear here as goals are updated.</p>
            </div>
          ) : (
            items.map((item, i) => (
              <FeedItem key={item.feed_no || i} item={item} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
