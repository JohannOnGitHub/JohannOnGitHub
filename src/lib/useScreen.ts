import { useSyncExternalStore } from 'react'

type ScreenInfo = { w: number; h: number; portrait: boolean }

let cached: ScreenInfo = read()
function read(): ScreenInfo {
  const w = window.innerWidth
  const h = window.innerHeight
  return { w, h, portrait: h >= w }
}

function subscribe(cb: () => void) {
  const on = () => {
    cached = read()
    cb()
  }
  window.addEventListener('resize', on)
  window.addEventListener('orientationchange', on)
  return () => {
    window.removeEventListener('resize', on)
    window.removeEventListener('orientationchange', on)
  }
}

/** Viewport size, so characters can be sized for portrait tablets and phones. */
export function useScreen(): ScreenInfo {
  return useSyncExternalStore(subscribe, () => cached)
}

/** Character size that fits the screen: `frac` of the short side, clamped. */
export function fit(s: ScreenInfo, frac: number, min: number, max: number) {
  return Math.round(Math.max(min, Math.min(max, Math.min(s.w, s.h * 0.75) * frac)))
}
