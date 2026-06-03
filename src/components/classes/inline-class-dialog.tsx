'use client'

// src/components/classes/inline-class-dialog.tsx
// Minimal reusable dialog — create a new class OR assign to an existing one.
// Used in exam-dialog and assessment-client when classId is missing.

import { useState, useTransition } from 'react'
import { useForm }    from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z }          from 'zod'
import { toast }      from 'sonner'
import { Plus, Loader2, School } from 'lucide-react'

import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Form, FormControl, FormField,
  FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Input }    from '@/components/ui/input'
import { Button }   from '@/components/ui/button'
import { createClass, getClasses } from '@/lib/actions/classes'
import type { Class } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────────────────────

interface InlineClassDialogProps {
  open:           boolean
  onOpenChange:   (open: boolean) => void
  existingClasses: { class_id: string; name: string }[]
  // Called with the class that was created or selected
  onClassReady:   (cls: { class_id: string; name: string }) => void
}

// ── Create tab schema ──────────────────────────────────────────────────────

const createSchema = z.object({
  name:        z.string().min(2, 'Class name must be at least 2 characters.'),
  description: z.string().optional(),
})

// ── Create tab ─────────────────────────────────────────────────────────────

function CreateTab({ onSuccess }: { onSuccess: (cls: { class_id: string; name: string }) => void }) {
  const [isPending, startTransition] = useTransition()

  const form = useForm<z.infer<typeof createSchema>>({
    resolver: zodResolver(createSchema),
    defaultValues: { name: '', description: '' },
  })

  const handleSubmit = (data: z.infer<typeof createSchema>) => {
    startTransition(async () => {
      try {
        const newClass = await createClass({
          name:            data.name,
          description:     data.description ?? null,
        } as any)
        toast.success(`Class "${data.name}" created.`)
        onSuccess({ class_id: newClass.class_id, name: newClass.name })
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Failed to create class.')
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Name <span className="text-rose-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="e.g. S4 East, Year 10 Biology" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Input placeholder="Optional" {...field} />
              </FormControl>
              <FormDescription className="text-xs">
                You can add teachers and students after creation.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-1">
          <Button type="submit" disabled={isPending} className="gap-2">
            {isPending
              ? <><Loader2 className="h-4 w-4 animate-spin" />Creating…</>
              : <><Plus className="h-4 w-4" />Create Class</>
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}

// ── Assign tab ─────────────────────────────────────────────────────────────

function AssignTab({
  classes,
  onSuccess,
}: {
  classes:   { class_id: string; name: string }[]
  onSuccess: (cls: { class_id: string; name: string }) => void
}) {
  const [selectedId, setSelectedId] = useState('')

  const handleConfirm = () => {
    const cls = classes.find(c => c.class_id === selectedId)
    if (!cls) { toast.warning('Please select a class.'); return }
    onSuccess(cls)
  }

  if (!classes.length) return (
    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
      <School className="h-8 w-8 mb-3 opacity-25" />
      <p className="text-sm">No classes available to assign.</p>
      <p className="text-xs mt-1 opacity-75">Use the &quot;Create New&quot; tab instead.</p>
    </div>
  )

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <label className="text-sm font-medium">Select a class</label>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose a class…" />
          </SelectTrigger>
          <SelectContent>
            {classes.map(c => (
              <SelectItem key={c.class_id} value={c.class_id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleConfirm} disabled={!selectedId} className="gap-2">
          <School className="h-4 w-4" />
          Assign to this class
        </Button>
      </div>
    </div>
  )
}

// ── Main dialog ────────────────────────────────────────────────────────────

export function InlineClassDialog({
  open,
  onOpenChange,
  existingClasses,
  onClassReady,
}: InlineClassDialogProps) {

  const handleSuccess = (cls: { class_id: string; name: string }) => {
    onClassReady(cls)
    onOpenChange(false)
  }

  // Default to assign tab if classes exist, create tab if none
  const defaultTab = existingClasses.length > 0 ? 'assign' : 'create'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Link a Class</DialogTitle>
          <DialogDescription>
            This assessment needs a class before grading can begin.
            Create a new one or assign it to an existing class.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="assign" className="flex-1" disabled={existingClasses.length === 0}>
              Assign Existing
              {existingClasses.length === 0 && (
                <span className="ml-1.5 text-xs text-muted-foreground">(none yet)</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="create" className="flex-1">
              Create New
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assign" className="mt-4">
            <AssignTab classes={existingClasses} onSuccess={handleSuccess} />
          </TabsContent>

          <TabsContent value="create" className="mt-4">
            <CreateTab onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}