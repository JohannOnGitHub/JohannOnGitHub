// Background music: traditional French nursery tunes (public domain),
// played as a soft music box with Web Audio — no audio files needed.
import { useSyncExternalStore } from 'react'
import { ac } from './sfx'

export type TuneId = 'maman' | 'jacques' | 'lune'

// Notes as [midi, beats]. 0 = rest.
const TUNES: Record<TuneId, { bpm: number; notes: [number, number][] }> = {
  // « Ah ! vous dirai-je, maman »
  maman: {
    bpm: 104,
    notes: [
      [60, 1], [60, 1], [67, 1], [67, 1], [69, 1], [69, 1], [67, 2],
      [65, 1], [65, 1], [64, 1], [64, 1], [62, 1], [62, 1], [60, 2],
      [67, 1], [67, 1], [65, 1], [65, 1], [64, 1], [64, 1], [62, 2],
      [67, 1], [67, 1], [65, 1], [65, 1], [64, 1], [64, 1], [62, 2],
      [60, 1], [60, 1], [67, 1], [67, 1], [69, 1], [69, 1], [67, 2],
      [65, 1], [65, 1], [64, 1], [64, 1], [62, 1], [62, 1], [60, 2], [0, 2],
    ],
  },
  // « Frère Jacques »
  jacques: {
    bpm: 112,
    notes: [
      [65, 1], [67, 1], [69, 1], [65, 1], [65, 1], [67, 1], [69, 1], [65, 1],
      [69, 1], [70, 1], [72, 2], [69, 1], [70, 1], [72, 2],
      [72, 0.5], [74, 0.5], [72, 0.5], [70, 0.5], [69, 1], [65, 1],
      [72, 0.5], [74, 0.5], [72, 0.5], [70, 0.5], [69, 1], [65, 1],
      [65, 1], [60, 1], [65, 2], [65, 1], [60, 1], [65, 2], [0, 2],
    ],
  },
  // « Au clair de la lune »
  lune: {
    bpm: 96,
    notes: [
      [67, 1], [67, 1], [67, 1], [69, 1], [71, 2], [69, 2],
      [67, 1], [71, 1], [69, 1], [69, 1], [67, 4],
      [67, 1], [67, 1], [67, 1], [69, 1], [71, 2], [69, 2],
      [67, 1], [71, 1], [69, 1], [69, 1], [67, 4],
      [69, 1], [69, 1], [69, 1], [69, 1], [64, 2], [64, 2],
      [69, 1], [67, 1], [66, 1], [64, 1], [62, 4],
      [67, 1], [67, 1], [67, 1], [69, 1], [71, 2], [69, 2],
      [67, 1], [71, 1], [69, 1], [69, 1], [67, 4], [0, 2],
    ],
  },
}

const VOLUME = 0.5
const KEY = 'marmotte:music'

let enabled = (() => {
  try {
    return localStorage.getItem(KEY) !== 'off'
  } catch {
    return true
  }
})()
let master: GainNode | null = null
let tune: TuneId | null = null
let wanted: TuneId = 'maman'
let noteIdx = 0
let nextTime = 0
let timer: ReturnType<typeof setInterval> | null = null
let duckLevel = 1
let unlocked = false
const listeners = new Set<() => void>()

const freq = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

function out() {
  const c = ac()
  if (!c) return null
  if (!master) {
    master = c.createGain()
    master.gain.value = 0
    master.connect(c.destination)
  }
  return { c, master }
}

function pluck(c: AudioContext, dest: AudioNode, f: number, t: number, dur: number, vol: number, type: OscillatorType) {
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = f
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0005, t + Math.max(0.25, dur * 1.6))
  o.connect(g).connect(dest)
  o.start(t)
  o.stop(t + Math.max(0.3, dur * 1.7))
}

function schedule() {
  const o = out()
  if (!o || !tune) return
  const { c, master: m } = o
  const t = TUNES[tune]
  const beat = 60 / t.bpm
  if (nextTime < c.currentTime) nextTime = c.currentTime + 0.05
  while (nextTime < c.currentTime + 0.4) {
    const [midi, beats] = t.notes[noteIdx]
    const dur = beats * beat
    if (midi) {
      // music-box melody, an octave up, with a soft sine shimmer
      pluck(c, m, freq(midi + 12), nextTime, dur, 0.09, 'triangle')
      pluck(c, m, freq(midi + 24), nextTime, dur * 0.6, 0.02, 'sine')
      // gentle bass on longer notes
      if (beats >= 2) pluck(c, m, freq(midi - 12), nextTime, dur, 0.05, 'sine')
    }
    nextTime += dur
    noteIdx = (noteIdx + 1) % t.notes.length
  }
}

function applyGain() {
  const o = out()
  if (!o) return
  const target = enabled && unlocked && tune ? VOLUME * duckLevel : 0
  o.master.gain.cancelScheduledValues(o.c.currentTime)
  o.master.gain.setTargetAtTime(target, o.c.currentTime, 0.15)
}

function startLoop() {
  if (!enabled || !unlocked) return
  if (tune !== wanted) {
    tune = wanted
    noteIdx = 0
    const c = ac()
    nextTime = c ? c.currentTime + 0.1 : 0
  }
  if (!timer) timer = setInterval(schedule, 100)
  applyGain()
}

function stopLoop() {
  applyGain()
  if (timer) clearInterval(timer)
  timer = null
  tune = null
}

export const music = {
  /** Call from a tap: unlocks audio on iPhone and starts the music. */
  unlock() {
    // Let Web Audio play even when the iPhone's silent switch is on (Safari 16.4+).
    const nav = navigator as unknown as { audioSession?: { type: string } }
    try {
      if (nav.audioSession) nav.audioSession.type = 'playback'
    } catch {
      /* ignore */
    }
    const c = ac()
    if (c) {
      // A silent buffer played inside the gesture fully unlocks iOS audio.
      const b = c.createBuffer(1, 1, 22050)
      const s = c.createBufferSource()
      s.buffer = b
      s.connect(c.destination)
      s.start(0)
    }
    unlocked = true
    startLoop()
  },
  play(id: TuneId) {
    wanted = id
    if (unlocked && enabled) startLoop()
  },
  /** Softer while characters talk (0..1); 0 while the microphone listens. */
  duck(level: number) {
    duckLevel = level
    applyGain()
  },
  isOn: () => enabled,
  toggle() {
    enabled = !enabled
    try {
      localStorage.setItem(KEY, enabled ? 'on' : 'off')
    } catch {
      /* ignore */
    }
    if (enabled) startLoop()
    else stopLoop()
    listeners.forEach((l) => l())
  },
}

export function useMusicOn() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => enabled,
  )
}
