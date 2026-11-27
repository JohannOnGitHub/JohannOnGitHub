import { useEffect, useState } from 'react'
import type { Danger as D } from '../lib/conditions'
import { DANGER_NAME } from '../lib/conditions'
import type { SkiType, SnowType, Status, Visibility } from '../lib/types'

export const STATUS: Record<Status, string> = {
  have: 'Have', missing: 'Missing', upgrade: 'Replace', na: 'Not needed', unknown: 'Not checked',
}
export const SKI_TYPE: Record<SkiType, string> = { piste: 'Piste', freeride: 'Freeride', park: 'Park', touring: 'Touring' }
export const TYPE_COLOR: Record<SkiType, string> = { piste: 'var(--piste)', freeride: 'var(--free)', park: 'var(--park)', touring: 'var(--tour)' }
export const SNOW: Record<SnowType, string> = { powder: 'Powder', packed: 'Packed', crud: 'Crud', ice: 'Ice', corn: 'Spring corn', slush: 'Slush', artificial: 'Machine-made' }
export const VIS: Record<Visibility, string> = { bluebird: 'Bluebird', mixed: 'Mixed', flat: 'Flat light', storm: 'Storm' }

export function StatusSelect({ value, onChange, id }: { value: Status; onChange: (s: Status) => void; id: string }) {
  return (
    <select id={id} aria-label="Status" className={`status-select st-${value}`} value={value} onChange={(e) => onChange(e.target.value as Status)}>
      {(Object.keys(STATUS) as Status[]).map((s) => (
        <option key={s} value={s}>{STATUS[s]}</option>
      ))}
    </select>
  )
}

export function Chips<T extends string>({ options, value, onToggle, label }: { options: Record<T, string>; value: T[]; onToggle: (t: T) => void; label: string }) {
  return (
    <div className="chips" role="group" aria-label={label}>
      {(Object.keys(options) as T[]).map((t) => (
        <button type="button" key={t} className="chip" aria-pressed={value.includes(t)} onClick={() => onToggle(t)}>{options[t]}</button>
      ))}
    </div>
  )
}

export function Seg<T extends string>({ options, value, onChange, label }: { options: Record<T, string>; value: T; onChange: (t: T) => void; label: string }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {(Object.keys(options) as T[]).map((t) => (
        <button type="button" key={t} aria-pressed={value === t} onClick={() => onChange(t)}>{options[t]}</button>
      ))}
    </div>
  )
}

export function DangerBadge({ level, high, split }: { level: D; high?: D; split?: string }) {
  return (
    <span className="danger">
      <i className={`d${level}`}>{level || '–'}</i>
      {high ? (
        <>
          <span>→</span>
          <i className={`d${high}`}>{high}</i>
          <span>{DANGER_NAME[level]} below {split}, {DANGER_NAME[high].toLowerCase()} above</span>
        </>
      ) : (
        <span>{DANGER_NAME[level]}</span>
      )}
    </span>
  )
}

/** Runs an async loader when `key` changes. */
export function useAsync<T>(key: string | null, load: () => Promise<T>) {
  const [res, setRes] = useState<{ key: string | null; data?: T; error?: string }>({ key: null })
  useEffect(() => {
    if (!key) return
    let alive = true
    load().then(
      (data) => alive && setRes({ key, data }),
      (e: unknown) => alive && setRes({ key, error: e instanceof Error ? e.message : String(e) }),
    )
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  const current = res.key === key
  return { data: current ? res.data : undefined, error: current ? res.error : undefined, loading: !!key && !current }
}

export function fmtDate(d: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-GB', opts)
}
export const today = () => new Date().toISOString().slice(0, 10)
export function daysBetween(a: string, b: string) {
  return Math.round((new Date(b + 'T12:00:00').getTime() - new Date(a + 'T12:00:00').getTime()) / 864e5)
}

let toastFn: ((s: string) => void) | null = null
export function toast(s: string) {
  toastFn?.(s)
}
export function Toaster() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    toastFn = (s) => {
      setMsg(s)
      clearTimeout(t)
      t = setTimeout(() => setMsg(null), 2400)
    }
    return () => {
      toastFn = null
    }
  }, [])
  return msg ? <div className="toast" role="status">{msg}</div> : null
}
