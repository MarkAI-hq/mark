'use client'

// src/components/prediction/calibration-sliders.tsx
// N8: Admin-only calibration sliders for bloom's/topic sensitivity

import { useState, useTransition } from 'react'
import { toast }     from 'sonner'
import { Settings2, ChevronDown, ChevronRight, Save, RotateCcw } from 'lucide-react'
import { Button }    from '@/components/ui/button'
import { calibratePrediction } from '@/lib/actions/prediction'

interface CalibrationSlidersProps {
  curriculumId:       string
  initialBlooms?:     number
  initialTopic?:      number
}

export function CalibrationSliders({
  curriculumId,
  initialBlooms = 0.65,
  initialTopic  = 0.15,
}: CalibrationSlidersProps) {
  const [open,       setOpen]       = useState(false)
  const [blooms,     setBlooms]     = useState(initialBlooms)
  const [topic,      setTopic]      = useState(initialTopic)
  const [isPending,  startTransition] = useTransition()

  const handleSave = () => {
    startTransition(async () => {
      const { error } = await calibratePrediction(curriculumId, blooms, topic)
      if (error) { toast.error(error.message); return }
      toast.success('Calibration updated — recalculate predictions to see effect.')
    })
  }

  const handleReset = () => {
    setBlooms(0.65)
    setTopic(0.15)
  }

  return (
    <div className="rounded-lg border border-border bg-muted overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2">
          <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">Prediction calibration</span>
          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded">Admin only</span>
        </div>
        {open
          ? <ChevronDown  className="h-3.5 w-3.5 text-muted-foreground" />
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        }
      </button>

      {open && (
        <div className="border-t border-border px-4 py-4 space-y-5">
          <p className="text-xs text-muted-foreground">
            Adjust how heavily Bloom&apos;s-level performance and topic mastery influence the predicted score.
            Changes apply on the next prediction recalculation.
          </p>

          {/* Bloom's sensitivity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Bloom&apos;s sensitivity</label>
              <span className="text-xs font-semibold text-foreground tabular-nums w-10 text-right">
                {Math.round(blooms * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={blooms}
              onChange={e => setBlooms(parseFloat(e.target.value))}
              className="w-full accent-slate-700"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0% (ignore)</span>
              <span>100% (full weight)</span>
            </div>
          </div>

          {/* Topic sensitivity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Topic mastery sensitivity</label>
              <span className="text-xs font-semibold text-foreground tabular-nums w-10 text-right">
                {Math.round(topic * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={topic}
              onChange={e => setTopic(parseFloat(e.target.value))}
              className="w-full accent-slate-700"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>0% (ignore)</span>
              <span>100% (full weight)</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={handleReset} disabled={isPending}>
              <RotateCcw className="h-3 w-3" /> Reset defaults
            </Button>
            <Button size="sm" className="h-7 text-xs gap-1 ml-auto" onClick={handleSave} disabled={isPending}>
              <Save className="h-3 w-3" />
              {isPending ? 'Saving…' : 'Save calibration'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
