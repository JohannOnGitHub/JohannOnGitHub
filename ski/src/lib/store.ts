// App state, kept in localStorage. Every record has an id and a change time, and
// deletions are tombstones, so two devices can merge their copies (see sync.ts).
import { useSyncExternalStore } from 'react'
import { seedClothing, seedGear, seedProfile } from '../data/templates'
import { ARTIFACT, getDb, type DB } from './artifactDb'
import { setCustomResorts } from '../data/resorts'
import type { Rec, State } from './types'

const KEY = 'skibase:v1'
export type Collection = 'profile' | 'resorts' | 'gear' | 'clothing' | 'days' | 'trips'

function seed(): State {
  return {
    v: 1,
    home: 'Stockholm',
    profile: [seedProfile()],
    resorts: [],
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

/** Feet were stored in cm before; they are mm now. */
function migrate(s: State): State {
  return { ...s, profile: s.profile.map((p) => ({ ...p, footLength: p.footLength && p.footLength < 60 ? p.footLength * 10 : p.footLength, footWidth: p.footWidth && p.footWidth < 30 ? p.footWidth * 10 : p.footWidth })) }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as State
      if (s && s.v === 1) return migrate({ ...seed(), ...s })
    }
  } catch {
    /* fall through to a fresh state */
  }
  return seed()
}

let state: State = ARTIFACT ? { v: 1, home: 'Stockholm', profile: [], resorts: [], gear: [], clothing: [], days: [], trips: [] } : load()
setCustomResorts(state.resorts ?? [])
const listeners = new Set<() => void>()
let changeHook: ((s: State) => void) | null = null

function commit(next: State, fromSync = false) {
  if (next.resorts !== state.resorts) setCustomResorts(next.resorts ?? [])
  state = next
  if (ARTIFACT) {
    listeners.forEach((l) => l())
    return
  }
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
  if (ARTIFACT) queueWrite(c, stamped)
  const i = list.findIndex((x) => x.id === item.id)
  const next = i >= 0 ? list.map((x, j) => (j === i ? stamped : x)) : [...list, stamped]
  commit({ ...state, [c]: next })
}

export function remove(c: Collection, id: string) {
  const list = state[c] as Rec[]
  if (ARTIFACT) {
    pending.delete(`${c}/${id}`) // an unsent edit must not bring the item back
    void db?.collection(c).doc(id).delete().catch(() => setBackend({ state: 'error', message: 'Could not delete. Check your connection.' }))
    commit({ ...state, [c]: list.filter((x) => x.id !== id) })
    return
  }
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
  return { ...a, home: a.home || b.home, profile: m(a.profile, b.profile), resorts: m(a.resorts, b.resorts), gear: m(a.gear, b.gear), clothing: m(a.clothing, b.clothing), days: m(a.days, b.days), trips: m(a.trips, b.trips) }
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

// ---------------- Artifact database backend ----------------

export type Backend = { state: 'local' | 'loading' | 'ready' | 'offline' | 'error'; message?: string }
let backend: Backend = { state: ARTIFACT ? 'loading' : 'local' }
const backendListeners = new Set<() => void>()
function setBackend(b: Backend) {
  backend = b
  backendListeners.forEach((l) => l())
}
export function useBackend() {
  return useSyncExternalStore(
    (l) => {
      backendListeners.add(l)
      return () => backendListeners.delete(l)
    },
    () => backend,
  )
}

let db: DB | null = null
// Typing in a text field changes a record on every key press: write each record
// at most once per pause, one write at a time.
const pending = new Map<string, { c: Collection; rec: Rec }>()
let flushTimer: ReturnType<typeof setTimeout> | undefined
let flushing = false
function queueWrite(c: Collection, rec: Rec) {
  pending.set(`${c}/${rec.id}`, { c, rec })
  clearTimeout(flushTimer)
  flushTimer = setTimeout(() => void flush(), 700)
}
async function flush() {
  if (flushing || !db) return
  flushing = true
  try {
    while (pending.size) {
      const [key, { c, rec }] = pending.entries().next().value!
      pending.delete(key)
      const { id, ...body } = rec as Rec & Record<string, unknown>
      try {
        await db.collection(c).doc(id).set(JSON.parse(JSON.stringify(body)))
      } catch (e) {
        const code = (e as { code?: string }).code
        setBackend({ state: 'error', message: code === 'not_granted' || code === 'permission_denied' ? 'You can view this page but not change it.' : 'A change was not saved. Check your connection.' })
      }
    }
  } finally {
    flushing = false
  }
}

async function startArtifact() {
  db = await getDb()
  if (!db) {
    setBackend({ state: 'offline', message: 'Your data is not reachable in this view. Open the page on claude.ai while signed in.' })
    return
  }
  const timer = setTimeout(() => {
    if (backend.state === 'loading') setBackend({ state: 'offline', message: 'Your data can\'t be reached yet. It may be missing or out of date.' })
  }, 10000)
  for (const c of ['profile', 'resorts', 'gear', 'clothing', 'days', 'trips'] as Collection[]) {
    db.collection(c).onSnapshot(
      (snap) => {
        const rows = snap.docs.map((d) => ({ ...(d.data() as object), id: d.id })) as Rec[]
        // Keep local edits that have not been written yet.
        const mine = [...pending.values()].filter((p) => p.c === c).map((p) => p.rec)
        const merged = new Map(rows.map((r) => [r.id, r]))
        for (const r of mine) merged.set(r.id, r)
        commit({ ...state, [c]: [...merged.values()] })
        if (!snap.metadata.fromCache) {
          clearTimeout(timer)
          if (backend.state !== 'error') setBackend({ state: 'ready' })
        }
      },
      () => {
        clearTimeout(timer)
        setBackend({ state: 'error', message: 'Syncing stopped. Reload the page to reconnect.' })
      },
    )
  }
}
if (ARTIFACT) void startArtifact()
