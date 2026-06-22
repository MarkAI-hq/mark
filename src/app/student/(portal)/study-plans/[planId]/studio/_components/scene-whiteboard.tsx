'use client'

import { useState, useEffect } from 'react'
import { PenLine, Lightbulb, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { submitStudentNote, validateSceneNotes } from '@/lib/actions/student-notes'
import { toast } from 'sonner'

interface Props { scene: any; planId: string; subject: string; topic: string; onReady?: () => void }

export function SceneWhiteboard({ scene, planId, subject, topic, onReady }: Props) {
  const { title, content, bloom_level } = scene
  const { prompt, scaffolding } = content ?? {}
  const [notes, setNotes]         = useState('')
  const [showHint, setShowHint]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [checking, setChecking]   = useState(false)
  const [feedback, setFeedback]   = useState<string | null>(null)
  const [passed, setPassed]       = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setShowHint(true), 30000)
    return () => clearTimeout(timer)
  }, [])

  async function handleCheck() {
    if (!notes.trim()) return
    setChecking(true)
    setFeedback(null)
    try {
      const res = await validateSceneNotes({
        notes,
        modelNotes: scaffolding,
        subject,
        topic,
      })
      if (res.error) { toast.error('Could not check right now'); return }
      setFeedback(res.data!.feedback)
      if (res.data!.passed && !passed) {
        setPassed(true)
        onReady?.()
      }
    } catch {
      toast.error('Could not check right now')
    } finally {
      setChecking(false)
    }
  }

  async function handleSave() {
    if (!notes.trim()) return
    setSaving(true)
    try {
      await submitStudentNote({ subject, topic, content: notes })
      toast.success('Notes saved to your Knowledge Base')
    } catch {
      toast.error('Could not save notes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2">
        <PenLine className="h-4 w-4 text-gold shrink-0 mt-0.5" />
        <h2 className="font-semibold text-base leading-tight">{title}</h2>
        {bloom_level && (
          <Badge variant="outline" className="text-[10px] ml-auto shrink-0 capitalize border-gold/30 text-gold">
            {bloom_level}
          </Badge>
        )}
      </div>

      <div className="rounded-xl border bg-card px-4 py-3">
        <p className="font-medium text-base">{prompt}</p>
      </div>

      {showHint && scaffolding && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 flex gap-2">
          <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900">{scaffolding}</p>
        </div>
      )}

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Write your response here…"
        rows={6}
        className="w-full rounded-xl border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-gold/30"
      />

      {/* Feedback banner */}
      {feedback && (
        <div className={`rounded-xl border px-4 py-3 text-sm leading-relaxed flex gap-3 items-start ${
          passed
            ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200'
            : 'border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-200'
        }`}>
          {passed && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />}
          <span>{feedback}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {!showHint && scaffolding && (
            <button
              onClick={() => setShowHint(true)}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              Need a hint?
            </button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={!notes.trim() || saving}
          >
            {saving ? 'Saving…' : 'Save to Knowledge Base'}
          </Button>
        </div>

        <Button
          size="sm"
          onClick={handleCheck}
          disabled={!notes.trim() || checking || passed}
          className="bg-gold hover:bg-gold/90 text-gold-foreground"
        >
          {checking ? 'Checking…' : passed ? 'Looks good ✓' : feedback ? 'Check again' : 'Check my work'}
        </Button>
      </div>
    </div>
  )
}
