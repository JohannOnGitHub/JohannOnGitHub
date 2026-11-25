// Optional cloud backup with Supabase: a parent signs in with an email code,
// and the family's progress is saved so it follows them across devices.
import { createClient, type SupabaseClient, type Session } from '@supabase/supabase-js'
import { getState, replaceState, setChangeHook, type State } from './store'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as
  | string
  | undefined

export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null
export const syncAvailable = !!supabase

let session: Session | null = null
let pushTimer: ReturnType<typeof setTimeout> | undefined
const listeners = new Set<(s: Session | null) => void>()

export function onSession(fn: (s: Session | null) => void) {
  listeners.add(fn)
  fn(session)
  return () => listeners.delete(fn)
}

export async function initSync() {
  if (!supabase) return
  const { data } = await supabase.auth.getSession()
  session = data.session
  listeners.forEach((l) => l(session))
  supabase.auth.onAuthStateChange((_e, s) => {
    const was = session?.user.id
    session = s
    listeners.forEach((l) => l(session))
    if (s && s.user.id !== was) void pull()
  })
  if (session) await pull()
  setChangeHook(() => {
    if (!session) return
    clearTimeout(pushTimer)
    pushTimer = setTimeout(() => void push(), 1500)
  })
}

export async function sendCode(email: string) {
  if (!supabase) throw new Error('Sync not configured')
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } })
  if (error) throw error
}

export async function verifyCode(email: string, token: string) {
  if (!supabase) throw new Error('Sync not configured')
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
  if (error) throw error
}

export async function signOut() {
  await supabase?.auth.signOut()
}

/** Merge local + cloud: for each kid keep the most recently updated copy. */
function merge(local: State, remote: State): State {
  const byId = new Map(local.kids.map((k) => [k.id, k]))
  for (const rk of remote.kids) {
    const lk = byId.get(rk.id)
    if (!lk || rk.updatedAt > lk.updatedAt) byId.set(rk.id, rk)
  }
  return { ...local, family: { ...remote.family, ...local.family }, kids: [...byId.values()] }
}

async function pull() {
  if (!supabase || !session) return
  const { data, error } = await supabase
    .from('marmotte_families')
    .select('data')
    .eq('user_id', session.user.id)
    .maybeSingle()
  if (error) return console.warn('sync pull failed', error.message)
  if (data?.data) replaceState(merge(getState(), data.data as State), true)
  await push()
}

async function push() {
  if (!supabase || !session) return
  const { currentKid: _c, ...rest } = getState()
  void _c
  const { error } = await supabase
    .from('marmotte_families')
    .upsert({ user_id: session.user.id, data: { ...rest, currentKid: null }, updated_at: new Date().toISOString() })
  if (error) console.warn('sync push failed', error.message)
}
