// App state, kept in localStorage. Every record has an id and a change time, and
// deletions are tombstones, so two devices can merge their copies (see sync.ts).
import { useSyncExternalStore } from 'react'
import { seedClothing, seedGear } from '../data/templates'
import type { Rec, State } from './types'

const KEY = 'skibase:v1'
export type Collection = 'gear' | 'clothing' | 'days' | 'trips'

function seed(): State {
  return {
    v: 1,
    home: 'Stockholm',
    gear: seedGear(),
    clothing: seedClothing(),
    days: [],
    trips: [
      {
        id: 'trip-adh-2027', updatedAt: 1, name: 'Alpe d\'Huez, February', resortId: 'alpedhuez', place: 'Alpe d\'Huez',
        start: '2027-02-17', end: '2027-02-21', types: ['freeride', 'park', 'piste'], travelChoice: '', plan: '', checklist: {},
      },
    ],
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as State
      if (s && s.v === 1) return { ...seed(), ...s }
    }
  } catch {
    /* fall through to a fresh state */
  }
  return seed()
}

let state: State = load()
const listeners = new Set<() => void>()
let changeHook: ((s: State) => void) | null = null

function commit(next: State, fromSync = false) {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* storage full or blocked: keep going in memory */
  }
  listeners.forEach((l) => l())
  if (!fromSync) changeHook?.(state)
}

export const getState = () => state
export function replaceState(s: State, fromSync = false) {
  commit(s, fromSync)
}
export function setChangeHook(fn: (s: State) => void) {
  changeHook = fn
}

export function useStore<T>(pick: (s: State) => T): T {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => pick(state),
  )
}

export const newId = (p: string) => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

export function upsert<C extends Collection>(c: C, item: State[C][number]) {
  const list = state[c] as Rec[]
  const stamped = { ...item, updatedAt: Date.now() }
  const i = list.findIndex((x) => x.id === item.id)
  const next = i >= 0 ? list.map((x, j) => (j === i ? stamped : x)) : [...list, stamped]
  commit({ ...state, [c]: next })
}

export function remove(c: Collection, id: string) {
  const list = state[c] as Rec[]
  commit({ ...state, [c]: list.map((x) => (x.id === id ? { ...x, deleted: true, updatedAt: Date.now() } : x)) })
}

export const live = <T extends Rec>(list: T[]) => list.filter((x) => !x.deleted)

/** Merge two copies: for each record keep the most recently changed one. */
export function merge(a: State, b: State): State {
  const m = <T extends Rec>(x: T[] = [], y: T[] = []) => {
    const by = new Map(x.map((r) => [r.id, r]))
    for (const r of y) {
      const cur = by.get(r.id)
      if (!cur || r.updatedAt > cur.updatedAt) by.set(r.id, r)
    }
    return [...by.values()]
  }
  return { ...a, home: a.home || b.home, gear: m(a.gear, b.gear), clothing: m(a.clothing, b.clothing), days: m(a.days, b.days), trips: m(a.trips, b.trips) }
}

export function exportJson() {
  return JSON.stringify(state, null, 2)
}
export function importJson(text: string): boolean {
  try {
    const s = JSON.parse(text) as State
    if (!s || s.v !== 1 || !Array.isArray(s.days)) return false
    commit(merge(state, s))
    return true
  } catch {
    return false
  }
}
