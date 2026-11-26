// Family sync: phones that share the same secret family code share the
// children's progress, through Supabase (two RPC functions, see
// supabase/migrations/20261126000000_marmotte_family_sync.sql).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getState, replaceState, setChangeHook, type State } from './store'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null
export const syncAvailable = !!supabase

const CODE_KEY = 'marmotte:family-code'
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no I, O, 0, 1

export type SyncStatus = { code: string | null; state: 'off' | 'syncing' | 'ok' | 'error'; lastSync: number | null; message?: string }
let status: SyncStatus = { code: readCode(), state: 'off', lastSync: null }
const listeners = new Set<(s: SyncStatus) => void>()
function set(p: Partial<SyncStatus>) {
  status = { ...status, ...p }
  listeners.forEach((l) => l(status))
}
export function onSync(fn: (s: SyncStatus) => void) {
  listeners.add(fn)
  fn(status)
  return () => listeners.delete(fn)
}

function readCode(): string | null {
  try {
    return localStorage.getItem(CODE_KEY)
  } catch {
    return null
  }
}
function writeCode(c: string | null) {
  try {
    if (c) localStorage.setItem(CODE_KEY, c)
    else localStorage.removeItem(CODE_KEY)
  } catch {
    /* ignore */
  }
}

/** Normalises what a parent types: « k7px m3qd… » → « K7PX-M3QD-… ». */
export function normalizeCode(input: string): string {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g, '0').replace(/I/g, '1')
  return raw.match(/.{1,4}/g)?.join('-') ?? ''
}

function newCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  const chars = Array.from(bytes, (b) => ALPHABET[b % 32]).join('') // 16 chars × 5 bits = 80 bits
  return chars.match(/.{4}/g)!.join('-')
}

/** Merge local + cloud: for each child keep the most recently updated copy. */
function merge(local: State, remote: State): State {
  const byId = new Map(local.kids.map((k) => [k.id, k]))
  for (const rk of remote.kids ?? []) {
    const lk = byId.get(rk.id)
    if (!lk || rk.updatedAt > lk.updatedAt) byId.set(rk.id, rk)
  }
  // A brand-new phone takes the family's settings; otherwise this phone's settings win.
  const family = local.kids.length ? { ...remote.family, ...local.family } : { ...local.family, ...remote.family }
  return { ...local, family, kids: [...byId.values()] }
}

async function pull(): Promise<boolean> {
  if (!supabase || !status.code) return false
  const { data, error } = await supabase.rpc('marmotte_get', { family_code: status.code })
  if (error) {
    set({ state: 'error', message: error.message })
    return false
  }
  if (data) replaceState(merge(getState(), data as State), true)
  return true
}

async function push(): Promise<boolean> {
  if (!supabase || !status.code) return false
  const { currentKid: _c, ...rest } = getState()
  void _c
  const { error } = await supabase.rpc('marmotte_save', { family_code: status.code, payload: { ...rest, currentKid: null } })
  if (error) {
    set({ state: 'error', message: error.message })
    return false
  }
  return true
}

let busy: Promise<void> | null = null
/** Fetch the family's progress, merge it, and save the merged result. */
export function syncNow(): Promise<void> {
  if (!supabase || !status.code) return Promise.resolve()
  if (busy) return busy
  busy = (async () => {
    set({ state: 'syncing', message: undefined })
    const ok = (await pull()) && (await push())
    if (ok) set({ state: 'ok', lastSync: Date.now() })
    busy = null
  })()
  return busy
}

let pushTimer: ReturnType<typeof setTimeout> | undefined
export function initSync() {
  if (!supabase) return
  setChangeHook(() => {
    if (!status.code) return
    clearTimeout(pushTimer)
    pushTimer = setTimeout(() => void push().then((ok) => ok && set({ state: 'ok', lastSync: Date.now() })), 1500)
  })
  // Catch up whenever the app comes back to the screen.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void syncNow()
  })
  if (status.code) void syncNow()
}

/** First phone: create a family code and upload this phone's progress. */
export async function createFamily(): Promise<string> {
  const code = newCode()
  writeCode(code)
  set({ code })
  await syncNow()
  return code
}

/** Other phones: join with the code shown on the first phone. */
export async function joinFamily(input: string): Promise<{ ok: boolean; message?: string }> {
  if (!supabase) return { ok: false, message: 'Sauvegarde non configurée' }
  const code = normalizeCode(input)
  if (code.replace(/-/g, '').length !== 16) return { ok: false, message: 'Le code doit avoir 16 caractères (ex. K7PX-M3QD-T9WB-2FHR).' }
  const { data, error } = await supabase.rpc('marmotte_get', { family_code: code })
  if (error) return { ok: false, message: error.message }
  if (!data) return { ok: false, message: 'Code inconnu. Vérifiez-le sur l’autre téléphone.' }
  writeCode(code)
  set({ code })
  await syncNow()
  return { ok: true }
}

export function leaveFamily() {
  writeCode(null)
  set({ code: null, state: 'off', lastSync: null })
}
