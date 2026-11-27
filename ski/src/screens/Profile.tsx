import { useMemo, useState } from 'react'
import { Chips, fmtDate, SKI_TYPE, toast, today, useAsync } from '../components/ui'
import { FLAG, resortById } from '../data/resorts'
import { ResortPicker } from './AddResort'
import { RecordsSection } from './Records'
import { DANGER_NAME, avalanche, forecast, verdict, weatherLabel } from '../lib/conditions'
import { live, upsert, useStore } from '../lib/store'
import type { DayKind, Profile, Trip } from '../lib/types'
import { DAY_KIND, setDayKind, tripDays } from '../lib/tripDays'
import { InjuriesSection } from './Injuries'

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Pro / instructor']

/** Boot fit hint from foot length and width in mm. */
function feetText(l: number | null, w: number | null) {
  if (!l || !w) return l ? `${l} mm long` : '–'
  const mondo = (l / 10).toFixed(1)
  const ratio = w / l
  const fit = ratio >= 0.38 ? 'wide: look for a 102 mm+ last' : ratio >= 0.37 ? 'medium-wide: 100–102 mm last' : 'narrow to medium: 98–100 mm last'
  return `${l} × ${w} mm · Mondopoint ${mondo} · ${fit}`
}

export function ProfileCard() {
  const all = useStore((s) => s.profile)
  useStore((s) => s.resorts)
  const p = useMemo(() => live(all)[0], [all])
  const [edit, setEdit] = useState(false)
  if (!p) return null
  const set = (x: Partial<Profile>) => upsert('profile', { ...p, ...x })
  return (
    <section className="panel">
      <div className="between">
        <h2>Ski profile</h2>
        <button type="button" className="link" onClick={() => setEdit(!edit)} aria-expanded={edit}>{edit ? 'Done' : 'Edit'}</button>
      </div>
      {!edit ? (
        <div className="grid2" style={{ gap: 12 }}>
          <dl className="phones" style={{ margin: 0 }}>
            <dt className="muted small">Level</dt><dd style={{ margin: 0 }}>{p.level}</dd>
            <dt className="muted small">Skis</dt><dd style={{ margin: 0 }}>{p.styles.map((s) => SKI_TYPE[s]).join(', ')}</dd>
            <dt className="muted small">Loves</dt><dd style={{ margin: 0 }}>{p.focus}</dd>
            <dt className="muted small">Home</dt><dd style={{ margin: 0 }}>{p.home}</dd>
            <dt className="muted small">Feet</dt>
            <dd style={{ margin: 0 }}>{feetText(p.footLength, p.footWidth)}</dd>
          </dl>
          <div className="stack" style={{ gap: 6 }}>
            <span className="label">Home resorts</span>
            <div className="chips">{p.favourites.map((id) => { const r = resortById(id); return r ? <span key={id} className="tag">{FLAG[r.country]} {r.name}</span> : null })}</div>
            {p.notes && <p className="small">{p.notes}</p>}
          </div>
        </div>
      ) : (
        <div className="stack">
          <div className="fields">
            <div className="field"><label className="label" htmlFor="p-level">Level</label>
              <select id="p-level" value={LEVELS.includes(p.level) ? p.level : 'Expert'} onChange={(e) => set({ level: e.target.value })}>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="field"><label className="label" htmlFor="p-home">Home</label><input id="p-home" value={p.home} onChange={(e) => set({ home: e.target.value })} /></div>
            <div className="field"><label className="label" htmlFor="p-fl">Foot length (mm)</label><input id="p-fl" type="number" inputMode="numeric" step="1" min="150" max="350" value={p.footLength ?? ''} onChange={(e) => set({ footLength: e.target.value ? Math.round(Number(e.target.value)) : null })} /></div>
            <div className="field"><label className="label" htmlFor="p-fw">Foot width (mm)</label><input id="p-fw" type="number" inputMode="numeric" step="1" min="60" max="140" value={p.footWidth ?? ''} onChange={(e) => set({ footWidth: e.target.value ? Math.round(Number(e.target.value)) : null })} /></div>
          </div>
          <div className="field"><span className="label">Kinds of skiing</span><Chips label="Kinds of skiing" options={SKI_TYPE} value={p.styles} onToggle={(t) => set({ styles: p.styles.includes(t) ? p.styles.filter((x) => x !== t) : [...p.styles, t] })} /></div>
          <div className="field"><label className="label" htmlFor="p-focus">What you love most</label><input id="p-focus" value={p.focus} onChange={(e) => set({ focus: e.target.value })} /></div>
          <div className="field"><span className="label">Home resorts</span>
            <div className="chips">
              {p.favourites.map((id) => {
                const r = resortById(id)
                return r ? (
                  <span key={id} className="tag chip-x">{FLAG[r.country]} {r.name}
                    <button type="button" aria-label={`Remove ${r.name}`} onClick={() => set({ favourites: p.favourites.filter((x) => x !== id) })}>×</button>
                  </span>
                ) : null
              })}
            </div>
            <ResortPicker label="Add a home resort" selected={p.favourites} onPick={(id) => set({ favourites: [...p.favourites, id] })} />
          </div>
          <div className="field"><label className="label" htmlFor="p-notes">Notes</label><textarea id="p-notes" value={p.notes} onChange={(e) => set({ notes: e.target.value })} /></div>
        </div>
      )}
      <RecordsSection p={p} />
      <InjuriesSection p={p} />
    </section>
  )
}

