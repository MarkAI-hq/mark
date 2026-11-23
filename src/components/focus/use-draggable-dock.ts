'use client'

// Drag-anywhere positioning for the Focus dock.
//
// The position is stored as the pill's centre in viewport *fractions*
// (0..1), not pixels, so it survives window resizes and phone rotation.
// From that point we derive which quadrant the dock sits in and anchor the
// container to the nearest corner, so the expanded panel always opens toward
// the middle of the screen instead of off its edge.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent,
} from 'react'

const STORAGE_KEY = 'mirror_focus_dock_pos'
const MARGIN = 12          // keep this far from every viewport edge (px)
const GAP = 8              // pill ↔ panel gap, matches the container's gap-2
const DRAG_THRESHOLD = 5   // px of movement before a press becomes a drag
const KEY_STEP = 24        // px per arrow-key press

export interface DockPos { fx: number; fy: number }

function loadPos(): DockPos | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as DockPos
    if (typeof p.fx === 'number' && typeof p.fy === 'number') return p
  } catch {
    /* ignore */
  }
  return null
}

function savePos(p: DockPos | null) {
  try {
    if (p) localStorage.setItem(STORAGE_KEY, JSON.stringify(p))
    else localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

export function useDraggableDock() {
  const pillEl = useRef<HTMLDivElement | null>(null)
  const observer = useRef<ResizeObserver | null>(null)
  const [pos, setPosState] = useState<DockPos | null>(null)
  const posRef = useRef<DockPos | null>(null)
  const setPos = (p: DockPos | null) => {
    posRef.current = p
    setPosState(p)
  }
  const [viewport, setViewport] = useState({ w: 0, h: 0 })
  const [pill, setPill] = useState({ w: 0, h: 0 })
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ startX: number; startY: number; offX: number; offY: number; moved: boolean; id: number } | null>(null)
  // Set when a press turned into a drag, so the click that follows is swallowed.
  const suppressClick = useRef(false)

  useEffect(() => {
    setPos(loadPos())
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Callback ref: the pill mounts after hydration and changes width (idle
  // "Focus" vs a running clock), so observe whichever node is attached.
  const pillRef = useCallback((node: HTMLDivElement | null) => {
    observer.current?.disconnect()
    pillEl.current = node
    if (!node) return
    const measure = () => setPill({ w: node.offsetWidth, h: node.offsetHeight })
    measure()
    observer.current = new ResizeObserver(measure)
    observer.current.observe(node)
  }, [])
  useEffect(() => () => observer.current?.disconnect(), [])

  /** Pill's top-left in px, clamped inside the viewport. */
  const pillBox = useCallback(
    (p: DockPos) => {
      const { w: vw, h: vh } = viewport
      return {
        left: clamp(p.fx * vw - pill.w / 2, MARGIN, Math.max(MARGIN, vw - pill.w - MARGIN)),
        top: clamp(p.fy * vh - pill.h / 2, MARGIN, Math.max(MARGIN, vh - pill.h - MARGIN)),
      }
    },
    [viewport, pill],
  )

  const posFromPill = useCallback(
    (left: number, top: number): DockPos => {
      const { w: vw, h: vh } = viewport
      const l = clamp(left, MARGIN, Math.max(MARGIN, vw - pill.w - MARGIN))
      const t = clamp(top, MARGIN, Math.max(MARGIN, vh - pill.h - MARGIN))
      return { fx: (l + pill.w / 2) / vw, fy: (t + pill.h / 2) / vh }
    },
    [viewport, pill],
  )

  // Move/up are tracked on `window`, not the pill: a quick drag leaves the
  // pill before its first pointermove, and the pill would never see it.
  // (Pointer capture would fix that too, but it retargets the trailing click
  // to the pill, so taps on the pill's own buttons would stop working.)
  const posFromPillRef = useRef(posFromPill)
  posFromPillRef.current = posFromPill
  const listeners = useRef<{ move: (e: globalThis.PointerEvent) => void; up: (e: globalThis.PointerEvent) => void } | null>(null)

  const detach = () => {
    if (!listeners.current) return
    window.removeEventListener('pointermove', listeners.current.move)
    window.removeEventListener('pointerup', listeners.current.up)
    window.removeEventListener('pointercancel', listeners.current.up)
    listeners.current = null
  }
  useEffect(() => detach, [])

  const onPointerMove = (e: globalThis.PointerEvent) => {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    if (!d.moved) {
      if (Math.hypot(e.clientX - d.startX, e.clientY - d.startY) < DRAG_THRESHOLD) return
      d.moved = true
      setDragging(true)
    }
    setPos(posFromPillRef.current(e.clientX - d.offX, e.clientY - d.offY))
  }

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return
    const rect = pillEl.current?.getBoundingClientRect()
    if (!rect) return
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      offX: e.clientX - rect.left,
      offY: e.clientY - rect.top,
      moved: false,
      id: e.pointerId,
    }
    detach()
    listeners.current = { move: onPointerMove, up: endDrag }
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
  }

  function endDrag(e: globalThis.PointerEvent) {
    const d = drag.current
    if (!d || d.id !== e.pointerId) return
    drag.current = null
    detach()
    if (d.moved) {
      // The browser dispatches the drag's trailing click right after
      // pointerup; clear the flag afterwards so a drag that produces no click
      // can't swallow the user's next real tap.
      suppressClick.current = true
      setTimeout(() => { suppressClick.current = false }, 0)
      setDragging(false)
      savePos(posRef.current)
    }
  }

  /** Attach to the pill as onClickCapture: eats the click that ends a drag. */
  const onClickCapture = (e: ReactMouseEvent) => {
    if (suppressClick.current) {
      suppressClick.current = false
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const reset = () => {
    setPos(null)
    savePos(null)
  }

  /** Arrow keys on the grip move the dock; Home resets it. */
  const onGripKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    const dirs: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    }
    if (e.key === 'Home') {
      e.preventDefault()
      reset()
      return
    }
    const dir = dirs[e.key]
    if (!dir) return
    e.preventDefault()
    e.stopPropagation()
    const rect = pillEl.current?.getBoundingClientRect()
    if (!rect) return
    const next = posFromPill(rect.left + dir[0] * KEY_STEP, rect.top + dir[1] * KEY_STEP)
    setPos(next)
    savePos(next)
  }

  // ── Layout derived from the position ────────────────────────────────────
  // null position (or not measured yet) → the original bottom-right corner.
  const ready = pos !== null && viewport.w > 0 && pill.w > 0
  let containerStyle: CSSProperties = { right: 16, bottom: 16 }
  let fromTop = false
  let fromLeft = false
  let panelMaxHeight = viewport.h ? viewport.h - pill.h - 16 - GAP - MARGIN : undefined

  if (ready) {
    const { left, top } = pillBox(pos)
    fromTop = top + pill.h / 2 < viewport.h / 2
    fromLeft = left + pill.w / 2 < viewport.w / 2
    containerStyle = {
      ...(fromLeft ? { left } : { right: viewport.w - left - pill.w }),
      ...(fromTop ? { top } : { bottom: viewport.h - top - pill.h }),
    }
    panelMaxHeight = fromTop
      ? viewport.h - (top + pill.h + GAP) - MARGIN
      : top - GAP - MARGIN
  }

  return {
    pillRef,
    dragging,
    fromTop,
    fromLeft,
    containerStyle,
    // Quadrant logic always opens toward the larger half, so this is never tiny.
    panelMaxHeight: panelMaxHeight && panelMaxHeight > 0 ? panelMaxHeight : undefined,
    moved: pos !== null,
    reset,
    pillHandlers: {
      onPointerDown,
      onClickCapture,
    },
    onGripKeyDown,
  }
}
