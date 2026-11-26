// Optional sync between devices: devices that share the same secret sync code
// share the data, through two Supabase functions (see supabase/migrations).
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { getState, merge, replaceState, setChangeHook } from './store'
import type { State } from './types'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined
const supabase: SupabaseClient | null =
  url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null
export const syncAvailable = !!supabase

const CODE_KEY = 'skibase:sync-code'
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

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
  return () => {
    listeners.delete(fn)
  }
}

function readCode() {
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

export function normalizeCode(input: string) {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/O/g, '0').replace(/I/g, '1')
  return raw.match(/.{1,4}/g)?.join('-') ?? ''
}
function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => ALPHABET[b % 32]).join('').match(/.{4}/g)!.join('-')
}

async function pull() {
  if (!supabase || !status.code) return false
  const { data, error } = await supabase.rpc('skibase_get', { sync_code: status.code })
  if (error) {
    set({ state: 'error', message: error.message })
    return false
  }
  if (data) replaceState(merge(getState(), data as State), true)
  return true
}
async function push() {
  if (!supabase || !status.code) return
  set({ state: 'syncing' })
  const { error } = await supabase.rpc('skibase_save', { sync_code: status.code, payload: getState() })
  if (error) set({ state: 'error', message: error.message })
  else set({ state: 'ok', lastSync: Date.now(), message: undefined })
}

let timer: ReturnType<typeof setTimeout> | undefined
setChangeHook(() => {
  if (!status.code) return
  clearTimeout(timer)
  timer = setTimeout(() => void push(), 1500)
})

export async function syncNow() {
  if (!status.code) return
  set({ state: 'syncing' })
  if (await pull()) await push()
}
export async function startSync(code?: string) {
  const c = code ? normalizeCode(code) : newCode()
  if (c.replace(/-/g, '').length < 16) {
    set({ state: 'error', message: 'A sync code has 16 letters and digits.' })
    return
  }
  writeCode(c)
  set({ code: c })
  await syncNow()
}
export function stopSync() {
  writeCode(null)
  set({ code: null, state: 'off', lastSync: null })
}

if (status.code) void syncNow()
