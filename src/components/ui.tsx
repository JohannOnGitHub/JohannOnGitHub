import { useEffect, useRef, useState } from 'react'
import { sfx } from '../lib/sfx'
import { music, useMusicOn } from '../lib/music'
import { speak, type VoiceStyle } from '../lib/speech'

export function MusicButton({ className }: { className?: string }) {
  const on = useMusicOn()
  return (
    <button className={`round-btn ${className ?? ''}`} onClick={() => music.toggle()} aria-label={on ? 'Couper la musique' : 'Mettre la musique'}>
      {on ? '🎵' : '🔇'}
    </button>
  )
}

/** Speech bubble. Children can't read yet, so tapping it reads it aloud again. */
export function Bubble({ who, text, side = 'left', voice }: { who?: string; text: string; side?: 'left' | 'right'; voice?: VoiceStyle }) {
  return (
    <div
      className={`bubble bubble-${side} ${voice ? 'tappable' : ''}`}
      onClick={voice ? () => void speak(text, voice) : undefined}
      role={voice ? 'button' : undefined}
    >
      {who && <div className="bubble-who">{who}</div>}
      <div>{text}</div>
      {voice && <span className="bubble-ear" aria-hidden>🔊</span>}
    </div>
  )
}

export function Confetti({ n = 60 }: { n?: number }) {
  const colors = ['#ff595e', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff9ec4', '#7fd3ff']
  return (
    <div className="confetti" aria-hidden>
      {Array.from({ length: n }).map((_, i) => (
        <i
          key={i}
          style={{
            left: `${(i * 37) % 100}%`,
            background: colors[i % colors.length],
            animationDelay: `${(i % 12) * 0.08}s`,
            animationDuration: `${1.8 + (i % 5) * 0.3}s`,
            transform: `rotate(${i * 29}deg)`,
          }}
        />
      ))}
    </div>
  )
}

export function TopBar({ onBack, stars, title, right }: { onBack?: () => void; stars?: number; title?: string; right?: React.ReactNode }) {
  return (
    <div className="topbar">
      {onBack ? (
        <button
          className="round-btn"
          onClick={() => {
            sfx.tap()
            onBack()
          }}
          aria-label="Retour"
        >
          ⬅️
        </button>
      ) : (
        <span />
      )}
      {title && <div className="topbar-title">{title}</div>}
      <div className="topbar-right">
        {right}
        <MusicButton />
        {stars !== undefined && <div className="stars-pill">⭐ {stars}</div>}
      </div>
    </div>
  )
}

/** A button that must be held for `ms` — keeps little fingers out of grown-up stuff. */
export function HoldButton({ ms = 1500, onDone, children, className }: { ms?: number; onDone: () => void; children: React.ReactNode; className?: string }) {
  const [p, setP] = useState(0)
  const t = useRef<number | null>(null)
  const start = () => {
    const t0 = performance.now()
    const step = () => {
      const v = Math.min(1, (performance.now() - t0) / ms)
      setP(v)
      if (v >= 1) {
        stop()
        onDone()
      } else t.current = requestAnimationFrame(step)
    }
    t.current = requestAnimationFrame(step)
  }
  const stop = () => {
    if (t.current) cancelAnimationFrame(t.current)
    t.current = null
    setP(0)
  }
  useEffect(() => stop, [])
  return (
    <button
      className={`hold-btn ${className ?? ''}`}
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onContextMenu={(e) => e.preventDefault()}
      style={{ ['--p' as string]: p }}
    >
      {children}
    </button>
  )
}
