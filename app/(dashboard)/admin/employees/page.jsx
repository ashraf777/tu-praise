'use client'

import { useEffect, useState } from 'react'
import { employeesApi, clientsApi } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Users, Plus, Pencil, ToggleLeft, ToggleRight, Loader2, Search } from 'lucide-react'

const ROLES = [
  { value: 'employee', label: 'Employee' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'hr_admin', label: 'HR Admin' },
]

const ROLE_COLORS = {
  employee: 'bg-slate-100 text-slate-700',
  supervisor: 'bg-blue-100 text-blue-700',
  hr_admin: 'bg-indigo-100 text-indigo-700',
}

function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
}

function EmployeeModal({ open, onClose, onSave, initial, clients }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'employee', comp_id: '', dept_id: '', hrm_tuleave_uid: '', hrm_tuday_id: '', hrm_dingtalk_id: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = () => {
      if (open) {
        setForm(initial
          ? {
            name: initial.employee_name || initial.name,
            email: initial.employee_email || initial.email,
            role: initial.role,
            comp_id: String(initial.comp_id || ''),
            dept_id: String(initial.dept_id || ''),
            hrm_tuleave_uid: String(initial.hrm_tuleave_uid || ''),
            hrm_tuday_id: String(initial.hrm_tuday_id || ''),
            hrm_dingtalk_id: String(initial.hrm_dingtalk_id || '')
          }
          : { name: '', email: '', role: 'employee', comp_id: '', dept_id: '', hrm_tuleave_uid: '', hrm_tuday_id: '', hrm_dingtalk_id: '' }
        )
      }
    }
    init()
  }, [open, initial])

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: typeof v === 'string' ? v : v.target.value }))

  const handleSave = async () => {
    if (!form.name || !form.email || !form.comp_id) {
      toast.error('Name, email, and client are required')
      return
    }
    setSaving(true)
    try {
      const payload = {
        employee_name: form.name,
        employee_email: form.email,
        role: form.role,
        comp_id: parseInt(form.comp_id),
        dept_id: form.dept_id ? parseInt(form.dept_id) : null,
        hrm_tuleave_uid: form.hrm_tuleave_uid ? parseInt(form.hrm_tuleave_uid) : null,
        hrm_tuday_id: form.hrm_tuday_id ? parseInt(form.hrm_tuday_id) : null,
        hrm_dingtalk_id: form.hrm_dingtalk_id || null
      }
      if (initial) {
        await employeesApi.update(initial.employee_no, payload)
      } else {
        await employeesApi.create(payload)
      }
      toast.success(initial ? 'Employee updated' : 'Employee created')
      onSave()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save employee')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
          <DialogDescription>Fill in the employee details below.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input placeholder="John Smith" value={form.name} onChange={set('name')} className="h-10" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" placeholder="john@company.com" value={form.email} onChange={set('email')} className="h-10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={set('role')}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select role…" />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={form.comp_id} onValueChange={set('comp_id')}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select client…" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.client_no} value={String(c.client_no)}>{c.client_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div className="space-y-2">
              <Label>Department ID (Optional)</Label>
              <Input type="number" placeholder="e.g. 10" value={form.dept_id} onChange={set('dept_id')} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>TU Leave UID (Optional)</Label>
              <Input type="number" placeholder="e.g. 101" value={form.hrm_tuleave_uid} onChange={set('hrm_tuleave_uid')} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>TU Day ID (Optional)</Label>
              <Input type="number" placeholder="e.g. 201" value={form.hrm_tuday_id} onChange={set('hrm_tuday_id')} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>Dingtalk ID (Optional)</Label>
              <Input placeholder="e.g. ding123" value={form.hrm_dingtalk_id} onChange={set('hrm_dingtalk_id')} className="h-10" />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (initial ? 'Save Changes' : 'Add Employee')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState([])
  const [filtered, setFiltered] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [toggling, setToggling] = useState(null)

  const fetchData = async () => {
    try {
      const [empRes, clientRes] = await Promise.all([
        employeesApi.listAdmin(),
        clientsApi.list(),
      ])
      const emps = empRes.data?.employees || empRes.data?.data || (Array.isArray(empRes.data) ? empRes.data : [])
      setEmployees(emps)
      setFiltered(emps)
      setClients(clientRes.data?.clients || clientRes.data?.data || (Array.isArray(clientRes.data) ? clientRes.data : []))
    } catch (err) {
      console.error('Employees error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { const init = () => fetchData(); init() }, [])

  useEffect(() => {
    const init = () => {
      if (!search.trim()) { setFiltered(employees); return }
      const q = search.toLowerCase()
      setFiltered(employees.filter((e) =>
        (e.employee_name || e.name)?.toLowerCase().includes(q) || (e.employee_email || e.email)?.toLowerCase().includes(q)
      ))
    }
    init()
  }, [search, employees])

  const handleToggleStatus = async (emp) => {
    const newStatus = emp.status === 1 ? 4 : 1
    setToggling(emp.employee_no)
    try {
      await employeesApi.updateStatus(emp.employee_no, newStatus)
      toast.success(`Employee ${newStatus === 1 ? 'activated' : 'deactivated'}`)
      fetchData()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Employees</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage employee accounts and roles</p>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search employees…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10"
        />
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="h-12 w-12 text-slate-200 mb-4" />
              <p className="font-semibold text-slate-600">{search ? 'No results found' : 'No employees yet'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="pl-6 font-semibold text-xs uppercase text-slate-500">Employee</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500">Role</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500">Status</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500 text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((emp) => (
                    <TableRow key={emp.employee_no} className="hover:bg-slate-50">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 bg-indigo-100">
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                              {getInitials(emp.employee_name || emp.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-slate-800 text-sm">{emp.employee_name || emp.name}</p>
                            <p className="text-xs text-slate-400">{emp.employee_email || emp.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={ROLE_COLORS[emp.role] || 'bg-slate-100 text-slate-600'}>
                          {ROLES.find((r) => r.value === emp.role)?.label || emp.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={emp.status === 1
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'}
                        >
                          {emp.status === 1 ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {/* <Button
                            variant="ghost" size="sm"
                            className="h-8 px-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => { setEditTarget(emp); setModal(true) }}
                          >
                            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                          </Button> */}
                          <Button
                            variant="ghost" size="sm" className="h-8 px-3"
                            onClick={() => handleToggleStatus(emp)}
                            disabled={toggling === emp.employee_no}
                          >
                            {toggling === emp.employee_no ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : emp.status === 1 ? (
                              <span className="flex items-center gap-1 text-amber-600 text-xs"><ToggleRight className="h-4 w-4" /> Deactivate</span>
                            ) : (
                              <span className="flex items-center gap-1 text-green-600 text-xs"><ToggleLeft className="h-4 w-4" /> Activate</span>
                            )}
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

      <EmployeeModal
        open={modal}
        onClose={() => setModal(false)}
        onSave={fetchData}
        initial={editTarget}
        clients={clients}
      />
    </div>
  )
}
