// Lines spoken by the local friends. Shared by the game screens and by the
// script that pre-records voices (scripts/voice-lines.ts), so both always match.
import type { Activity, Place } from './content'

type Fam = { parent: string; mamie: string; papi: string }
export const fill = (s: string, f: Fam) => s.replace(/\{parent\}/g, f.parent).replace(/\{mamie\}/g, f.mamie).replace(/\{papi\}/g, f.papi)

export const placeWelcome = (p: Place, f: Fam) => fill(p.welcome, f) + ' Touche une image pour jouer !'

export function missLine(a: Activity, f: Fam, n: number, little: boolean) {
  if (n === 1) return little && a.hint ? `Presque ! ${fill(a.hint, f)}` : 'Presque ! Essaie encore !'
  return a.hint ? `Essaie encore ! ${fill(a.hint, f)}` : `Essaie encore ! ${f.parent} peut t’aider !`
}

export const effortLine = (a: Activity, f: Fam) => `Bravo d’avoir essayé ! ${fill(a.hint ?? a.ask, f)}`

/** Every line a place's friend can say (for pre-recording). */
export function friendLines(p: Place, f: Fam): string[] {
  const out = new Set<string>([placeWelcome(p, f)])
  for (const a of p.activities) {
    out.add(fill(a.fact, f))
    out.add(fill(a.ask, f))
    if (a.hint) out.add(fill(a.hint, f))
    out.add(fill(a.cheer, f))
    for (const little of [true, false]) for (const n of [1, 2]) out.add(missLine(a, f, n, little))
    out.add(effortLine(a, f))
  }
  return [...out]
}
