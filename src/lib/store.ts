import { useSyncExternalStore } from 'react'
import { ACHIEVEMENTS, ALL_ACTIVITIES, PLACES, type BuddyId, type PlaceId } from '../data/content'

export type Kid = {
  id: string
  name: string
  age: number
  buddy: BuddyId
  stars: number
  done: string[] // activity ids completed
  firstTry: number
  achievements: string[]
  visited: PlaceId[]
  outfit: Record<string, string | undefined> // slot -> wearable id
  updatedAt: number
  /** How the name is said, e.g. « Matisse » for Mathis. */
  spoken?: string
}

export type Family = {
  parent: string // what the kids call the parent using the app (Papa / Maman)
  mamie: string // grandparent from Marseille
  papi: string // grandparent from Rennes
  unlockAll: boolean
  /** ElevenLabs voices picked in the parents' corner, per role. */
  voices?: Partial<Record<string, { id: string; name: string }>>
}

export type State = { kids: Kid[]; family: Family; currentKid: string | null }

const KEY = 'marmotte:v1'

const defaultState: State = {
  kids: [],
  family: { parent: 'Papa', mamie: 'Chacha', papi: 'Papy', unlockAll: false },
  currentKid: null,
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as State
      return { ...defaultState, ...s, family: { ...defaultState.family, ...s.family } }
    }
  } catch {
    /* storage unavailable */
  }
  return defaultState
}

let state: State = load()
const listeners = new Set<() => void>()

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l())
  onChange?.(state)
}

let onChange: ((s: State) => void) | null = null
export function setChangeHook(fn: (s: State) => void) {
  onChange = fn
}

export function useStore(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

export const getState = () => state

export function replaceState(next: State, silent = false) {
  state = next
  if (silent) {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l())
  } else save()
}

export function setFamily(f: Partial<Family>) {
  state = { ...state, family: { ...state.family, ...f } }
  save()
}

export function addKid(name: string, age: number, buddy: BuddyId): Kid {
  const kid: Kid = {
    id: crypto.randomUUID(),
    name,
    age,
    buddy,
    stars: 0,
    done: [],
    firstTry: 0,
    achievements: [],
    visited: [],
    outfit: {},
    updatedAt: Date.now(),
  }
  state = { ...state, kids: [...state.kids, kid], currentKid: kid.id }
  save()
  return kid
}

export function updateKid(id: string, patch: Partial<Kid> | ((k: Kid) => Partial<Kid>)) {
  state = {
    ...state,
    kids: state.kids.map((k) =>
      k.id === id ? { ...k, ...(typeof patch === 'function' ? patch(k) : patch), updatedAt: Date.now() } : k,
    ),
  }
  save()
}

export function removeKid(id: string) {
  state = { ...state, kids: state.kids.filter((k) => k.id !== id), currentKid: null }
  save()
}

export function selectKid(id: string | null) {
  state = { ...state, currentKid: id }
  save()
}

// ---------- Game rules ----------

export function placeProgress(kid: Kid, place: PlaceId) {
  const p = PLACES.find((x) => x.id === place)!
  const done = p.activities.filter((a) => kid.done.includes(a.id)).length
  return { done, total: p.activities.length, complete: done === p.activities.length }
}

/** A place opens once 3 activities are done in the previous one. */
export function isPlaceOpen(kid: Kid, idx: number, unlockAll: boolean) {
  if (unlockAll || idx === 0) return true
  return placeProgress(kid, PLACES[idx - 1].id).done >= 3
}

export function badgesOf(kid: Kid): PlaceId[] {
  return PLACES.filter((p) => placeProgress(kid, p.id).complete).map((p) => p.id)
}

/** Record a success; returns newly earned achievement ids. */
export function recordSuccess(kidId: string, activityId: string, firstTry: boolean): string[] {
  const kid = state.kids.find((k) => k.id === kidId)
  if (!kid) return []
  const already = kid.done.includes(activityId)
  const stars = kid.stars + (already ? 1 : firstTry ? 3 : 2)
  const done = already ? kid.done : [...kid.done, activityId]
  const ft = kid.firstTry + (firstTry ? 1 : 0)
  const next: Kid = { ...kid, stars, done, firstTry: ft }
  const newly = computeAchievements(next).filter((a) => !kid.achievements.includes(a))
  updateKid(kidId, { stars, done, firstTry: ft, achievements: [...kid.achievements, ...newly] })
  return newly
}

export function addStars(kidId: string, n: number) {
  updateKid(kidId, (k) => ({ stars: k.stars + n }))
}

export function markVisited(kidId: string, place: PlaceId): string[] {
  const kid = state.kids.find((k) => k.id === kidId)
  if (!kid || kid.visited.includes(place)) return []
  const next = { ...kid, visited: [...kid.visited, place] }
  const newly = computeAchievements(next).filter((a) => !kid.achievements.includes(a))
  updateKid(kidId, { visited: next.visited, achievements: [...kid.achievements, ...newly] })
  return newly
}

function computeAchievements(k: Kid): string[] {
  const got: string[] = []
  if (k.done.length >= 1) got.push('first')
  if (k.stars >= 5) got.push('five')
  if (k.stars >= 20) got.push('twenty')
  if (k.stars >= 50) got.push('fifty')
  if (k.firstTry >= 5) got.push('firsttry')
  const counts = ALL_ACTIVITIES.filter((a) => a.kind === 'count')
  if (counts.every((a) => k.done.includes(a.id))) got.push('counter')
  if (k.visited.length >= PLACES.length) got.push('traveler')
  if (ALL_ACTIVITIES.every((a) => k.done.includes(a.id))) got.push('all')
  return got.filter((id) => ACHIEVEMENTS.some((a) => a.id === id))
}

/** Replace {parent}, {mamie}, {papi} with the family's words. */
export function personalize(text: string, f: Family) {
  return text.replace(/\{parent\}/g, f.parent).replace(/\{mamie\}/g, f.mamie).replace(/\{papi\}/g, f.papi)
}
