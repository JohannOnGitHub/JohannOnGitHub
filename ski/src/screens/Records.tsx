import { useMemo, useState } from 'react'
import { fmtDate, toast } from '../components/ui'
import { resortById, RESORTS } from '../data/resorts'
import { live, newId, upsert, useStore } from '../lib/store'
import type { Profile, SkiDay } from '../lib/types'

type Milestone = { title: string; earned: boolean; detail: string }

/** Milestones worked out from the ski log. */
function milestones(days: SkiDay[]): Milestone[] {
  const resorts = new Set(days.map((d) => d.resortId ?? d.place).filter(Boolean))
  const countries = new Set(days.map((d) => resortById(d.resortId)?.country).filter(Boolean))
  const seasons = new Set(days.map((d) => { const y = Number(d.date.slice(0, 4)); return Number(d.date.slice(5, 7)) >= 7 ? y : y - 1 }))
  const n = (pred: (d: SkiDay) => boolean) => days.filter(pred).length
  const top = Math.max(0, ...days.map((d) => d.maxSpeed ?? 0))
  const tiers = (label: string, value: number, steps: number[], unit: string) =>
    steps.map((s) => ({ title: `${label}: ${s}${unit}`, earned: value >= s, detail: `${value}/${s}` }))
  return [
    ...tiers('Days on snow', days.length, [1, 10, 25, 50, 100], ''),
    ...tiers('Places skied', resorts.size, [5, 10, 20], ''),
    ...tiers('Countries', countries.size, [2, 4, 6], ''),
    ...tiers('Powder days', n((d) => d.snow === 'powder'), [1, 10, 25], ''),
    ...tiers('Park days', n((d) => d.types.includes('park')), [10, 25], ''),
    ...tiers('Freeride days', n((d) => d.types.includes('freeride')), [10, 25], ''),
    ...tiers('Touring days', n((d) => d.types.includes('touring')), [1, 10], ''),
    ...tiers('Seasons logged', seasons.size, [2, 5], ''),
    ...tiers('Top speed', Math.round(top), [80, 100, 120], ' km/h'),
    { title: 'Five-star day', earned: n((d) => d.rating === 5) > 0, detail: '' },
  ]
}

