'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { goalsApi, GOAL_STATUSES } from '@/lib/api'
import { getEmployee } from '@/lib/auth'
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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  ArrowLeft, Target, Calendar, ChevronDown, ChevronUp,
  Loader2, CheckCircle2, XCircle, Archive, BarChart3, Clock
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const formatChanges = (beforeStr, afterStr) => {
  try {
    const before = JSON.parse(beforeStr || '{}')
    const after = JSON.parse(afterStr || '{}')
    const changes = []
    let reason = ''
    for (const key in after) {
      if (key === 'reason') {
        reason = after[key]
        continue
      }
      if (before[key] !== after[key]) {
        const keyLabel = key.replace(/_/g, ' ')
        const formatVal = (v) => {
          if (key === 'status') {
            return GOAL_STATUSES[v]?.label || v
          }
          return (v !== null && v !== undefined && !isNaN(v) && key.includes('value') ? Number(v).toLocaleString() : v)
        }
        changes.push(`${keyLabel}: ${formatVal(before[key]) ?? 'none'} → ${formatVal(after[key]) ?? 'none'}`)
      }
    }
    let res = changes.length ? changes.join(' \n ') : ''
    if (reason) {
      res = (res ? res + ' \n ' : '') + `Remark: "${reason}"`
    }
    return res
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
function ActionDialog({ open, onClose, title, fields, onSubmit, loading, isBaseline, goal }) {
  const [values, setValues] = useState({})
  const [displayValues, setDisplayValues] = useState({})
  const [reason, setReason] = useState('')

  useEffect(() => {
    const init = () => {
      if (open && goal) {
        const initialValues = {}
        const initialDisplay = {}
        fields.forEach(field => {
          let val = goal[field.key]
          if (val === null || val === undefined) {
            if (field.key === 'achieved_value') {
              val = goal.start_value !== null && goal.start_value !== undefined ? goal.start_value : ''
            } else if (field.key === 'achieved_date') {
              val = goal.achieved_date ? goal.achieved_date.split('T')[0] : (goal.deadline ? goal.deadline.split('T')[0] : '')
            } else if (field.key === 'achieved_state') {
              val = goal.start_state !== null && goal.start_state !== undefined ? goal.start_state : ''
            } else {
              val = ''
            }
          } else if (field.type === 'date' || field.key.includes('date')) {
            val = val.split('T')[0]
          }
          
          initialValues[field.key] = val
          if (field.key.includes('value') && val !== '') {
            initialDisplay[field.key] = Number(val).toLocaleString()
          } else {
            initialDisplay[field.key] = val
          }
        })
        setValues(initialValues)
        setDisplayValues(initialDisplay)
        setReason('')
      } else if (open) {
        setValues({})
        setDisplayValues({})
        setReason('')
      }
    }
    init()
  }, [open, goal, fields])

  const handleChange = (key, isNumeric) => (e) => {
    const raw = e.target.value
    if (isNumeric) {
      const clean = raw.replace(/,/g, '')
      if (clean === '' || /^\d+$/.test(clean)) {
        setDisplayValues(d => ({ ...d, [key]: clean ? Number(clean).toLocaleString() : '' }))
        setValues(v => ({ ...v, [key]: clean ? parseInt(clean, 10) : '' }))
      }
    } else {
      setValues(v => ({ ...v, [key]: raw }))
      setDisplayValues(d => ({ ...d, [key]: raw }))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isBaseline && !reason.trim()) {
      toast.error('Remark/Reason is required')
      return
    }
    onSubmit({ ...values, reason })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Fill in the required information below.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {fields.map((field) => {
            const isNumeric = field.key.includes('value')
            return (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input
                  id={field.key}
                  type={field.type || "text"}
                  placeholder={field.placeholder}
                  value={isNumeric ? (displayValues[field.key] || '') : (values[field.key] || '')}
                  onChange={handleChange(field.key, isNumeric)}
                  className="h-10"
                />
              </div>
            )
          })}
          {isBaseline && (
            <div className="space-y-2">
              <Label htmlFor="baseline_reason">Remark / Reason</Label>
              <Textarea
                id="baseline_reason"
                placeholder="Enter a remark to document baselining..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                required
              />
            </div>
          )}
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-semibold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Dialog for editing/revising goal details
function EditGoalDialog({ open, onClose, goal, onSubmit, loading }) {
  const [form, setForm] = useState({})
  const [reason, setReason] = useState('')

  useEffect(() => {
    const init = () => {
      if (open && goal) {
        setForm({
          goal_name: goal.goal_name || '',
          desc: goal.desc || '',
          how_to_measure: goal.how_to_measure || '',
          weight: goal.weight || '',
          deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
          target_value: goal.target_value || '',
          target_date: goal.target_date || '',
          target_state: goal.target_state || '',
        })
        setReason('')
      }
    }
    init()
  }, [open, goal])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.goal_name?.trim()) {
      toast.error('Goal name is required')
      return
    }
    if (goal.status === 2 && !reason.trim()) {
      toast.error('Revision reason is required')
      return
    }
    onSubmit({ ...form, reason })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{goal?.status === 2 ? 'Revise Goal' : 'Edit Goal'}</DialogTitle>
          <DialogDescription>
            {goal?.status === 2 ? 'Revision reason is required and will be logged.' : 'Update the goal details below.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="edit_goal_name">Goal Name</Label>
            <Input id="edit_goal_name" value={form.goal_name} onChange={(e) => setForm(f => ({ ...f, goal_name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_desc">Description</Label>
            <Textarea id="edit_desc" value={form.desc} onChange={(e) => setForm(f => ({ ...f, desc: e.target.value }))} rows={3} className="resize-none" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit_how_to_measure">How to Measure</Label>
            <Textarea id="edit_how_to_measure" value={form.how_to_measure} onChange={(e) => setForm(f => ({ ...f, how_to_measure: e.target.value }))} rows={2} className="resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit_weight">Weight</Label>
              <Input id="edit_weight" type="number" min="0" max="100" value={form.weight} onChange={(e) => setForm(f => ({ ...f, weight: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_deadline">Deadline</Label>
              <Input id="edit_deadline" type="date" value={form.deadline} onChange={(e) => setForm(f => ({ ...f, deadline: e.target.value }))} />
            </div>
          </div>

          {goal?.goal_type === 1 && (
            <div className="space-y-2">
              <Label htmlFor="edit_target_value">Target Value</Label>
              <Input id="edit_target_value" type="number" value={form.target_value} onChange={(e) => setForm(f => ({ ...f, target_value: e.target.value }))} />
            </div>
          )}
          {goal?.goal_type === 2 && (
            <div className="space-y-2">
              <Label htmlFor="edit_target_date">Target Date</Label>
              <Input id="edit_target_date" type="date" value={form.target_date} onChange={(e) => setForm(f => ({ ...f, target_date: e.target.value }))} />
            </div>
          )}
          {goal?.goal_type === 3 && (
            <div className="space-y-2">
              <Label htmlFor="edit_target_state">Target State</Label>
              <Input id="edit_target_state" value={form.target_state} onChange={(e) => setForm(f => ({ ...f, target_state: e.target.value }))} />
            </div>
          )}

          {goal?.status === 2 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <Label htmlFor="edit_reason" className="text-red-600 font-semibold">Revision Reason (Remark)</Label>
              <Textarea id="edit_reason" placeholder="Enter reason for revision..." value={reason} onChange={(e) => setReason(e.target.value)} rows={2} required />
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-semibold" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Dialog for status change remarks
function StatusChangeDialog({ open, onClose, targetStatus, onSubmit, loading }) {
  const [reason, setReason] = useState('')

  useEffect(() => {
    const init = () => {
      if (open) setReason('')
    }
    init()
  }, [open])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!reason.trim()) {
      toast.error('Remark/Reason is required')
      return
    }
    onSubmit(reason)
  }

  const getTitle = () => {
    if (targetStatus === 2) return 'Baseline Goal'
    if (targetStatus === 3) return 'Mark Goal Successful'
    if (targetStatus === 4) return 'Mark Goal Failed'
    if (targetStatus === 5) return 'Archive Goal'
    return 'Change Status'
  }

  const isArchive = targetStatus === 5

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>
            {isArchive ? (
              <span className="text-amber-600 font-semibold block mb-2">
                ⚠️ Archived Goals cannot be edited. Do you want to proceed?
              </span>
            ) : (
              'Enter a remark to document this status transition.'
            )}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="status_change_reason">Remark / Reason</Label>
            <Textarea
              id="status_change_reason"
              placeholder="Enter your remark..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className={cn("text-white font-semibold", isArchive ? "bg-amber-600 hover:bg-amber-700" : "bg-primary hover:bg-primary/95")} disabled={loading}>
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
  const [dialog, setDialog] = useState(null) // 'baseline' | 'result' | 'revise'
  const [currentUser, setCurrentUser] = useState(null)
  const [statusChangeTarget, setStatusChangeTarget] = useState(null)

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
    const init = () => {
      setCurrentUser(getEmployee())
      fetchGoal()
    }
    init()
  }, [goal_no])

  const handleStatusChangeSubmit = async (reason) => {
    if (!statusChangeTarget) return
    setActionLoading(true)
    try {
      await goalsApi.updateStatus(goal_no, { status: statusChangeTarget, reason })
      toast.success('Goal status updated')
      setStatusChangeTarget(null)
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
      } else if (dialog === 'revise') {
        await goalsApi.update(goal_no, values)
        toast.success('Goal updated successfully')
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
      { key: 'start_value', label: 'Start Value', placeholder: '0' },
      { key: 'target_value', label: 'Target Value', placeholder: '100' },
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
    if (gt === 1) return [{ key: 'achieved_value', label: 'Achieved Value', placeholder: '0' }]
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

  const formatNumber = (val) => {
    if (val === null || val === undefined) return '—'
    return Number(val).toLocaleString()
  }

  const isReadOnly = goal && currentUser && parseInt(goal.created_by) === parseInt(currentUser.employee_no) && parseInt(goal.employee_no) !== parseInt(currentUser.employee_no)

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Back */}
      <Link href="/goals" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back to Goals
      </Link>

      {/* Stepper Card */}
      <Card className="border border-slate-200 border-t-[3px] border-t-primary shadow-sm rounded-none bg-white p-6 font-sans">
        {/* Stepper Steps visual line */}
        <div className="flex items-center justify-between w-full mb-6 px-4">
          <div className="flex items-center flex-1">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full font-semibold text-xs border-2 shrink-0",
              status >= 1 ? "bg-primary text-white border-primary" : "border-slate-300 text-slate-400"
            )}>
              1
            </div>
            <div className="ml-2 hidden sm:block">
              <p className="text-xs font-bold text-slate-800">Draft</p>
              <p className="text-[10px] text-slate-400">Created Mode</p>
            </div>
          </div>
          
          <div className={cn("h-0.5 flex-grow bg-slate-200 mx-4", status >= 2 && "bg-primary")} />

          <div className="flex items-center flex-grow-0 sm:flex-grow">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full font-semibold text-xs border-2 shrink-0",
              status >= 2 ? "bg-primary text-white border-primary" : "border-slate-300 text-slate-400"
            )}>
              2
            </div>
            <div className="ml-2 hidden sm:block">
              <p className="text-xs font-bold text-slate-800">Baselined</p>
              <p className="text-[10px] text-slate-400">Active Mode</p>
            </div>
          </div>

          <div className={cn("h-0.5 flex-grow bg-slate-200 mx-4", status >= 3 && "bg-primary")} />

          <div className="flex items-center flex-1">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full font-semibold text-xs border-2 shrink-0",
              status === 3 ? "bg-[#28a745] text-white border-[#28a745]" :
              status === 4 ? "bg-[#dc3545] text-white border-[#dc3545]" :
              status === 5 ? "bg-[#ffc107] text-white border-[#ffc107]" :
              "border-slate-300 text-slate-400"
            )}>
              3
            </div>
            <div className="ml-2 hidden sm:block">
              <p className="text-xs font-bold text-slate-800">
                {status === 3 ? "Succeeded" : status === 4 ? "Failed" : status === 5 ? "Archived" : "Outcome"}
              </p>
              <p className="text-[10px] text-slate-400">Final State</p>
            </div>
          </div>
        </div>

        {/* Stepper Status Info & Action buttons (only if not read-only) */}
        {!isReadOnly && (
          <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Status Actions</p>
              <p className="text-sm text-slate-700 mt-1 font-medium">
                Current State: <span className="font-bold text-primary">{status === 1 ? 'Draft (Created)' : status === 2 ? 'Active (Baselined)' : status === 3 ? 'Successful' : status === 4 ? 'Failed' : 'Archived'}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {status === 1 && (
                <>
                  <Button
                    onClick={() => setDialog('baseline')}
                    className="bg-primary hover:bg-primary/95 text-white font-semibold"
                    disabled={actionLoading}
                  >
                    Baseline Goal
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStatusChangeTarget(5)}
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
                    className="bg-primary hover:bg-primary/95 text-white font-semibold"
                    disabled={actionLoading}
                  >
                    Update Progress
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStatusChangeTarget(3)}
                    disabled={actionLoading}
                    className="border-green-300 text-green-700 hover:bg-green-50"
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Successful
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStatusChangeTarget(4)}
                    disabled={actionLoading}
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="mr-2 h-4 w-4" /> Mark Failed
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setStatusChangeTarget(5)}
                    disabled={actionLoading}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <Archive className="mr-2 h-4 w-4" /> Archive
                  </Button>
                </>
              )}
              {status === 3 && (
                <Button
                  variant="outline"
                  onClick={() => setStatusChangeTarget(2)}
                  disabled={actionLoading}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Re-open (Set back to Baselined)
                </Button>
              )}
              {status === 4 && (
                <Button
                  variant="outline"
                  onClick={() => setStatusChangeTarget(2)}
                  disabled={actionLoading}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Re-open (Set back to Baselined)
                </Button>
              )}
              {status === 5 && (
                <span className="text-xs text-slate-400 font-medium italic select-none">
                  Archived goal cannot be changed anymore.
                </span>
              )}
              {actionLoading && <Loader2 className="h-5 w-5 animate-spin text-primary self-center" />}
            </div>
          </div>
        )}
      </Card>

      {/* Goal info card */}
      <Card className="border border-slate-200 border-t-[3px] border-t-primary shadow-sm rounded-none bg-white">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 text-slate-600">
                <Target className="h-6 w-6 text-primary" />
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
            {!isReadOnly && goal.status <= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialog('revise')}
                className="h-8 text-xs font-semibold shrink-0"
              >
                {goal.status === 2 ? 'Revise Goal' : 'Edit Goal'}
              </Button>
            )}
          </div>

          {/* Details grid */}
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Weight</p>
              <p className="mt-1 font-semibold text-slate-800">{goal.weight}</p>
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
            {goal.revision_count > 0 && (
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">Revisions</p>
                <p className="mt-1 font-semibold text-indigo-600">{goal.revision_count}</p>
              </div>
            )}
          </div>

          {goal.desc && (
            <>
              <Separator className="my-4" />
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-1.5">Description</p>
                <p className="text-sm text-slate-600 leading-relaxed">{goal.desc}</p>
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
        <Card className="border border-slate-200 border-t-[3px] border-t-primary shadow-sm rounded-none bg-white">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            {goal.goal_type === 1 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Start: {formatNumber(goal.start_value)}</span>
                  <span className="text-slate-800 font-semibold">
                    Achieved: {formatNumber(goal.achieved_value)} / {formatNumber(goal.target_value)}
                  </span>
                </div>
                <Progress value={getValueProgress()} className="h-3 bg-slate-100" />
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
                <div className="rounded-lg bg-indigo-50/50 p-3">
                  <p className="text-xs text-slate-400 mb-1">Target Date</p>
                  <p className="font-semibold text-primary">{goal.target_date ? format(new Date(goal.target_date), 'MMM d, yyyy') : '—'}</p>
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
                <div className="rounded-lg bg-indigo-50/50 p-3">
                  <p className="text-xs text-slate-400 mb-1">Target State</p>
                  <p className="font-semibold text-primary">{goal.target_state || '—'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Reviewers */}
      <ReviewerSection goalNo={goal_no} readOnly={isReadOnly} status={goal.status} />

      {/* Comments */}
      <CommentThread goalNo={goal_no} readOnly={isReadOnly} />

      {/* History */}
      <Card className="border border-slate-200 shadow-sm rounded-none bg-white">
        <CardContent className="p-4">
          <button
            type="button"
            onClick={() => setHistoryOpen((v) => !v)}
            className="flex w-full items-center justify-between text-sm font-semibold text-slate-700 hover:text-primary transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-slate-400" /> Change History
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
        isBaseline={true}
        goal={goal}
      />
      <ActionDialog
        open={dialog === 'result'}
        onClose={() => setDialog(null)}
        title="Update Progress"
        fields={getResultFields()}
        onSubmit={handleDialogSubmit}
        loading={actionLoading}
        isBaseline={false}
        goal={goal}
      />

      <EditGoalDialog
        open={dialog === 'revise'}
        onClose={() => setDialog(null)}
        goal={goal}
        onSubmit={handleDialogSubmit}
        loading={actionLoading}
      />

      <StatusChangeDialog
        open={statusChangeTarget !== null}
        onClose={() => setStatusChangeTarget(null)}
        targetStatus={statusChangeTarget}
        onSubmit={handleStatusChangeSubmit}
        loading={actionLoading}
      />
    </div>
  )
}
