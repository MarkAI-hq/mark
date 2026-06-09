'use client'

// src/app/(dashboard)/dashboard/admin/learning-tools/learning-tools-client.tsx
// H1: Interactive table for managing learning tools

import { useState, useTransition } from 'react'
import { toast }                   from 'sonner'
import { Plus, Pencil, Trash2, Save, X, Star } from 'lucide-react'
import { Button }    from '@/components/ui/button'
import { Input }     from '@/components/ui/input'
import { Textarea }  from '@/components/ui/textarea'
import { Badge }     from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import type { LearningTool }                  from '@/lib/actions/learning-tools'
import { createLearningTool, updateLearningTool, deleteLearningTool } from '@/lib/actions/learning-tools'

const CATEGORIES = ['general', 'note_taking', 'memory', 'retrieval', 'metacognitive', 'visual', 'organizational']

const CATEGORY_LABELS: Record<string, string> = {
  general:        'General',
  note_taking:    'Note-Taking',
  memory:         'Memory',
  retrieval:      'Retrieval',
  metacognitive:  'Metacognitive',
  visual:         'Visual',
  organizational: 'Organizational',
}

interface Props {
  initialTools: LearningTool[]
}

type FormState = {
  name:           string
  description:    string
  how_to:         string
  category:       string
  research_basis: string
  delta_rating:   string
}

const emptyForm: FormState = { name: '', description: '', how_to: '', category: 'general', research_basis: '', delta_rating: '' }

export function LearningToolsClient({ initialTools }: Props) {
  const [tools, setTools]         = useState<LearningTool[]>(initialTools)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm]           = useState<FormState>(emptyForm)
  const [showNew, setShowNew]     = useState(false)
  const [isPending, startTransition] = useTransition()

  function startEdit(tool: LearningTool) {
    setEditingId(tool.id)
    setForm({
      name:           tool.name,
      description:    tool.description,
      how_to:         tool.how_to ?? '',
      category:       tool.category,
      research_basis: tool.research_basis ?? '',
      delta_rating:   tool.delta_rating?.toString() ?? '',
    })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm)
    setShowNew(false)
  }

  function handleSave(id: string) {
    startTransition(async () => {
      const { data, error } = await updateLearningTool(id, {
        name:           form.name,
        description:    form.description,
        how_to:         form.how_to || undefined,
        category:       form.category,
        research_basis: form.research_basis || undefined,
        delta_rating:   form.delta_rating ? parseInt(form.delta_rating) : undefined,
      })
      if (error) { toast.error(error.message); return }
      setTools(prev => prev.map(t => t.id === id ? (data ?? t) : t))
      setEditingId(null)
      toast.success('Tool updated')
    })
  }

  function handleCreate() {
    startTransition(async () => {
      const { data, error } = await createLearningTool({
        name:           form.name,
        description:    form.description,
        how_to:         form.how_to || undefined,
        category:       form.category,
        research_basis: form.research_basis || undefined,
        delta_rating:   form.delta_rating ? parseInt(form.delta_rating) : undefined,
      })
      if (error) { toast.error(error.message); return }
      if (data) setTools(prev => [...prev, data])
      setShowNew(false)
      setForm(emptyForm)
      toast.success('Tool created')
    })
  }

  function handleDelete(id: string, name: string) {
    startTransition(async () => {
      const { error } = await deleteLearningTool(id)
      if (error) { toast.error(error.message); return }
      setTools(prev => prev.filter(t => t.id !== id))
      toast.success(`"${name}" deactivated`)
    })
  }

  const editing = editingId !== null

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">{tools.length} tool{tools.length !== 1 ? 's' : ''}</p>
        {!showNew && !editing && (
          <Button size="sm" onClick={() => { setShowNew(true); setForm(emptyForm) }}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add tool
          </Button>
        )}
      </div>

      {showNew && (
        <div className="rounded-lg border border-dashed border-gold/30 bg-gold/5 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">New learning tool</p>
          <ToolForm form={form} setForm={setForm} />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={!form.name || !form.description || isPending}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={cancelEdit}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Effect Size</TableHead>
              <TableHead>Research Basis</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools.map(tool => (
              <TableRow key={tool.id}>
                {editingId === tool.id ? (
                  <>
                    <TableCell colSpan={4}>
                      <ToolForm form={form} setForm={setForm} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSave(tool.id)} disabled={isPending}>
                          <Save className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={cancelEdit}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium">{tool.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{tool.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {CATEGORY_LABELS[tool.category] ?? tool.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tool.delta_rating ? (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: tool.delta_rating }).map((_, i) => (
                            <Star key={i} className="h-3 w-3 fill-gold text-gold" />
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="text-xs text-muted-foreground line-clamp-1">{tool.research_basis ?? '—'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(tool)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon" variant="ghost"
                          className="h-7 w-7 text-rose-500 hover:text-rose-700"
                          onClick={() => handleDelete(tool.id, tool.name)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function ToolForm({ form, setForm }: { form: FormState; setForm: (f: FormState) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <Input
        placeholder="Tool name"
        value={form.name}
        onChange={e => setForm({ ...form, name: e.target.value })}
      />
      <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {CATEGORIES.map(c => (
            <SelectItem key={c} value={c}>{CATEGORY_LABELS[c] ?? c}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea
        placeholder="Description"
        value={form.description}
        onChange={e => setForm({ ...form, description: e.target.value })}
        className="col-span-2 h-20 resize-none"
      />
      <Textarea
        placeholder="How to use it (optional)"
        value={form.how_to}
        onChange={e => setForm({ ...form, how_to: e.target.value })}
        className="col-span-2 h-20 resize-none"
      />
      <Input
        placeholder="Research basis (optional)"
        value={form.research_basis}
        onChange={e => setForm({ ...form, research_basis: e.target.value })}
      />
      <Select
        value={form.delta_rating}
        onValueChange={v => setForm({ ...form, delta_rating: v })}
      >
        <SelectTrigger><SelectValue placeholder="Effect size (1-5)" /></SelectTrigger>
        <SelectContent>
          {['', '1', '2', '3', '4', '5'].map(v => (
            <SelectItem key={v} value={v}>{v || 'Not rated'}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
