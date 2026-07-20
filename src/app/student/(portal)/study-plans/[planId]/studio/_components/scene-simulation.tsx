'use client'

import { useEffect, useRef, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LessonProse } from '@/components/lesson/lesson-prose'

interface Props { scene: any }

// Maps the generic CSS vars used in simulation HTML to our actual design tokens.
// Simulation HTML is authored against these var names (matching Claude's artifact env).
const TOKEN_STYLE = `<style>
*, *::before, *::after { box-sizing: border-box; }
:root {
  --font-sans: 'Hanken Grotesk', system-ui, sans-serif;
  --color-background-primary:  hsl(0 0% 100%);
  --color-background-secondary: hsl(220 16% 94%);
  --color-text-primary:   hsl(222 47% 11%);
  --color-text-secondary: hsl(220 9% 46%);
  --color-text-tertiary:  hsl(220 9% 62%);
  --color-border-primary:   hsl(220 13% 76%);
  --color-border-secondary: hsl(220 13% 88%);
  --color-border-tertiary:  hsl(220 13% 93%);
  --border-radius-lg: 0.5rem;
  --border-radius-md: 0.375rem;
}
body {
  font-family: var(--font-sans);
  color: var(--color-text-primary);
  background: var(--color-background-primary);
  margin: 0;
  padding: 0.75rem 1rem 1.25rem;
  line-height: 1.5;
}
</style>`

// Sends content height to parent on load + any DOM resize.
// Also stubs sendPrompt() so mastery-screen "peer teach" buttons don't throw.
const BRIDGE_SCRIPT = `<script>
(function () {
  function sendSize() {
    var h = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    window.parent.postMessage({ type: 'mi-resize', height: h }, '*');
  }
  window.sendPrompt = function (text) {
    window.parent.postMessage({ type: 'mi-prompt', text: text }, '*');
  };
  if (document.readyState === 'complete') { sendSize(); }
  else { window.addEventListener('load', sendSize); }
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(sendSize).observe(document.body);
  }
})();
</script>`

function prepareHtml(raw: string): string {
  // Inject tokens — into <head> if present, otherwise prepend
  const withTokens = raw.includes('<head>')
    ? raw.replace('<head>', `<head>${TOKEN_STYLE}`)
    : `${TOKEN_STYLE}${raw}`

  // Inject bridge script — before </body> if present, otherwise append
  return withTokens.includes('</body>')
    ? withTokens.replace('</body>', `${BRIDGE_SCRIPT}</body>`)
    : `${withTokens}${BRIDGE_SCRIPT}`
}

export function SceneSimulation({ scene }: Props) {
  const { title, content, bloom_level } = scene
  const { simulation_html, description } = content ?? {}

  const [height, setHeight] = useState(360)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === 'mi-resize' && typeof e.data.height === 'number') {
        setHeight(Math.max(200, e.data.height + 32))
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const prepared = simulation_html ? prepareHtml(simulation_html) : null

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-4 w-4 text-gold shrink-0" />
        <h2 className="font-semibold text-base leading-tight flex-1">{title}</h2>
        {bloom_level && (
          <Badge variant="outline" className="text-[10px] shrink-0 capitalize border-gold/30 text-gold">
            {bloom_level}
          </Badge>
        )}
      </div>

      {description && (
        <p className="text-sm text-muted-foreground leading-relaxed"><LessonProse text={description} /></p>
      )}

      {prepared ? (
        <div className="rounded-xl border border-border/50 overflow-hidden bg-white shadow-sm">
          <iframe
            ref={iframeRef}
            srcDoc={prepared}
            sandbox="allow-scripts"
            className="w-full block"
            style={{ height, border: 'none' }}
            title={title}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/30 flex items-center justify-center h-40">
          <p className="text-sm text-muted-foreground">Simulation loading…</p>
        </div>
      )}
    </div>
  )
}
