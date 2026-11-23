'use client'

// Focus sounds (Focus Mode v1, spec §5.3). Everything is synthesised with the
// Web Audio API: no audio files, zero network use. One shared AudioContext,
// created on the learner's Start click (browsers block audio before a gesture).
// Play mode never owns audio — the PiP window only sends commands here.

import type { FocusSoundId } from './systems'

export type PulseDepth = 'off' | 'low' | 'high'
const PULSE_DEPTH: Record<PulseDepth, number> = { off: 0, low: 0.15, high: 0.3 }
const PULSE_RATE_HZ = 15
const FADE_S = 2
const NOISE_SECONDS = 4

type Ctx = AudioContext

let ctx: Ctx | null = null
let master: GainNode | null = null // volume
let fader: GainNode | null = null // break fades
let current: { stop: () => void; setPulse?: (d: PulseDepth) => void } | null = null
let currentSound: FocusSoundId = 'silence'
let volume01 = 0.5
let pulseDepth: PulseDepth = 'low'
const buffers: Partial<Record<'brown' | 'pink', AudioBuffer>> = {}

function AudioCtor(): typeof AudioContext | null {
  if (typeof window === 'undefined') return null
  return (
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ??
    null
  )
}

/** Must be called from a user gesture (the Start / resume click). */
export function ensureAudio(): Ctx | null {
  const C = AudioCtor()
  if (!C) return null
  if (!ctx) {
    ctx = new C()
    fader = ctx.createGain()
    master = ctx.createGain()
    master.gain.value = volume01 * volume01 // perceptual curve
    fader.connect(master)
    master.connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume().catch(() => {})
  return ctx
}

export function getAudioContext(): Ctx | null {
  return ctx
}

/** True when sound should be playing but the browser has it suspended (reload). */
export function audioNeedsGesture(): boolean {
  return currentSound !== 'silence' && (!ctx || ctx.state !== 'running')
}

function noiseBuffer(kind: 'brown' | 'pink'): AudioBuffer {
  const c = ctx!
  const cached = buffers[kind]
  if (cached && cached.sampleRate === c.sampleRate) return cached
  const len = Math.floor(c.sampleRate * NOISE_SECONDS)
  const buf = c.createBuffer(1, len, c.sampleRate)
  const d = buf.getChannelData(0)
  if (kind === 'brown') {
    // Brown: integrate white noise with a small leak.
    let last = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      last = (last + 0.02 * w) / 1.02
      d[i] = last * 3.5
    }
  } else {
    // Pink: Paul Kellet's refined filter.
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      b0 = 0.99886 * b0 + w * 0.0555179
      b1 = 0.99332 * b1 + w * 0.0750759
      b2 = 0.969 * b2 + w * 0.153852
      b3 = 0.8665 * b3 + w * 0.3104856
      b4 = 0.55 * b4 + w * 0.5329522
      b5 = -0.7616 * b5 - w * 0.016898
      d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
      b6 = w * 0.115926
    }
  }
  buffers[kind] = buf
  return buf
}

function loop(kind: 'brown' | 'pink'): AudioBufferSourceNode {
  const src = ctx!.createBufferSource()
  src.buffer = noiseBuffer(kind)
  src.loop = true
  return src
}

