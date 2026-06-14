'use client'

import { useEffect, useState } from 'react'
import { clientsApi } from '@/lib/api'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, Plus, Pencil, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react'

function ClientModal({ open, onClose, onSave, initial }) {
  const [name, setName] = useState(initial?.client_name || '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setName(initial?.client_name || '')
  }, [open, initial])

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Client name is required'); return }
    setSaving(true)
    try {
      if (initial) {
        await clientsApi.update(initial.client_no, { client_name: name })
      } else {
        await clientsApi.create({ client_name: name })
      }
      toast.success(initial ? 'Client updated' : 'Client created')
      onSave()
      onClose()
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save client')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit Client' : 'Add Client'}</DialogTitle>
          <DialogDescription>Enter the client organization name.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          <div className="space-y-2">
            <Label>Client Name</Label>
            <Input
              placeholder="e.g. Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (initial ? 'Save Changes' : 'Add Client')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ClientsPage() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [toggling, setToggling] = useState(null)

  const fetchClients = async () => {
    try {
      const res = await clientsApi.list()
      setClients(res.data?.clients || res.data?.data || (Array.isArray(res.data) ? res.data : []))
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { fetchClients() }, [])

  const handleToggleStatus = async (client) => {
    const newStatus = client.status === 1 ? 0 : 1
    setToggling(client.client_no)
    try {
      await clientsApi.updateStatus(client.client_no, newStatus)
      toast.success(`Client ${newStatus === 1 ? 'activated' : 'deactivated'}`)
      fetchClients()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Clients</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage client organizations</p>
        </div>
        <Button onClick={() => { setEditTarget(null); setModal(true) }} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Client
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
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-8 w-16 rounded" />
                </div>
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Building2 className="h-12 w-12 text-slate-200 mb-4" />
              <p className="font-semibold text-slate-600">No clients yet</p>
              <Button
                className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white"
                onClick={() => { setEditTarget(null); setModal(true) }}
              >
                <Plus className="mr-2 h-4 w-4" /> Add First Client
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="pl-6 font-semibold text-xs uppercase text-slate-500">Client Name</TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-slate-500">Status</TableHead>
                  <TableHead className="font-semibold text-xs uppercase text-slate-500 text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.client_no} className="hover:bg-slate-50">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                          <Building2 className="h-4 w-4 text-indigo-600" />
                        </div>
                        <span className="font-medium text-slate-800">{client.client_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={client.status === 1
                          ? 'bg-green-100 text-green-700 border-green-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'}
                      >
                        {client.status === 1 ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                          onClick={() => { setEditTarget(client); setModal(true) }}
                        >
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3"
                          onClick={() => handleToggleStatus(client)}
                          disabled={toggling === client.client_no}
                        >
                          {toggling === client.client_no ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : client.status === 1 ? (
                            <span className="flex items-center gap-1 text-amber-600"><ToggleRight className="h-4 w-4" /> Deactivate</span>
                          ) : (
                            <span className="flex items-center gap-1 text-green-600"><ToggleLeft className="h-4 w-4" /> Activate</span>
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ClientModal
        open={modal}
        onClose={() => setModal(false)}
        onSave={fetchClients}
        initial={editTarget}
      />
    </div>
  )
}
