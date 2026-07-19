'use client'

import { Star, Share2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface Props {
  scene: any
  initialMisconception?: string
}

export function SceneMasteryMoment({ scene, initialMisconception }: Props) {
  const { content } = scene
  const { topic, what_changed, key_insight, share_text } = content ?? {}

  function handleShare() {
    if (share_text) {
      navigator.clipboard.writeText(share_text).then(() => {
        toast.success('Copied to clipboard — share it with someone you know!')
      }).catch(() => {
        toast.error('Could not copy to clipboard.')
      })
    }
  }

  return (
    <div className="space-y-6 text-center">
      <div className="flex justify-center">
        <div className="h-16 w-16 rounded-full bg-gold/20 flex items-center justify-center">
          <Star className="h-8 w-8 text-gold fill-gold" />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Mastered</p>
        <h2 className="font-bold text-2xl leading-tight">{topic}</h2>
      </div>

      {initialMisconception && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-6 py-5 text-left space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400">You began thinking</p>
            <p className="text-amber-900 dark:text-amber-200 leading-relaxed italic">&ldquo;{initialMisconception}&rdquo;</p>
          </div>
          <div className="border-t border-amber-200 dark:border-amber-700 pt-3 space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Now you understand</p>
            <p className="text-emerald-900 dark:text-emerald-200 leading-relaxed">{what_changed}</p>
          </div>
        </div>
      )}

      {!initialMisconception && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 px-6 py-5 text-left space-y-2">
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">What changed</p>
          <p className="text-emerald-900 dark:text-emerald-200 leading-relaxed">{what_changed}</p>
        </div>
      )}

      {key_insight && (
        <div className="rounded-2xl border bg-card px-6 py-4 text-left">
          <p className="text-sm text-muted-foreground mb-1">Key insight</p>
          <p className="font-medium text-base leading-snug">{key_insight}</p>
        </div>
      )}

      {share_text && (
        <Button variant="outline" size="sm" className="gap-2 mx-auto" onClick={handleShare}>
          <Share2 className="h-4 w-4" />
          Share what you learned
        </Button>
      )}
    </div>
  )
}
