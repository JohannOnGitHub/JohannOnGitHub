// Each day of a trip has a kind: a ski day, a travel day, a rest day, or "off"
// (taken out of your ski days). The trip's dates never change when you do this.
import { upsert } from './store'
import type { DayKind, Trip } from './types'

export const DAY_KIND: Record<DayKind, string> = { ski: 'Ski day', travel: 'Travel day', rest: 'Rest day', off: 'Not a ski day' }

export function tripDays(t: Trip): { date: string; kind: DayKind }[] {
  const out: { date: string; kind: DayKind }[] = []
  for (let d = new Date(t.start + 'T12:00:00'); d <= new Date(t.end + 'T12:00:00'); d.setDate(d.getDate() + 1)) {
    const date = d.toISOString().slice(0, 10)
    out.push({ date, kind: t.dayTypes?.[date] ?? 'ski' })
  }
  return out
}

export const skiDayCount = (t: Trip) => tripDays(t).filter((d) => d.kind === 'ski').length

export function setDayKind(t: Trip, date: string, kind: DayKind) {
  const dayTypes = { ...(t.dayTypes ?? {}) }
  if (kind === 'ski') delete dayTypes[date]
  else dayTypes[date] = kind
  upsert('trips', { ...t, dayTypes })
}