function build(sound: FocusSoundId) {
  const c = ctx!
  const out = fader!
  if (sound === 'silence') return null

  if (sound === 'brown' || sound === 'pink') {
    const src = loop(sound)
    src.connect(out)
    src.start()
    return { stop: () => { try { src.stop() } catch {} src.disconnect() } }
  }

  if (sound === 'rain') {
    // Rain: pink noise through a band-pass with a slow random gain wobble.
    const src = loop('pink')
    const bp = c.createBiquadFilter()
    bp.type = 'bandpass'
    bp.frequency.value = 1400
    bp.Q.value = 0.6
    const wobble = c.createGain()
    wobble.gain.value = 0.9
    src.connect(bp).connect(wobble).connect(out)
    src.start()
    const timer = window.setInterval(() => {
      if (!ctx) return
      wobble.gain.setTargetAtTime(0.65 + Math.random() * 0.45, ctx.currentTime, 0.6)
    }, 700)
    return {
      stop: () => {
        window.clearInterval(timer)
        try { src.stop() } catch {}
        src.disconnect(); bp.disconnect(); wobble.disconnect()
      },
    }
  }

  // Pulse: brown noise through a gain modulated by a 15 Hz oscillator.
  const src = loop('brown')
  const amp = c.createGain()
  const osc = c.createOscillator()
  const depth = c.createGain()
  osc.frequency.value = PULSE_RATE_HZ
  const apply = (d: PulseDepth) => {
    const v = PULSE_DEPTH[d]
    amp.gain.setValueAtTime(1 - v, c.currentTime)
    depth.gain.setValueAtTime(v, c.currentTime)
  }
  apply(pulseDepth)
  osc.connect(depth).connect(amp.gain)
  src.connect(amp).connect(out)
  src.start()
  osc.start()
  return {
    stop: () => {
      try { src.stop(); osc.stop() } catch {}
      src.disconnect(); osc.disconnect(); depth.disconnect(); amp.disconnect()
    },
    setPulse: apply,
  }
}

/** Switch the playing sound. No-op without a context (call ensureAudio first). */
export function playSound(sound: FocusSoundId) {
  currentSound = sound
  if (!ctx) return
  current?.stop()
  current = build(sound)
}

/** The sound currently built into the graph ('silence' when none). */
export function playingSound(): FocusSoundId {
  return current ? currentSound : 'silence'
}

export function stopSound() {
  current?.stop()
  current = null
  currentSound = 'silence'
}

/** Volume 0..100. */
export function setVolume(v: number) {
  volume01 = Math.min(100, Math.max(0, v)) / 100
  if (ctx && master) master.gain.setTargetAtTime(volume01 * volume01, ctx.currentTime, 0.05)
}

export function setPulseDepth(d: PulseDepth) {
  pulseDepth = d
  current?.setPulse?.(d)
}

/** 2 s fade out when a break starts. */
export function fadeOut(seconds = FADE_S) {
  if (!ctx || !fader) return
  const t = ctx.currentTime
  fader.gain.cancelScheduledValues(t)
  fader.gain.setValueAtTime(fader.gain.value, t)
  fader.gain.linearRampToValueAtTime(0, t + seconds)
}

/** 2 s fade in when focus resumes. */
export function fadeIn(seconds = FADE_S) {
  if (!ctx || !fader) return
  const t = ctx.currentTime
  fader.gain.cancelScheduledValues(t)
  fader.gain.setValueAtTime(fader.gain.value, t)
  fader.gain.linearRampToValueAtTime(1, t + seconds)
}

/** Jump the fader without a ramp (e.g. restoring mid-break after reload). */
export function setFaderImmediate(on: boolean) {
  if (!ctx || !fader) return
  fader.gain.cancelScheduledValues(ctx.currentTime)
  fader.gain.setValueAtTime(on ? 1 : 0, ctx.currentTime)
}

/**
 * A short two-note chime, independent of the focus volume so a break alarm is
 * audible even with sound set to silence.
 */
export function chime(kind: 'break' | 'focus' | 'warning' = 'break') {
  const c = ctx ?? ensureAudio()
  if (!c) return
  if (c.state === 'suspended') void c.resume().catch(() => {})
  const notes =
    kind === 'focus' ? [523.25, 783.99] : kind === 'warning' ? [880, 880] : [783.99, 523.25]
  const t0 = c.currentTime + 0.02
  notes.forEach((f, i) => {
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'sine'
    o.frequency.value = f
    const t = t0 + i * 0.22
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.28, t + 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
    o.connect(g).connect(c.destination)
    o.start(t)
    o.stop(t + 1)
  })
}
