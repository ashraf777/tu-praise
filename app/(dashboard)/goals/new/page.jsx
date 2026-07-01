'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { goalsApi, cyclesApi, employeesApi } from '@/lib/api'
import { getEmployee } from '@/lib/auth'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Target, Hash } from 'lucide-react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const GOAL_TYPES = [
  { value: '1', label: 'By Value', description: 'Track progress by numeric values' },
  { value: '2', label: 'By Date', description: 'Track progress by date milestones' },
  { value: '3', label: 'By State', description: 'Track progress by state/status changes' },
]

export default function NewGoalPage() {
  const router = useRouter()
  const [cycles, setCycles] = useState([])
  const [loadingCycles, setLoadingCycles] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [employees, setEmployees] = useState([])
  const [currentUser, setCurrentUser] = useState(null)

  const [startValueInput, setStartValueInput] = useState('')
  const [targetValueInput, setTargetValueInput] = useState('')
  
  const [form, setForm] = useState({
    cycle_no: '',
    employee_no: '',
    goal_name: '',
    description: '',
    how_to_measure: '',
    weight: '',
    deadline: '',
    goal_type: '',
    primary_reviewer: '',
    secondary_reviewer: '',
    // By Value
    target_value: '',
    start_value: '',
    // By Date
    target_date: '',
    start_date: '',
    // By State
    target_state: '',
    start_state: '',
  })

  async function fetchEmployees() {
    try {
      const res = await employeesApi.list()
      const data = res.data?.employees || res.data?.data || (Array.isArray(res.data) ? res.data : [])
      setEmployees(data)
    } catch (err) {
      console.error('Employees fetch error:', err)
    }
  }

  async function fetchCycles() {
    try {
      const res = await cyclesApi.list({ status: 1 })
      const data = res.data?.cycles || res.data?.data || (Array.isArray(res.data) ? res.data : [])
      
      // Sort cycle names in ascending order
      const sortedCycles = [...data].sort((a, b) => 
        (a.cycle_name || '').localeCompare(b.cycle_name || '', undefined, { numeric: true, sensitivity: 'base' })
      )
      
      setCycles(sortedCycles)
    } catch (err) {
      console.error('Cycles error:', err)
      toast.error('Failed to load cycles')
    } finally {
      setLoadingCycles(false)
    }
  }

  useEffect(() => {
    const init = () => {
      const user = getEmployee()
      setCurrentUser(user)
      fetchEmployees()
      fetchCycles()
    }
    init()
  }, [])

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target?.value ?? e }))

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!form.cycle_no || !form.goal_name || !form.weight || !form.goal_type) {
      toast.error('Please fill in all required fields.')
      return
    }

    const payload = {
      cycle_no: parseInt(form.cycle_no),
      goal_name: form.goal_name,
      desc: form.description,
      how_to_measure: form.how_to_measure,
      weight: parseInt(form.weight, 10),
      deadline: form.deadline || null,
      goal_type: parseInt(form.goal_type),
    }

    if (form.employee_no && form.employee_no !== 'myself') {
      // no-op: goals are always created for the current user
    }

    const gt = parseInt(form.goal_type)
    if (gt === 1) {
      payload.target_value = parseInt(form.target_value, 10) || 0
      payload.start_value = parseInt(form.start_value, 10) || 0
    } else if (gt === 2) {
      payload.target_date = form.target_date
      payload.start_date = form.start_date
    } else if (gt === 3) {
      payload.target_state = form.target_state
      payload.start_state = form.start_state
    }

    setSubmitting(true)
    try {
      const res = await goalsApi.create(payload)
      const goal = res.data?.goal || res.data?.data || res.data

      // Chain reviewer creations
      if (form.primary_reviewer) {
        try {
          await goalsApi.addReviewer(goal.goal_no, {
            reviewer: parseInt(form.primary_reviewer, 10),
            reviewer_type: 1
          })
        } catch (rErr) {
          console.error("Failed to add primary reviewer:", rErr)
        }
      }

      if (form.secondary_reviewer) {
        try {
          await goalsApi.addReviewer(goal.goal_no, {
            reviewer: parseInt(form.secondary_reviewer, 10),
            reviewer_type: 2
          })
        } catch (rErr) {
          console.error("Failed to add secondary reviewer:", rErr)
        }
      }

      toast.success('Goal created successfully!')
      router.push(`/goals/${goal.goal_no}`)
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create goal.'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back link */}
      <Link href="/goals" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Goals
      </Link>

      <div>
        <h2 className="text-xl font-bold text-slate-900">Create New Goal</h2>
        <p className="text-xs text-slate-500 mt-0.5">Define a measurable performance goal</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Basic info */}
        <Card className="border-slate-200 shadow-sm rounded-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Goal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Cycle */}
            <div className="space-y-2">
              <Label>Cycle <span className="text-red-500">*</span></Label>
              <Select value={form.cycle_no} onValueChange={set('cycle_no')} disabled={loadingCycles}>
                <SelectTrigger className="bg-slate-50 border-slate-200">
                  <SelectValue placeholder={loadingCycles ? 'Loading...' : 'Select a cycle'} />
                </SelectTrigger>
                <SelectContent>
                  {cycles.map((c) => (
                    <SelectItem key={c.cycle_no} value={String(c.cycle_no)}>
                      {c.cycle_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>



            {/* Goal name */}
            <div className="space-y-2">
              <Label htmlFor="goal_name">
                Goal Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="goal_name"
                placeholder="e.g. Increase customer satisfaction score"
                value={form.goal_name}
                onChange={set('goal_name')}
                className="h-10"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this goal in detail…"
                value={form.description}
                onChange={set('description')}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* How to measure */}
            <div className="space-y-2">
              <Label htmlFor="how_to_measure">How to Measure</Label>
              <Textarea
                id="how_to_measure"
                placeholder="Describe how progress will be measured…"
                value={form.how_to_measure}
                onChange={set('how_to_measure')}
                rows={2}
                className="resize-none"
              />
            </div>

            {/* Weight + Deadline */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight">
                  Weight <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="weight"
                  type="number"
                  min="1"
                  placeholder="e.g. 30"
                  value={form.weight}
                  onChange={set('weight')}
                  className="h-10"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={form.deadline}
                  onChange={set('deadline')}
                  className="h-10"
                />
              </div>
            </div>

            {/* Reviewer Assignment directly inside creation */}
            <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
              <div className="space-y-2">
                <Label>Primary Reviewer</Label>
                <Select
                  value={form.primary_reviewer}
                  onValueChange={(val) => setForm(f => ({ ...f, primary_reviewer: val }))}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select primary reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter(e => e.employee_no !== currentUser?.employee_no && String(e.employee_no) !== form.secondary_reviewer)
                      .map((e) => (
                        <SelectItem key={e.employee_no} value={String(e.employee_no)}>
                          {e.employee_name || e.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Secondary Reviewer</Label>
                <Select
                  value={form.secondary_reviewer}
                  onValueChange={(val) => setForm(f => ({ ...f, secondary_reviewer: val }))}
                >
                  <SelectTrigger className="bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Select secondary reviewer" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter(e => e.employee_no !== currentUser?.employee_no && String(e.employee_no) !== form.primary_reviewer)
                      .map((e) => (
                        <SelectItem key={e.employee_no} value={String(e.employee_no)}>
                          {e.employee_name || e.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goal Type */}
        <Card className="border-slate-200 shadow-sm rounded-md">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Hash className="h-4 w-4 text-primary" />
              Goal Type &amp; Targets
            </CardTitle>
            <CardDescription>Choose how this goal will be tracked</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Goal type radio cards */}
            <div className="grid grid-cols-3 gap-3">
              {GOAL_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, goal_type: type.value }))}
                  className={`rounded-xl border-2 p-3 text-left transition-all ${
                    form.goal_type === type.value
                      ? 'border-primary bg-indigo-50/30'
                      : 'border-slate-200 hover:border-primary/50 hover:bg-slate-50'
                  }`}
                >
                  <p className={`font-semibold text-sm ${form.goal_type === type.value ? 'text-primary' : 'text-slate-700'}`}>
                    {type.label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{type.description}</p>
                </button>
              ))}
            </div>

            {/* Conditional fields */}
            {form.goal_type === '1' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>Start Value</Label>
                  <Input
                    placeholder="0"
                    value={startValueInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '');
                      if (raw === '' || /^\d+$/.test(raw)) {
                        setStartValueInput(raw ? Number(raw).toLocaleString() : '');
                        setForm(f => ({ ...f, start_value: raw }));
                      }
                    }}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Value</Label>
                  <Input
                    placeholder="100"
                    value={targetValueInput}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/,/g, '');
                      if (raw === '' || /^\d+$/.test(raw)) {
                        setTargetValueInput(raw ? Number(raw).toLocaleString() : '');
                        setForm(f => ({ ...f, target_value: raw }));
                      }
                    }}
                    className="h-10"
                  />
                </div>
              </div>
            )}

            {form.goal_type === '2' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.start_date} onChange={set('start_date')} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Target Date</Label>
                  <Input type="date" value={form.target_date} onChange={set('target_date')} className="h-10" />
                </div>
              </div>
            )}

            {form.goal_type === '3' && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>Start State</Label>
                  <Input placeholder="e.g. Pending" value={form.start_state} onChange={set('start_state')} className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label>Target State</Label>
                  <Input placeholder="e.g. Completed" value={form.target_state} onChange={set('target_state')} className="h-10" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3 justify-end">
          <Link href="/goals">
            <Button type="button" variant="outline" disabled={submitting}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="bg-primary hover:bg-primary/95 text-white px-6 font-semibold"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create Goal'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
