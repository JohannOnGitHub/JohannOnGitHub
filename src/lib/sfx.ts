// Tiny synthesized sound effects (no audio files needed).
let ctx: AudioContext | null = null
export function ac() {
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!C) return null
    ctx = new C()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.18) {
  const c = ac()
  if (!c) return
  const o = c.createOscillator()
  const g = c.createGain()
  o.type = type
  o.frequency.value = freq
  g.gain.setValueAtTime(0, c.currentTime + start)
  g.gain.linearRampToValueAtTime(vol, c.currentTime + start + 0.02)
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + start + dur)
  o.connect(g).connect(c.destination)
  o.start(c.currentTime + start)
  o.stop(c.currentTime + start + dur + 0.05)
}

export const sfx = {
  tap: () => tone(660, 0, 0.08, 'triangle', 0.12),
  pop: () => {
    tone(900, 0, 0.06, 'square', 0.08)
    tone(1400, 0.03, 0.06, 'sine', 0.1)
  },
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.11, 0.3, 'triangle')),
  star: () => [1046, 1318, 1568].forEach((f, i) => tone(f, i * 0.07, 0.25, 'sine', 0.12)),
  oops: () => {
    tone(392, 0, 0.18, 'triangle', 0.12)
    tone(330, 0.15, 0.25, 'triangle', 0.12)
  },
  listen: () => tone(880, 0, 0.12, 'sine', 0.1),
  vroom: () => {
    const c = ac()
    if (!c) return
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'sawtooth'
    o.frequency.setValueAtTime(80, c.currentTime)
    o.frequency.exponentialRampToValueAtTime(240, c.currentTime + 0.5)
    g.gain.setValueAtTime(0.08, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.6)
    o.connect(g).connect(c.destination)
    o.start()
    o.stop(c.currentTime + 0.65)
  },
}