/** Every upcoming trip day, with the forecast and avalanche level once they are available. */
export function UpcomingDays({ trips, go }: { trips: Trip[]; go: (h: string) => void }) {
  const now = today()
  const days = trips
    .flatMap((t) => tripDays(t).map((d) => ({ ...d, t })))
    .filter((x) => x.date >= now && x.kind !== 'off')
    .slice(0, 16)
  const resortIds = [...new Set(days.map((d) => d.t.resortId).filter(Boolean))] as string[]
  if (!days.length) return <div className="empty"><h3>No ski days planned</h3><p>Plan a trip on the Trips page; every day shows up here with its forecast.</p></div>
  return (
    <div className="panel" style={{ gap: 0 }}>
      {resortIds.map((id) => <ResortDays key={id} id={id} days={days.filter((d) => d.t.resortId === id)} go={go} />)}
      <p className="note" style={{ marginTop: 8 }}>Mark a day as travel or rest, or remove it with ×. The trip itself stays as it is; removed days can be brought back on the trip page.</p>
    </div>
  )
}

function ResortDays({ id, days, go }: { id: string; days: { date: string; kind: DayKind; t: Trip }[]; go: (h: string) => void }) {
  const r = resortById(id)!
  const fc = useAsync(`fc:${id}`, () => forecast(r))
  const ava = useAsync(r.avalanche.kind === 'link' ? null : `ava:${id}`, () => avalanche(r))
  return (
    <div className="list">
      {days.map(({ date, kind, t }) => {
        const f = fc.data?.days.find((d) => d.date === date)
        const a = ava.data?.days.find((d) => d.date === date)
        const v = f && verdict(f)
        return (
          <div key={date + t.id} className={`item day-row k-${kind}`}>
            <button type="button" className="day-link" onClick={() => go(`trip-${t.id}`)}>
              <span className="name">
                {fmtDate(date, { weekday: 'long', day: 'numeric', month: 'short' })} · {FLAG[r.country]} {r.name}
                {kind !== 'ski' && <span className={`kind kind-${kind}`}>{DAY_KIND[kind]}</span>}
              </span>
              <span className="sub" style={{ display: 'block' }}>
                {f ? <>{weatherLabel(f.code).icon} {kind === 'ski' && <><span className={`tone-${v!.tone}`}>{v!.label}</span> · </>}❄ {Math.round(f.snowTop)} cm · {Math.round(f.tMinTop)}/{Math.round(f.tMaxTop)}° at the top · wind {Math.round(f.windTop)} km/h</>
                  : fc.loading ? 'Loading forecast…' : 'Forecast appears about 15 days before'}
                {a && kind === 'ski' && ` · Avalanche ${a.levelHigh ?? a.level} (${DANGER_NAME[a.levelHigh ?? a.level].toLowerCase()})`}
                {' · '}{t.name}
              </span>
            </button>
            <span className="controls">
              <select id={`dk-${t.id}-${date}`} aria-label={`Type of day, ${date}`} className="status-select" value={kind} onChange={(e) => setDayKind(t, date, e.target.value as DayKind)}>
                <option value="ski">Ski</option><option value="travel">Travel</option><option value="rest">Rest</option>
              </select>
              <button type="button" className="icon-x" aria-label={`Remove ${fmtDate(date)} from your ski days`} title="Not a ski day"
                onClick={() => { setDayKind(t, date, 'off'); toast(`${fmtDate(date)} removed from your ski days. The trip is unchanged.`) }}>×</button>
            </span>
          </div>
        )
      })}
    </div>
  )
}
