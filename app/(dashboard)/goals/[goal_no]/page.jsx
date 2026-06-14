'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { goalsApi } from '@/lib/api'
import { GoalStatusBadge } from '@/components/praise/GoalStatusBadge'
import { GoalTypeBadge } from '@/components/praise/GoalTypeBadge'
import { ReviewerSection } from '@/components/praise/ReviewerSection'
import { CommentThread } from '@/components/praise/CommentThread'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import {
  ArrowLeft, Target, Calendar, Weight, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, XCircle, Archive, BarChart3, Clock
} from 'lucide-react'
import { format } from 'date-fns'

// Format changes for History
const formatChanges = (beforeStr, afterStr) => {
  try {
    const before = JSON.parse(beforeStr || '{}')
    const after = JSON.parse(afterStr || '{}')
    const changes = []
    for (const key in after) {
      if (before[key] !== after[key]) {
        changes.push(`${key}: ${before[key] ?? 'none'} → ${after[key] ?? 'none'}`)
      }
    }
    return changes.length ? changes.join(' \n ') : ''
  } catch (e) {
    return ''
  }
}

// History timeline
function HistoryTimeline({ history, open }) {
  if (!open || !history?.length) return null
  return (
    <div className="space-y-3 mt-4">
      {history.map((item, i) => (
        <div key={i} className="flex gap-3 text-sm">
          <div className="flex flex-col items-center">
            <div className="h-2 w-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
            {i < history.length - 1 && <div className="w-px flex-1 bg-slate-200 mt-1" />}
          </div>
          <div className="pb-3 min-w-0">
            <p className="text-slate-700 font-medium">{item.change_type?.desc || item.action || 'Updated Goal'}</p>
            {item.parameters_after && (
              <p className="text-slate-500 text-xs mt-1 whitespace-pre-wrap leading-relaxed border-l-2 border-slate-200 pl-2">
                {formatChanges(item.parameters_before, item.parameters_after)}
              </p>
            )}
            <p className="text-slate-400 text-xs mt-0.5">
              {item.created_at ? format(new Date(item.created_at), 'MMM d, yyyy HH:mm') : ''}
              {(item.changed_by_employee || item.employee)?.name ? ` · ${(item.changed_by_employee || item.employee).name}` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

// Action dialog for baseline/result update
function ActionDialog({ open, onClose, title, fields, onSubmit, loading }) {
  const [values, setValues] = useState({})
  const set = (key) => (e) => setValues((v) => ({ ...v, [key]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Fill in the required information below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <Label htmlFor={field.key}>{field.label}</Label>
              <Input
                id={field.key}
                type={field.type || 'text'}
                placeholder={field.placeholder}
                onChange={set(field.key)}
                className="h-10"
              />
            </div>
          ))}
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function GoalDetailPage() {
  const { goal_no } = useParams()
  const router = useRouter()

  const [goal, setGoal] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [dialog, setDialog] = useState(null) // 'baseline' | 'result'

  const fetchGoal = async () => {
    try {
      const [goalRes, histRes] = await Promise.all([
        goalsApi.get(goal_no),
        goalsApi.getHistory(goal_no),
      ])
      setGoal(goalRes.data?.goal || goalRes.data?.data || goalRes.data)
      setHistory(histRes.data?.history || histRes.data?.data || (Array.isArray(histRes.data) ? histRes.data : []))
    } catch (err) {
      console.error('Goal detail error:', err)
      toast.error('Failed to load goal details')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchGoal()
  }, [goal_no])

  const handleStatusChange = async (status) => {
    setActionLoading(true)
    try {
      await goalsApi.updateStatus(goal_no, status)
      toast.success('Goal status updated')
      fetchGoal()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update status')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDialogSubmit = async (values) => {
    setActionLoading(true)
    try {
      if (dialog === 'baseline') {
        await goalsApi.updateBaseline(goal_no, values)
        toast.success('Baseline set successfully')
      } else if (dialog === 'result') {
        await goalsApi.updateResult(goal_no, values)
        toast.success('Result updated successfully')
      }
      setDialog(null)
      fetchGoal()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update')
    } finally {
      setActionLoading(false)
    }
  }

  // Progress calculation for By Value
  const getValueProgress = () => {
    if (!goal) return 0
    const start = parseFloat(goal.start_value) || 0
    const target = parseFloat(goal.target_value) || 100
    const achieved = parseFloat(goal.achieved_value) || 0
    if (target === start) return 0
    return Math.min(100, Math.max(0, ((achieved - start) / (target - start)) * 100))
  }

  const getBaselineFields = () => {
    const gt = goal?.goal_type
    if (gt === 1) return [
      { key: 'start_value', label: 'Start Value', type: 'number', placeholder: '0' },
      { key: 'target_value', label: 'Target Value', type: 'number', placeholder: '100' },
    ]
    if (gt === 2) return [
      { key: 'start_date', label: 'Start Date', type: 'date' },
      { key: 'target_date', label: 'Target Date', type: 'date' },
    ]
    if (gt === 3) return [
      { key: 'start_state', label: 'Start State', placeholder: 'e.g. Pending' },
      { key: 'target_state', label: 'Target State', placeholder: 'e.g. Completed' },
    ]
    return []
  }

  const getResultFields = () => {
    const gt = goal?.goal_type
    if (gt === 1) return [{ key: 'achieved_value', label: 'Achieved Value', type: 'number', placeholder: '0' }]
    if (gt === 2) return [{ key: 'achieved_date', label: 'Achieved Date', type: 'date' }]
    if (gt === 3) return [{ key: 'achieved_state', label: 'Achieved State', placeholder: 'e.g. Completed' }]
    return []
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5">
        <Skeleton className="h-6 w-32" />
        <Card className="border-slate-200">
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-3 mt-4">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!goal) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <p className="text-slate-500">Goal not found.</p>
        <Link href="/goals"><Button className="mt-4">Back to Goals</Button></Link>
      </div>
    )
  }

  const status = goal.status

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <Link href="/goals" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-indigo-600 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Goals
      </Link>

      {/* Goal info card */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
                <Target className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-slate-900 leading-tight">{goal.goal_name}</h2>
                <p className="text-sm text-slate-500 mt-0.5">{goal.cycle?.cycle_name}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <GoalTypeBadge type={goal.goal_type} />
                  <GoalStatusBadge status={goal.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Details grid */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Weight</p>
              <p className="mt-1 font-semibold text-slate-800">{goal.weight}%</p>
            </div>
            {goal.deadline && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Deadline</p>
                <p className="mt-1 font-semibold text-slate-800 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  {format(new Date(goal.deadline), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>

          {goal.description && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1.5">Description</p>
                <p className="text-sm text-slate-600 leading-relaxed">{goal.description}</p>
              </div>
            </>
          )}

          {goal.how_to_measure && (
            <div className="mt-3">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1.5">How to Measure</p>
              <p className="text-sm text-slate-600 leading-relaxed">{goal.how_to_measure}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Progress section */}
      {status >= 2 && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" /> Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {goal.goal_type === 1 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Start: {goal.start_value ?? '—'}</span>
                  <span className="text-slate-800 font-semibold">
                    Achieved: {goal.achieved_value ?? '—'} / {goal.target_value ?? '—'}
                  </span>
                </div>
                <Progress value={getValueProgress()} className="h-3" />
                <p className="text-xs text-slate-400 text-right">{getValueProgress().toFixed(1)}%</p>
              </div>
            )}
            {goal.goal_type === 2 && (
              <div className="grid grid-cols-3 gap-4 text-sm text-center">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-400 mb-1">Start Date</p>
                  <p className="font-semibold text-slate-700">{goal.start_date ? format(new Date(goal.start_date), 'MMM d, yyyy') : '—'}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-xs text-slate-400 mb-1">Achieved</p>
                  <p className="font-semibold text-green-700">{goal.achieved_date ? format(new Date(goal.achieved_date), 'MMM d, yyyy') : '—'}</p>
                </div>
                <div className="rounded-lg bg-indigo-50 p-3">
                  <p className="text-xs text-slate-400 mb-1">Target Date</p>
                  <p className="font-semibold text-indigo-700">{goal.target_date ? format(new Date(goal.target_date), 'MMM d, yyyy') : '—'}</p>
                </div>
              </div>
            )}
            {goal.goal_type === 3 && (
              <div className="grid grid-cols-3 gap-4 text-sm text-center">
                <div className="rounded-lg bg-slate-50 p-3">
                  <p className="text-xs text-slate-400 mb-1">Start State</p>
                  <p className="font-semibold text-slate-700">{goal.start_state || '—'}</p>
                </div>
                <div className="rounded-lg bg-green-50 p-3">
                  <p className="text-xs text-slate-400 mb-1">Achieved</p>
                  <p className="font-semibold text-green-700">{goal.achieved_state || '—'}</p>
                </div>
                <div className="rounded-lg bg-indigo-50 p-3">
                  <p className="text-xs text-slate-400 mb-1">Target State</p>
                  <p className="font-semibold text-indigo-700">{goal.target_state || '—'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {status === 1 && (
              <>
                <Button
                  onClick={() => setDialog('baseline')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={actionLoading}
                >
                  Set Baseline
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange(5)}
                  disabled={actionLoading}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </Button>
              </>
            )}
            {status === 2 && (
              <>
                <Button
                  onClick={() => setDialog('result')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  disabled={actionLoading}
                >
                  Update Result
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange(3)}
                  disabled={actionLoading}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Successful
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange(4)}
                  disabled={actionLoading}
                  className="border-red-300 text-red-700 hover:bg-red-50"
                >
                  <XCircle className="mr-2 h-4 w-4" /> Mark Failed
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleStatusChange(5)}
                  disabled={actionLoading}
                  className="border-amber-300 text-amber-700 hover:bg-amber-50"
                >
                  <Archive className="mr-2 h-4 w-4" /> Archive
                </Button>
              </>
            )}
            {actionLoading && <Loader2 className="h-5 w-5 animate-spin text-indigo-600 self-center" />}
          </div>
        </CardContent>
      </Card>

      {/* Reviewers */}
      <ReviewerSection goalNo={goal_no} />

      {/* Comments */}
      <CommentThread goalNo={goal_no} />

      {/* History */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Change History
              <span className="text-xs font-normal text-slate-400">({history.length})</span>
            </span>
            {historyOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          <HistoryTimeline history={history} open={historyOpen} />
        </CardContent>
      </Card>

      {/* Action dialogs */}
      <ActionDialog
        open={dialog === 'baseline'}
        onClose={() => setDialog(null)}
        title="Set Baseline"
        fields={getBaselineFields()}
        onSubmit={handleDialogSubmit}
        loading={actionLoading}
      />
      <ActionDialog
        open={dialog === 'result'}
        onClose={() => setDialog(null)}
        title="Update Result"
        fields={getResultFields()}
        onSubmit={handleDialogSubmit}
        loading={actionLoading}
      />
    </div>
  )
}
