'use client'

import { useState, useTransition } from 'react'
import { CalendarDays, Plus, Pencil, Trash2, Clock } from 'lucide-react'
import { toast } from 'sonner'

import { Button }  from '@/components/ui/button'
import { Badge }   from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import {
  createTimetableSlot, updateTimetableSlot, deleteTimetableSlot,
  type TimetableSlot,
} from '@/lib/actions/timetable'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as const
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri',
  saturday: 'Sat', sunday: 'Sun',
}

type Day = typeof DAYS[number]

interface Props {
  classId: string
  initialSlots: TimetableSlot[]
  error: string | null
  defaultTerm?: string
  defaultAcademicYear?: string
}

type FormState = {
  day_of_week: string
  start_time: string
  end_time: string
  subject: string
  room: string
  period: string
  term: string
  academic_year: string
}

const EMPTY_FORM: FormState = {
  day_of_week: 'monday',
  start_time: '08:00',
  end_time: '09:00',
  subject: '',
  room: '',
  period: '',
  term: '',
  academic_year: '',
}

function SlotCard({
  slot,
  onEdit,
  onDelete,
}: {
  slot: TimetableSlot
  onEdit: (slot: TimetableSlot) => void
  onDelete: (slot: TimetableSlot) => void
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-surface-raised shadow-xs p-3 text-xs space-y-1 group relative">
      <p className="font-medium text-sm leading-tight truncate">{slot.subject}</p>
      <p className="text-muted-foreground flex items-center gap-1">
        <Clock className="h-3 w-3" />
        {slot.start_time}–{slot.end_time}
      </p>
      {slot.room && <p className="text-muted-foreground truncate">{slot.room}</p>}
      <div className="absolute top-1.5 right-1.5 hidden group-hover:flex gap-1 transition-opacity duration-150">
        <button
          className="rounded p-0.5 hover:bg-muted"
          onClick={(e) => { e.stopPropagation(); onEdit(slot) }}
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          className="rounded p-0.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500"
          onClick={(e) => { e.stopPropagation(); onDelete(slot) }}
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

export function TimetableClient({
  classId, initialSlots, error, defaultTerm, defaultAcademicYear,
}: Props) {
  const [slots, setSlots] = useState(initialSlots)
  const [isPending, startTransition] = useTransition()

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<TimetableSlot | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  function openCreate(day?: string) {
    setEditingSlot(null)
    setForm({ ...EMPTY_FORM, day_of_week: day ?? 'monday', term: defaultTerm ?? '', academic_year: defaultAcademicYear ?? '' })
    setDialogOpen(true)
  }

  function openEdit(slot: TimetableSlot) {
    setEditingSlot(slot)
    setForm({
      day_of_week:   slot.day_of_week,
      start_time:    slot.start_time,
      end_time:      slot.end_time,
      subject:       slot.subject,
      room:          slot.room ?? '',
      period:        slot.period?.toString() ?? '',
      term:          slot.term,
      academic_year: slot.academic_year,
    })
    setDialogOpen(true)
  }

  function handleSave() {
    if (!form.subject || !form.term || !form.academic_year) {
      toast.error('Subject, term, and academic year are required.')
      return
    }

    startTransition(async () => {
      const payload = {
        class_id:      classId,
        day_of_week:   form.day_of_week,
        start_time:    form.start_time,
        end_time:      form.end_time,
        subject:       form.subject,
        term:          form.term,
        academic_year: form.academic_year,
        ...(form.room   ? { room:   form.room }              : {}),
        ...(form.period ? { period: Number(form.period) }    : {}),
      }

      if (editingSlot) {
        const res = await updateTimetableSlot(editingSlot.id, classId, payload)
        if (res.error) { toast.error(res.error.message); return }
        setSlots((prev) => prev.map((s) => s.id === editingSlot.id ? res.data! : s))
        toast.success('Slot updated')
      } else {
        const res = await createTimetableSlot(payload)
        if (res.error) { toast.error(res.error.message); return }
        setSlots((prev) => [...prev, res.data!])
        toast.success('Slot added')
      }

      setDialogOpen(false)
    })
  }

  function handleDelete() {
    if (!deleteTarget) return
    startTransition(async () => {
      const res = await deleteTimetableSlot(deleteTarget.id, classId)
      if (res.error) { toast.error(res.error.message); return }
      setSlots((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      setDeleteTarget(null)
      toast.success('Slot removed')
    })
  }

  // Build day → sorted slots map
  const byDay: Record<string, TimetableSlot[]> = {}
  DAYS.forEach((d) => { byDay[d] = [] })
  slots.forEach((s) => {
    if (!byDay[s.day_of_week]) byDay[s.day_of_week] = []
    byDay[s.day_of_week].push(s)
  })
  Object.values(byDay).forEach((arr) => arr.sort((a, b) => a.start_time.localeCompare(b.start_time)))

  if (error) return (
    <div className="p-6 text-center text-muted-foreground text-sm">Failed to load timetable: {error}</div>
  )

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Weekly Timetable</h2>
          <p className="text-sm text-muted-foreground">{slots.length} slot{slots.length !== 1 ? 's' : ''} scheduled</p>
        </div>
        <Button size="sm" className="gap-2" onClick={() => openCreate()}>
          <Plus className="h-4 w-4" />
          Add Slot
        </Button>
      </div>

      {/* Weekly grid */}
      <div className="grid grid-cols-5 gap-3">
        {DAYS.map((day) => (
          <div key={day} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {DAY_LABELS[day]}
              </span>
              <button
                className="rounded p-0.5 hover:bg-muted text-muted-foreground"
                onClick={() => openCreate(day)}
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            {byDay[day].length === 0 ? (
              <div
                className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground/60 cursor-pointer hover:border-gold/40 hover:text-gold/60 transition-colors"
                onClick={() => openCreate(day)}
              >
                No lessons
              </div>
            ) : (
              byDay[day].map((slot) => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  onEdit={openEdit}
                  onDelete={setDeleteTarget}
                />
              ))
            )}
          </div>
        ))}
      </div>

      {/* Weekend slots (Saturday/Sunday) if any */}
      {slots.some((s) => s.day_of_week === 'saturday' || s.day_of_week === 'sunday') && (
        <div className="grid grid-cols-2 gap-3 max-w-xs">
          {(['saturday', 'sunday'] as const).map((day) => (
            byDay[day]?.length > 0 && (
              <div key={day} className="space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {DAY_LABELS[day]}
                </span>
                {byDay[day].map((slot) => (
                  <SlotCard key={slot.id} slot={slot} onEdit={openEdit} onDelete={setDeleteTarget} />
                ))}
              </div>
            )
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingSlot ? 'Edit Slot' : 'Add Timetable Slot'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Day</Label>
                <Select value={form.day_of_week} onValueChange={(v) => setForm((f) => ({ ...f, day_of_week: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((d) => (
                      <SelectItem key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Period (optional)</Label>
                <Input placeholder="1" value={form.period} onChange={(e) => setForm((f) => ({ ...f, period: e.target.value }))} type="number" min={1} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Start time</Label>
                <Input type="time" value={form.start_time} onChange={(e) => setForm((f) => ({ ...f, start_time: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>End time</Label>
                <Input type="time" value={form.end_time} onChange={(e) => setForm((f) => ({ ...f, end_time: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Subject *</Label>
              <Input placeholder="Mathematics" value={form.subject} onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Room (optional)</Label>
              <Input placeholder="Room 12" value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Term *</Label>
                <Input placeholder="Term 2" value={form.term} onChange={(e) => setForm((f) => ({ ...f, term: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Academic year *</Label>
                <Input placeholder="2025/2026" value={form.academic_year} onChange={(e) => setForm((f) => ({ ...f, academic_year: e.target.value }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={isPending}>
              {isPending ? 'Saving...' : editingSlot ? 'Update' : 'Add Slot'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this slot?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.subject} on {deleteTarget?.day_of_week} at {deleteTarget?.start_time} will be removed from the timetable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
