'use client'

import { useEffect, useState } from 'react'
import { cyclesApi, clientsApi } from '@/lib/api'
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
import { RefreshCw, Plus, Lock, Unlock, Loader2 } from 'lucide-react'
import { format } from 'date-fns'

function CycleModal({ open, onClose, onSave, clients }) {
  const [form, setForm] = useState({ cycle_name: '', comp_id: '', year: '', start_date: '', end_date: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const init = () => {
      if (open) setForm({ cycle_name: '', comp_id: '', year: new Date().getFullYear().toString(), start_date: '', end_date: '' })
    }
    init()
  }, [open])

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: typeof v === 'string' ? v : v.target.value }))

  const handleSave = async () => {
    if (!form.cycle_name || !form.comp_id || !form.year || !form.start_date || !form.end_date) {
      toast.error('All fields are required')
      return
    }
    setSaving(true)
    try {
      await cyclesApi.create({
        cycle_name: form.cycle_name,
        comp_id: parseInt(form.comp_id),
        year: parseInt(form.year),
        start_date: form.start_date,
        end_date: form.end_date,
        status: 1,
      })
      toast.success('Cycle created')
      onSave()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to create cycle')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Performance Cycle</DialogTitle>
          <DialogDescription>Create a new appraisal cycle.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Cycle Name</Label>
            <Input placeholder="e.g. H1 2025" value={form.cycle_name} onChange={set('cycle_name')} className="h-10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
            <div className="space-y-2">
              <Label>Year</Label>
              <Input type="number" placeholder="2025" value={form.year} onChange={set('year')} className="h-10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input type="date" value={form.start_date} onChange={set('start_date')} className="h-10" />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input type="date" value={form.end_date} onChange={set('end_date')} className="h-10" />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Cycle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function CyclesPage() {
  const [cycles, setCycles] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [toggling, setToggling] = useState(null)

  const fetchData = async () => {
    try {
      const [cycRes, clientRes] = await Promise.all([
        cyclesApi.listAdmin(),
        clientsApi.list(),
      ])
      setCycles(cycRes.data?.cycles || cycRes.data?.data || (Array.isArray(cycRes.data) ? cycRes.data : []))
      setClients(clientRes.data?.clients || clientRes.data?.data || (Array.isArray(clientRes.data) ? clientRes.data : []))
    } catch (err) {
      console.error('Cycles error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { const init = () => fetchData(); init() }, [])

  const handleToggleStatus = async (cycle) => {
    const newStatus = cycle.status === 1 ? 0 : 1
    setToggling(cycle.cycle_no)
    try {
      await cyclesApi.updateStatus(cycle.cycle_no, newStatus)
      toast.success(`Cycle ${newStatus === 1 ? 'opened' : 'closed'}`)
      fetchData()
    } catch {
      toast.error('Failed to update cycle status')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Performance Cycles</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage appraisal cycles and periods</p>
        </div>
        <Button onClick={() => setModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Cycle
        </Button>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-8 w-20 rounded" />
                </div>
              ))}
            </div>
          ) : cycles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <RefreshCw className="h-12 w-12 text-slate-200 mb-4" />
              <p className="font-semibold text-slate-600">No cycles yet</p>
              <Button className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setModal(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create First Cycle
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="pl-6 font-semibold text-xs uppercase text-slate-500">Cycle Name</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500">Client</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500">Year</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500">Start</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500">End</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500">Status</TableHead>
                    <TableHead className="font-semibold text-xs uppercase text-slate-500 text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cycles.map((cycle) => (
                    <TableRow key={cycle.cycle_no} className="hover:bg-slate-50">
                      <TableCell className="pl-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
                            <RefreshCw className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="font-medium text-slate-800 text-sm">{cycle.cycle_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-slate-600">{cycle.client?.client_name || '—'}</TableCell>
                      <TableCell className="text-sm text-slate-600">{cycle.year}</TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {cycle.start_date ? format(new Date(cycle.start_date), 'MMM d, yyyy') : '—'}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {cycle.end_date ? format(new Date(cycle.end_date), 'MMM d, yyyy') : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={cycle.status === 1
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-slate-100 text-slate-500 border-slate-200'}
                        >
                          {cycle.status === 1 ? 'Open' : 'Closed'}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex justify-end">
                          <Button
                            variant="ghost" size="sm"
                            className="h-8 px-3"
                            onClick={() => handleToggleStatus(cycle)}
                            disabled={toggling === cycle.cycle_no}
                          >
                            {toggling === cycle.cycle_no ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : cycle.status === 1 ? (
                              <span className="flex items-center gap-1 text-amber-600 text-xs"><Lock className="h-3.5 w-3.5" /> Close</span>
                            ) : (
                              <span className="flex items-center gap-1 text-green-600 text-xs"><Unlock className="h-3.5 w-3.5" /> Open</span>
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

      <CycleModal open={modal} onClose={() => setModal(false)} onSave={fetchData} clients={clients} />
    </div>
  )
}
