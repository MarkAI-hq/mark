'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, Loader2, Star, Pencil, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { createExtra, updateExtra, type SchoolExtra } from '@/lib/actions/extras'
import { useCurrency } from '@/components/providers/currency-provider'

const CATEGORIES = ['club', 'sports', 'arts', 'academic', 'other']

interface Props {
  extras: SchoolExtra[]
}

function fmt(usdAmount: number, currency: string, rates: Record<string, number>) {
  const rate = rates[currency.toLowerCase()] ?? 1
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(usdAmount * rate)
}

interface FormValues {
  name: string
  description: string
  category: string
  isFree: boolean
  priceStr: string
  limitEnabled: boolean
  limitStr: string
}

interface ExtraFormProps {
  initial?:    SchoolExtra
  onSave:      (v: FormValues) => void
  onCancel:    () => void
  isPending:   boolean
  submitLabel: string
}

function ExtraForm({ initial, onSave, onCancel, isPending, submitLabel }: ExtraFormProps) {
  const { currency, rates } = useCurrency()
  const [name, setName]           = useState(initial?.name ?? '')
  const [description, setDesc]    = useState(initial?.description ?? '')
  const [category, setCategory]   = useState(initial?.category ?? 'other')
  const [isFree, setIsFree]       = useState(initial ? initial.is_free : true)
  const [priceStr, setPriceStr]   = useState(
    initial && !initial.is_free ? String(Number(initial.price_usd).toFixed(2)) : ''
  )
  const [limitEnabled, setLimitEnabled] = useState(
    initial ? initial.max_enrollment != null : false
  )
  const [limitStr, setLimitStr]   = useState(
    initial?.max_enrollment != null ? String(initial.max_enrollment) : ''
  )

  const usdPrice = parseFloat(priceStr) || 0

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="ef-name">Name *</Label>
          <Input id="ef-name" placeholder="e.g. Chess Club" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="ef-desc">Description</Label>
        <Textarea id="ef-desc" placeholder="Brief description…" value={description} onChange={e => setDesc(e.target.value)} rows={2} />
      </div>

      {/* Price */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Switch id="ef-free" checked={isFree} onCheckedChange={setIsFree} />
          <Label htmlFor="ef-free">Free activity</Label>
        </div>
        {!isFree && (
          <div className="flex items-center gap-2">
            <Label htmlFor="ef-price">Price (USD)</Label>
            <Input
              id="ef-price"
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className="w-28"
              value={priceStr}
              onChange={e => setPriceStr(e.target.value)}
            />
            {currency !== 'USD' && usdPrice > 0 && (
              <span className="text-xs text-muted-foreground">≈ {fmt(usdPrice, currency, rates)}</span>
            )}
          </div>
        )}
      </div>

      {/* Enrollment limit */}
      <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Enrollment limit</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {limitEnabled ? 'Cap how many students can join.' : 'Unlimited — anyone can enroll.'}
            </p>
          </div>
          <Switch id="ef-limit" checked={limitEnabled} onCheckedChange={v => { setLimitEnabled(v); if (!v) setLimitStr('') }} />
        </div>
        {limitEnabled && (
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              id="ef-limit-val"
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 30"
              className="w-28"
              value={limitStr}
              onChange={e => setLimitStr(e.target.value)}
            />
            <span className="text-xs text-muted-foreground">max students</span>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1">
        <Button onClick={() => onSave({ name, description, category, isFree, priceStr, limitEnabled, limitStr })} disabled={isPending} className="gap-1.5">
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={isPending}>Cancel</Button>
      </div>
    </div>
  )
}

export function ExtrasAdminClient({ extras: initialExtras }: Props) {
  const { currency, rates } = useCurrency()
  const [extras, setExtras]          = useState(initialExtras)
  const [showCreate, setShowCreate]  = useState(false)
  const [editExtra, setEditExtra]    = useState<SchoolExtra | null>(null)
  const [createPending, startCreate] = useTransition()
  const [editPending,   startEdit]   = useTransition()
  const [togglingId,    setTogglingId] = useState<string | null>(null)

  function handleCreate(v: FormValues) {
    if (!v.name.trim()) { toast.error('Name is required.'); return }
    if (!v.isFree && (!v.priceStr || parseFloat(v.priceStr) <= 0)) { toast.error('Enter a valid price.'); return }
    if (v.limitEnabled && (!v.limitStr || parseInt(v.limitStr) < 1)) { toast.error('Enter a valid enrollment limit.'); return }
    startCreate(async () => {
      const res = await createExtra({
        name:           v.name.trim(),
        description:    v.description.trim() || undefined,
        category:       v.category,
        is_free:        v.isFree,
        price_usd:      v.isFree ? 0 : parseFloat(v.priceStr),
        max_enrollment: v.limitEnabled ? parseInt(v.limitStr) : null,
      })
      if (res.error) { toast.error(res.error.message); return }
      if (res.data)  { setExtras(prev => [res.data!, ...prev]); toast.success('Extra created.'); setShowCreate(false) }
    })
  }

  function handleEdit(v: FormValues) {
    if (!editExtra) return
    if (!v.name.trim()) { toast.error('Name is required.'); return }
    if (!v.isFree && (!v.priceStr || parseFloat(v.priceStr) <= 0)) { toast.error('Enter a valid price.'); return }
    if (v.limitEnabled && (!v.limitStr || parseInt(v.limitStr) < 1)) { toast.error('Enter a valid enrollment limit.'); return }
    startEdit(async () => {
      const res = await updateExtra(editExtra.id, {
        name:           v.name.trim(),
        description:    v.description.trim() || undefined,
        category:       v.category,
        is_free:        v.isFree,
        price_usd:      v.isFree ? 0 : parseFloat(v.priceStr),
        max_enrollment: v.limitEnabled ? parseInt(v.limitStr) : null,
      })
      if (res.error) { toast.error(res.error.message); return }
      if (res.data)  { setExtras(prev => prev.map(e => e.id === editExtra.id ? res.data! : e)); toast.success('Extra updated.'); setEditExtra(null) }
    })
  }

  function handleToggleActive(extra: SchoolExtra) {
    setTogglingId(extra.id)
    startEdit(async () => {
      const res = await updateExtra(extra.id, { is_active: !extra.is_active })
      if (res.error) { toast.error(res.error.message) }
      else if (res.data) {
        setExtras(prev => prev.map(e => e.id === extra.id ? res.data! : e))
        toast.success(res.data.is_active ? 'Extra activated.' : 'Extra deactivated.')
      }
      setTogglingId(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">School Extras</h1>
          <p className="text-sm text-muted-foreground mt-1">Clubs, sports, arts, and other activities for students.</p>
        </div>
        <Button size="sm" onClick={() => setShowCreate(!showCreate)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          {showCreate ? 'Cancel' : 'Add Extra'}
        </Button>
      </div>

      {showCreate && (
        <Card>
          <CardHeader><CardTitle className="text-base">New Extra</CardTitle></CardHeader>
          <CardContent>
            <ExtraForm onSave={handleCreate} onCancel={() => setShowCreate(false)} isPending={createPending} submitLabel="Create Extra" />
          </CardContent>
        </Card>
      )}

      {extras.length === 0 && !showCreate ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Star className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-medium text-muted-foreground">No extras yet</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Add clubs, sports, or activities for your students.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {extras.map(extra => (
            <Card key={extra.id} className={extra.is_active ? '' : 'opacity-60'}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start justify-between gap-3">

                  {/* Left: name + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{extra.name}</p>
                    {extra.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{extra.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <Badge variant="secondary" className="capitalize text-[11px]">{extra.category}</Badge>
                      {extra.max_enrollment != null && (
                        <Badge variant="outline" className="text-[11px] gap-1 text-muted-foreground border-muted-foreground/30">
                          <Users className="h-3 w-3" />
                          Limit {extra.max_enrollment}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Right: price + actions */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {extra.is_free ? (
                      <Badge variant="outline" className="text-gold border-gold/30">Free</Badge>
                    ) : (
                      <span className="text-sm font-semibold tabular-nums">
                        {fmt(Number(extra.price_usd), currency, rates)}
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      {/* Edit */}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditExtra(extra)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>

                      {/* Toggle active — single button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-7 text-xs px-2 ${extra.is_active ? 'border-gold/40 text-gold hover:bg-gold/10' : 'text-muted-foreground hover:text-foreground'}`}
                        onClick={() => handleToggleActive(extra)}
                        disabled={togglingId === extra.id}
                      >
                        {togglingId === extra.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : extra.is_active ? 'Active' : 'Inactive'
                        }
                      </Button>
                    </div>
                  </div>

                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit dialog */}
      <Dialog open={!!editExtra} onOpenChange={open => { if (!open) setEditExtra(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Extra</DialogTitle>
            <DialogDescription>Update the details for this activity.</DialogDescription>
          </DialogHeader>
          {editExtra && (
            <ExtraForm
              initial={editExtra}
              onSave={handleEdit}
              onCancel={() => setEditExtra(null)}
              isPending={editPending}
              submitLabel="Save Changes"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