export function RecordsSection({ p }: { p: Profile }) {
  const daysAll = useStore((s) => s.days)
  const days = useMemo(() => live(daysAll), [daysAll])
  const [edit, setEdit] = useState(false)
  const set = (x: Partial<Profile>) => upsert('profile', { ...p, ...x })
  const speed = p.maxSpeed ?? { kmh: null, place: '', date: '' }
  const trick = p.bestTrick ?? { name: '', place: '', date: '' }
  const ach = p.achievements ?? []
  const fastestDay = days.reduce<SkiDay | null>((b, d) => ((d.maxSpeed ?? 0) > (b?.maxSpeed ?? 0) ? d : b), null)
  const ms = milestones(days)
  const earned = ms.filter((m) => m.earned)
  const seen = new Set<string>()
  const next = ms.filter((m) => {
    const group = m.title.split(':')[0]
    if (m.earned || seen.has(group)) return false
    seen.add(group)
    return true
  }).slice(0, 4)
  const where = (place: string, date: string) => [place, date && fmtDate(date, { day: 'numeric', month: 'short', year: 'numeric' })].filter(Boolean).join(', ')

  return (
    <div className="stack" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
      <div className="between"><h3>Records and achievements</h3><button type="button" className="link" onClick={() => setEdit(!edit)} aria-expanded={edit}>{edit ? 'Done' : 'Edit records'}</button></div>

      <div className="grid2" style={{ gap: 12 }}>
        <div className="record">
          <span className="label">Top speed</span>
          {edit ? (
            <div className="fields">
              <div className="field"><label className="label" htmlFor="rs-kmh">km/h</label><input id="rs-kmh" type="number" inputMode="decimal" value={speed.kmh ?? ''} onChange={(e) => set({ maxSpeed: { ...speed, kmh: e.target.value ? Number(e.target.value) : null } })} /></div>
              <div className="field"><label className="label" htmlFor="rs-place">Where</label><input id="rs-place" list="resort-names" value={speed.place} onChange={(e) => set({ maxSpeed: { ...speed, place: e.target.value } })} /></div>
              <div className="field"><label className="label" htmlFor="rs-date">When</label><input id="rs-date" type="date" value={speed.date} onChange={(e) => set({ maxSpeed: { ...speed, date: e.target.value } })} /></div>
            </div>
          ) : (
            <>
              <b className="big num">{speed.kmh != null ? `${speed.kmh} km/h` : '–'}</b>
              <span className="small muted">{speed.kmh != null ? where(speed.place, speed.date) || 'Add where and when' : 'Add it from your tracker app (Slopes, Strava…)'}</span>
            </>
          )}
          {fastestDay && fastestDay.maxSpeed != null && (speed.kmh == null || fastestDay.maxSpeed > speed.kmh) && (
            <span className="small">
              Fastest logged day: <b className="num">{fastestDay.maxSpeed} km/h</b> at {resortById(fastestDay.resortId)?.name ?? fastestDay.place}{' '}
              <button type="button" className="link" onClick={() => { set({ maxSpeed: { kmh: fastestDay.maxSpeed!, place: resortById(fastestDay.resortId)?.name ?? fastestDay.place, date: fastestDay.date } }); toast('Top speed updated') }}>Make it my record</button>
            </span>
          )}
        </div>

        <div className="record">
          <span className="label">Best trick</span>
          {edit ? (
            <div className="fields">
              <div className="field"><label className="label" htmlFor="rt-name">Trick</label><input id="rt-name" value={trick.name} onChange={(e) => set({ bestTrick: { ...trick, name: e.target.value } })} placeholder="e.g. Cork 720, 10 m cliff" /></div>
              <div className="field"><label className="label" htmlFor="rt-place">Where</label><input id="rt-place" list="resort-names" value={trick.place} onChange={(e) => set({ bestTrick: { ...trick, place: e.target.value } })} /></div>
              <div className="field"><label className="label" htmlFor="rt-date">When</label><input id="rt-date" type="date" value={trick.date} onChange={(e) => set({ bestTrick: { ...trick, date: e.target.value } })} /></div>
            </div>
          ) : (
            <>
              <b className="big">{trick.name || '–'}</b>
              <span className="small muted">{trick.name ? where(trick.place, trick.date) || 'Add where and when' : 'Your best jump, trick or cliff'}</span>
            </>
          )}
        </div>
      </div>
      <datalist id="resort-names">{RESORTS.map((r) => <option key={r.id} value={r.name} />)}</datalist>

      <div className="stack" style={{ gap: 6 }}>
        <span className="label">Achievements</span>
        {ach.length ? (
          <div className="list">
            {ach.map((a) => (
              <div key={a.id} className="item">
                {edit ? (
                  <div className="fields" style={{ gridColumn: '1 / -1' }}>
                    <div className="field"><label className="label" htmlFor={`a-t-${a.id}`}>Achievement</label><input id={`a-t-${a.id}`} value={a.title} onChange={(e) => set({ achievements: ach.map((x) => (x.id === a.id ? { ...x, title: e.target.value } : x)) })} /></div>
                    <div className="field"><label className="label" htmlFor={`a-d-${a.id}`}>When</label><input id={`a-d-${a.id}`} type="date" value={a.date} onChange={(e) => set({ achievements: ach.map((x) => (x.id === a.id ? { ...x, date: e.target.value } : x)) })} /></div>
                    <div className="field"><label className="label" htmlFor={`a-n-${a.id}`}>Note</label><input id={`a-n-${a.id}`} value={a.note} onChange={(e) => set({ achievements: ach.map((x) => (x.id === a.id ? { ...x, note: e.target.value } : x)) })} /></div>
                    <div className="field" style={{ alignSelf: 'end' }}><button type="button" className="danger" onClick={() => set({ achievements: ach.filter((x) => x.id !== a.id) })}>Remove</button></div>
                  </div>
                ) : (
                  <>
                    <div><div className="name">🏆 {a.title}</div>{a.note && <div className="sub">{a.note}</div>}</div>
                    <span className="small muted">{a.date ? fmtDate(a.date, { month: 'short', year: 'numeric' }) : ''}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : <p className="small muted">Your own milestones: first backflip, skied the Sarenne top to bottom, first 1 000 m vertical tour…</p>}
        <AddAchievement onAdd={(title) => set({ achievements: [...ach, { id: newId('a'), title, date: new Date().toISOString().slice(0, 10), note: '' }] })} />
      </div>

      <div className="stack" style={{ gap: 6 }}>
        <span className="label">From your log</span>
        <div className="chips">
          {earned.length ? earned.map((m) => <span key={m.title} className="tag badge">✓ {m.title}</span>) : <span className="small muted">Log days to earn milestones.</span>}
        </div>
        {next.length > 0 && <p className="small muted">Next: {next.map((m) => `${m.title}${m.detail ? ` (${m.detail})` : ''}`).join(' · ')}</p>}
      </div>
    </div>
  )
}

function AddAchievement({ onAdd }: { onAdd: (t: string) => void }) {
  const [t, setT] = useState('')
  return (
    <form className="row" onSubmit={(e) => { e.preventDefault(); if (!t.trim()) return; onAdd(t.trim()); setT(''); toast('Achievement added') }}>
      <input id="add-achievement" aria-label="New achievement" placeholder="Add an achievement" value={t} onChange={(e) => setT(e.target.value)} style={{ flex: '1 1 220px', width: 'auto' }} />
      <button type="submit">Add</button>
    </form>
  )
}
