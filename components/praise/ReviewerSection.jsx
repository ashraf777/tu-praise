'use client'

import { useEffect, useState } from 'react'
import { goalsApi, employeesApi } from '@/lib/api'
import { REVIEWER_TYPES } from '@/lib/api'
import { getEmployee } from '@/lib/auth'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { UserCheck, Plus, Trash2, Loader2 } from 'lucide-react'

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

export function ReviewerSection({ goalNo, readOnly }) {
  const [reviewers, setReviewers] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
  const [form, setForm] = useState({ employee_no: '', reviewer_type: '' })

  const fetchReviewers = async () => {
    try {
      const res = await goalsApi.getReviewers(goalNo)
      setReviewers(res.data?.data?.reviewers || res.data?.reviewers || res.data?.data || (Array.isArray(res.data) ? res.data : []))
    } catch {}
    finally { setLoading(false) }
  }

  const fetchEmployees = async () => {
    try {
      const res = await employeesApi.list()
      setEmployees(res.data?.data?.employees || res.data?.employees || res.data?.data || (Array.isArray(res.data) ? res.data : []))
    } catch {}
  }

  useEffect(() => {
    const init = () => {
      setCurrentUser(getEmployee())
      fetchReviewers()
      fetchEmployees()
    }
    init()
  }, [goalNo])

  const handleAdd = async () => {
    if (!form.employee_no || !form.reviewer_type) {
      toast.error('Select employee and reviewer type')
      return
    }
    setAdding(true)
    try {
      await goalsApi.addReviewer(goalNo, {
        reviewer: parseInt(form.employee_no),
        reviewer_type: parseInt(form.reviewer_type),
      })
      toast.success('Reviewer added')
      setDialogOpen(false)
      setForm({ employee_no: '', reviewer_type: '' })
      fetchReviewers()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add reviewer')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (reviewerNo) => {
    setRemoving(reviewerNo)
    try {
      await goalsApi.removeReviewer(goalNo, reviewerNo)
      toast.success('Reviewer removed')
      setReviewers((r) => r.filter((rv) => rv.reviewer_no !== reviewerNo))
    } catch {
      toast.error('Failed to remove reviewer')
    } finally {
      setRemoving(null)
    }
  }

  const hasPrimary = reviewers.some(r => parseInt(r.reviewer_type) === 1)
  const hasSecondary = reviewers.some(r => parseInt(r.reviewer_type) === 2)
  const isMaxReviewers = hasPrimary && hasSecondary

  return (
    <Card className="border border-slate-200 border-t-[3px] border-t-primary shadow-sm rounded-none bg-white font-sans">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3 border-b border-slate-100">
        <CardTitle className="text-base font-semibold flex items-center gap-2 text-slate-800">
          <UserCheck className="h-4 w-4 text-primary" /> Reviewers
        </CardTitle>
        {!readOnly && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setDialogOpen(true)}
            disabled={isMaxReviewers}
            className="h-8 text-xs font-semibold"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Reviewer
          </Button>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="space-y-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : reviewers.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No reviewers assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {reviewers.map((r) => (
              <div key={r.reviewer_no} className="flex items-center gap-3 rounded-lg hover:bg-slate-50 p-2 -mx-2">
                <Avatar className="h-9 w-9 bg-slate-100 border border-slate-200">
                  <AvatarFallback className="bg-slate-100 text-slate-700 text-xs font-semibold">
                    {getInitials((r.reviewer_employee || r.employee)?.employee_name || (r.reviewer_employee || r.employee)?.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{(r.reviewer_employee || r.employee)?.employee_name || (r.reviewer_employee || r.employee)?.name}</p>
                  <p className="text-[10px] text-slate-400">{REVIEWER_TYPES[r.reviewer_type] || 'Reviewer'}</p>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => handleRemove(r.reviewer_no)}
                    disabled={removing === r.reviewer_no}
                    className="p-1.5 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    {removing === r.reviewer_no
                      ? <Loader2 className="h-4 w-4 animate-spin" />
                      : <Trash2 className="h-4 w-4" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Reviewer</DialogTitle>
            <DialogDescription>Select an employee to review this goal.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={form.employee_no} onValueChange={(v) => setForm((f) => ({ ...f, employee_no: v }))}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select employee…" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter((e) => e.employee_no !== currentUser?.employee_no)
                    .map((e) => (
                      <SelectItem key={e.employee_no} value={String(e.employee_no)}>
                        {e.employee_name || e.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reviewer Type</Label>
              <Select value={form.reviewer_type} onValueChange={(v) => setForm((f) => ({ ...f, reviewer_type: v }))}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select type…" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REVIEWER_TYPES)
                    .filter(([k]) => {
                      if (parseInt(k) === 1 && hasPrimary) return false
                      if (parseInt(k) === 2 && hasSecondary) return false
                      return true
                    })
                    .map(([k, v]) => (
                      <SelectItem key={k} value={String(k)}>{v}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={adding}>Cancel</Button>
            <Button onClick={handleAdd} className="bg-primary hover:bg-primary/95 text-white font-semibold" disabled={adding}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
