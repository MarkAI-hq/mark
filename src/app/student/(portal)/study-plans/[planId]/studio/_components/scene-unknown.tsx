'use client'

// SPEC-05 S5-R4 — a scene type (or template) this version of the app does not
// know is shown honestly, never as a blank screen, and never locks Next.
import { useEffect } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SceneUnknown({ scene, onReady }: { scene: any; onReady?: () => void }) {
  useEffect(() => {
    onReady?.()
  }, [onReady])
  return (
    <div className="space-y-4">
      {scene?.title && <h2 className="text-xl sm:text-2xl font-bold leading-tight">{scene.title}</h2>}
      <div className="rounded-2xl border border-amber-300 bg-amber-50 px-5 py-4 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
        <p className="font-medium">This activity needs an app update.</p>
        <p className="mt-1 text-sm">Refresh the page to load it. You can also continue the lesson and come back later.</p>
        <Button variant="outline" size="sm" className="mt-3 min-h-[44px] gap-1.5" onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>
    </div>
  )
}
