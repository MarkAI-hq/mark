'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  createSchoolNotice,
  deleteSchoolNotice,
  type SchoolNotice,
  type CreateSchoolNoticeInput,
} from '@/lib/actions/school-notices'

const CATEGORIES: CreateSchoolNoticeInput['category'][] = ['notice', 'event', 'holiday']

export function NoticesClient({ initial }: { initial: SchoolNotice[] }) {
  const [notices, setNotices] = useState(initial)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState<CreateSchoolNoticeInput['category']>('notice')
  const [eventDate, setEventDate] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleCreate() {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required.')
      return
    }
    startTransition(async () => {
      const { data, error } = await createSchoolNotice({
        title: title.trim(),
        body: body.trim(),
        category,
        event_date: eventDate || undefined,
      })
      if (error || !data) {
        toast.error(error?.message ?? 'Could not post notice.')
        return
      }
      setNotices((prev) => [data, ...prev])
      setTitle('')
      setBody('')
      setEventDate('')
      toast.success('Posted.')
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const { error } = await deleteSchoolNotice(id)
      if (error) {
        toast.error(error.message)
        return
      }
      setNotices((prev) => prev.filter((n) => n.id !== id))
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-sm font-semibold">New notice</h2>
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Body</Label>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <div className="flex gap-2">
                {CATEGORIES.map((c) => (
                  <Button
                    key={c}
                    type="button"
                    size="sm"
                    variant={category === c ? 'default' : 'outline'}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Event date (optional)</Label>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleCreate} disabled={isPending} className="w-full">
            {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Post
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold">Posted</h2>
        {notices.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing posted yet.</p>
        ) : (
          notices.map((n) => (
            <Card key={n.id}>
              <CardContent className="p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    <Badge variant="outline" className="text-[10px]">{n.category}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-line">{n.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  className="text-muted-foreground hover:text-rose-500 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
