// src/components/tracy/widget-renderer.tsx
'use client'

// Sandboxed renderer for the AI-generated HTML/Chart.js widgets Tracy embeds
// via its __WIDGET__ marker. Extracted out of tracy-page.tsx as its own
// standalone, independently-exported component -- already-debugged
// infrastructure (theme-variable injection, ResizeObserver-based auto-
// height, CDN-script stripping, light/dark color fixups) that's worth
// reusing anywhere else in the app that needs to render an AI-generated
// chart, not just Tracy's own chat.

import { useEffect, useRef, useState } from 'react'

export function WidgetRenderer({ html, messageId }: { html: string; messageId: string }) {
  const [height, setHeight] = useState(200)
  const [srcDoc, setSrcDoc] = useState('')
  const lastHeightRef = useRef(0)

  useEffect(() => {
    if (typeof document === 'undefined') return

    const cs = getComputedStyle(document.documentElement)
    const vars = ['--background', '--foreground', '--muted', '--muted-foreground', '--border', '--card', '--radius']
      .map((v) => { const val = cs.getPropertyValue(v).trim(); return val ? `${v}:${val}` : '' })
      .filter(Boolean)
      .join(';')

    // Debounced resize — fires 80 ms after the last layout change settles
    const resizeScript =
      `(function(){var t,last=0;` +
      `function r(){clearTimeout(t);t=setTimeout(function(){` +
      `var h=document.body.scrollHeight;` +
      `if(Math.abs(h-last)>2){last=h;` +
      `window.parent.postMessage({type:"tracy-widget-resize",id:"${messageId}",height:h},"*");}` +
      `},80);}` +
      `window.addEventListener("load",r);` +
      `if(window.ResizeObserver){new ResizeObserver(r).observe(document.body);}` +
      `})();`

    // Strip full-document wrapper tags Tracy may have included
    const clean = html
      .replace(/<\/body>\s*(<\/html>)?\s*$/i, '')
      .replace(/<\/html>\s*$/i, '')
      .replace(/<!DOCTYPE[^>]*>/gi, '')
      .replace(/<html[^>]*>/gi, '')
      .replace(/<head>[\s\S]*?<\/head>/gi, '')
      .replace(/<body[^>]*>/gi, '')
      // Remove any Chart.js CDN Tracy included — we inject it ourselves below
      .replace(/<script[^>]*(?:cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net)[^>]*chart[^>]*>\s*<\/script>/gi, '')
      .trim()

    // Palette: visually distinct, works on both light and dark backgrounds
    const palette = [
      '#6366f1', '#10b981', '#f59e0b', '#ef4444',
      '#3b82f6', '#a855f7', '#14b8a6', '#f97316',
    ]
    const paletteAlpha = palette.map((c) => c + 'cc')

    // Plugin: assign per-bar colors when Tracy hasn't specified them explicitly
    const palettePlugin =
      `Chart.register({id:"tracyPalette",beforeRender:function(chart){` +
      `var P=${JSON.stringify(palette)},A=${JSON.stringify(paletteAlpha)};` +
      `chart.data.datasets.forEach(function(ds){` +
      `var isSingleColor=!Array.isArray(ds.backgroundColor)&&` +
      `(ds.backgroundColor==null||typeof ds.backgroundColor==="string");` +
      `if((chart.config.type==="bar"||chart.config.type==="horizontalBar")&&isSingleColor){` +
      `var n=ds.data.length;` +
      `ds.backgroundColor=Array.from({length:n},function(_,i){return A[i%A.length];});` +
      `ds.borderColor=Array.from({length:n},function(_,i){return P[i%P.length];});` +
      `ds.borderWidth=1;` +
      `}})}});`

    // JS that fixes hardcoded light-mode inline colors after Tracy's HTML renders.
    // Uses raw getAttribute("style") for color checks because browsers normalize hex (#333)
    // to rgb(51,51,51) before el.style.color is readable, making hex-based regex unreliable.
    const darkModeFixer =
      `document.addEventListener("DOMContentLoaded",function(){` +
      `var LIGHT_BG=/^(#fff(fff)?|white|rgb\\(255,\\s*255,\\s*255\\)|rgba\\(255,\\s*255,\\s*255,\\s*1\\))$/i;` +
      `document.querySelectorAll("[style]").forEach(function(el){` +
      `var s=el.style;` +
      `var raw=el.getAttribute("style")||"";` +
      `var bg=(s.background||s.backgroundColor||"").trim();` +
      `if(LIGHT_BG.test(bg)){s.background="hsl(var(--card))";s.backgroundColor="";}` +
      `if(/(?:^|[;\\s])color\\s*:\\s*(#(?:0{3,6}|1{3,6}|2{3,6}|3{3,6})|black)\\b/i.test(raw)){` +
      `s.color="hsl(var(--foreground))";}` +
      `});` +
      `});`

    setSrcDoc(
      `<!DOCTYPE html><html><head><meta charset="utf-8"><style>` +
      `:root{${vars};--brand:#c9a84c;--brand-10:rgba(201,168,76,0.1);` +
      `--mi-green-dark:#085041;--mi-green-mid:#1D9E75;--mi-green-light:#E1F5EE;--mi-green-pale:#9FE1CB;` +
      `--mi-gold-dark:#633806;--mi-gold-mid:#BA7517;--mi-gold-light:#FAEEDA;` +
      `--mi-purple-dark:#3C3489;--mi-purple-mid:#7F77DD;--mi-purple-light:#EEEDFE;` +
      `--mi-red-dark:#791F1F;--mi-red-mid:#E24B4A;--mi-red-light:#FCEBEB;` +
      `--mi-gray-mid:#B4B2A9;--mi-gray-dark:#444441;}` +
      `*{box-sizing:border-box;margin:0;padding:0;}` +
      `html,body{background:hsl(var(--card));color:hsl(var(--foreground));` +
      `font-family:system-ui,-apple-system,BlinkMacSystemFont,sans-serif;` +
      `font-size:13px;line-height:1.5;}` +
      // 16 px breathing room on all sides — prevents text running edge-to-edge
      `body{padding:16px;}` +
      // Typography resets so Tracy's prose looks clean
      `p{margin-bottom:8px;}p:last-child{margin-bottom:0;}` +
      `b,strong{font-weight:600;}` +
      `h1,h2,h3,h4{font-weight:600;line-height:1.3;margin-bottom:6px;}` +
      `canvas{max-width:100%;display:block;}` +
      `</style></head><body>` +
      `<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js"></script>` +
      `<script>if(window.Chart){` +
      `Chart.defaults.color="hsl(var(--muted-foreground))";` +
      `Chart.defaults.borderColor="hsl(var(--border))";` +
      `Chart.defaults.plugins.legend.labels.color="hsl(var(--foreground))";` +
      `Chart.defaults.scale.grid.color="hsl(var(--border))";` +
      `Chart.defaults.scale.ticks.color="hsl(var(--muted-foreground))";` +
      palettePlugin +
      `}</script>` +
      clean +
      `<scr` + `ipt>${darkModeFixer}${resizeScript}<\/scr` + `ipt>` +
      `</body></html>`
    )
  }, [html, messageId])

  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.type === 'tracy-widget-resize' && e.data?.id === messageId) {
        const h = Math.max(80, Math.min(600, (e.data.height as number) + 16))
        if (Math.abs(h - lastHeightRef.current) > 2) {
          lastHeightRef.current = h
          setHeight(h)
        }
      }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
  }, [messageId])

  if (!srcDoc) {
    return <div style={{ height: '200px' }} className="bg-muted/40 animate-pulse" />
  }

  return (
    <iframe
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      style={{ width: '100%', height: `${height}px`, border: 'none', display: 'block' }}
      title="Tracy visualization"
    />
  )
}
