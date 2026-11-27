import { useMemo, useState } from 'react'
import { Chips, fmtDate, SKI_TYPE, SNOW, toast, today, TYPE_COLOR, VIS } from '../components/ui'
import { resortById, RESORTS } from '../data/resorts'
import { live, newId, remove, upsert, useStore } from '../lib/store'
import { addPhoto, safeSrc, type Photo } from '../lib/photos'
import type { SkiDay, SkiType, SnowType, Visibility } from '../lib/types'

/** Ski seasons run July–June: 2026-12-03 is in "2026/27". */
export const seasonOf = (date: string) => {
  const y = Number(date.slice(0, 4))
  const s = Number(date.slice(5, 7)) >= 7 ? y : y - 1
  return `${s}/${String(s + 1).slice(2)}`
}
export const currentSeason = () => seasonOf(today())

const blank = (): Omit<SkiDay, 'id' | 'updatedAt'> => ({
  date: today(), resortId: null, place: '', types: [], snow: 'packed', visibility: 'mixed', newSnow: null, temp: null, rating: null, highlight: '', notes: '', photos: [],
})

export default function Log() {
  const all = useStore((s) => s.days)
  const days = useMemo(() => live(all).sort((a, b) => b.date.localeCompare(a.date)), [all])
  const seasons = useMemo(() => [...new Set([currentSeason(), ...days.map((d) => seasonOf(d.date))])].sort().reverse(), [days])
  const [season, setSeason] = useState(currentSeason())
  const [type, setType] = useState<SkiType | 'all'>('all')
  const [edit, setEdit] = useState<SkiDay | null>(null)

  const inSeason = days.filter((d) => season === 'all' || seasonOf(d.date) === season)
  const shown = inSeason.filter((d) => type === 'all' || d.types.includes(type))
  const places = new Set(inSeason.map((d) => d.resortId ?? d.place))
  const rated = inSeason.filter((d) => d.rating)

  return (
    <>
      <div className="head">
        <div>
          <div className="label">Days on snow</div>
          <h1>Ski log</h1>
          <p>Every day: where, what kind of skiing, and what the snow was like.</p>
        </div>
        <select id="season" aria-label="Season" value={season} onChange={(e) => setSeason(e.target.value)} style={{ width: 'auto' }}>
          {seasons.map((s) => <option key={s} value={s}>Season {s}</option>)}
          <option value="all">All seasons</option>
        </select>
      </div>

      <div className="stats">
        <div className="stat"><span className="label">Days</span><b className="num">{inSeason.length}</b></div>
        <div className="stat"><span className="label">Places</span><b className="num">{places.size}</b></div>
        <div className="stat"><span className="label">Powder days</span><b className="num">{inSeason.filter((d) => d.snow === 'powder').length}</b></div>
        <div className="stat"><span className="label">Avg rating</span><b className="num">{rated.length ? (rated.reduce((a, d) => a + (d.rating ?? 0), 0) / rated.length).toFixed(1) : '–'}</b></div>
        {(Object.keys(SKI_TYPE) as SkiType[]).map((t) => {
          const n = inSeason.filter((d) => d.types.includes(t)).length
          return n ? <div className="stat" key={t}><span className="label" style={{ color: TYPE_COLOR[t] }}>{SKI_TYPE[t]}</span><b className="num">{n}</b></div> : null
        })}
      </div>

      <div className="grid2" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <DayForm key={edit?.id ?? 'new'} initial={edit} onDone={() => setEdit(null)} />
        <section className="stack">
          <div className="between">
            <h2>Days</h2>
            <div className="chips" role="group" aria-label="Filter by type">
              <button type="button" className="chip" aria-pressed={type === 'all'} onClick={() => setType('all')}>All</button>
              {(Object.keys(SKI_TYPE) as SkiType[]).map((t) => <button type="button" key={t} className="chip" aria-pressed={type === t} onClick={() => setType(t)}>{SKI_TYPE[t]}</button>)}
            </div>
          </div>
          {shown.length ? shown.map((d) => <DayCard key={d.id} d={d} onEdit={() => { setEdit(d); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />) : (
            <div className="empty">
              <h3>{inSeason.length ? 'No days of this type' : 'No days logged this season'}</h3>
              <p>{inSeason.length ? 'Pick another filter.' : 'Use the form to log your first day out.'}</p>
            </div>
          )}
        </section>
      </div>
    </>
  )
}

function DayCard({ d, onEdit }: { d: SkiDay; onEdit: () => void }) {
  const [confirm, setConfirm] = useState(false)
  const r = resortById(d.resortId)
  const [y, m, dd] = d.date.split('-')
  const meta = [d.newSnow != null && `${d.newSnow} cm new`, d.temp != null && `${d.temp} °C`, VIS[d.visibility]].filter(Boolean)
  return (
    <article className="day" style={{ ['--c' as string]: d.types[0] ? TYPE_COLOR[d.types[0]] : 'var(--line)' }}>
      <div className="date"><b className="num">{Number(dd)}</b><span>{new Date(`${y}-${m}-15`).toLocaleString('en', { month: 'short' })} {y}</span></div>
      <div className="main">
        <div className="row">
          <b>{r?.name ?? (d.place || 'Somewhere')}</b>
          {d.types.map((t) => <span key={t} className="tag" style={{ color: TYPE_COLOR[t], fontWeight: 600 }}>{SKI_TYPE[t]}</span>)}
          <span className="tag">{SNOW[d.snow]}</span>
        </div>
        {d.highlight && <p style={{ fontWeight: 500 }}>{d.highlight}</p>}
        {d.notes && <p className="small">{d.notes}</p>}
        <p className="small muted num">{meta.join('  ·  ')}</p>
        {(d.photos?.length ?? 0) > 0 && <PhotoStrip photos={d.photos!} />}
      </div>
      <div className="side stack" style={{ justifyItems: 'end', gap: 4 }}>
        <span className="stars" aria-label={d.rating ? `${d.rating} of 5` : 'Not rated'}>{d.rating ? '★'.repeat(d.rating) + '☆'.repeat(5 - d.rating) : '–'}</span>
        {confirm ? (
          <div className="row">
            <button type="button" className="danger" onClick={() => { remove('days', d.id); toast('Day deleted') }}>Delete</button>
            <button type="button" className="quiet" onClick={() => setConfirm(false)}>Keep</button>
          </div>
        ) : (
          <div className="row" style={{ gap: 0 }}>
            <button type="button" className="link" onClick={onEdit}>Edit</button>
            <button type="button" className="link" onClick={() => setConfirm(true)}>Delete</button>
          </div>
        )}
      </div>
    </article>
  )
}

function PhotoStrip({ photos }: { photos: Photo[] }) {
  const [open, setOpen] = useState<Photo | null>(null)
  return (
    <>
      <div className="photos">
        {photos.map((p) => (
          <button key={p.id} type="button" className="thumb" onClick={() => setOpen(p)} aria-label="Open photo">
            <img src={safeSrc(p.url)} alt="" loading="lazy" />
          </button>
        ))}
      </div>
      {open && (
        <div className="lightbox" role="dialog" aria-label="Photo" onClick={() => setOpen(null)}>
          <img src={safeSrc(open.url)} alt="" />
          <button type="button" className="quiet" onClick={() => setOpen(null)}>Close</button>
        </div>
      )}
    </>
  )
}

function DayForm({ initial, onDone }: { initial: SkiDay | null; onDone: () => void }) {
  const [f, setF] = useState(() => (initial ? { ...initial } : blank()))
  const [busy, setBusy] = useState(false)
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p })
  const num = (v: string) => (v.trim() === '' || !isFinite(Number(v)) ? null : Number(v))
  const toggle = (t: SkiType) => set({ types: f.types.includes(t) ? f.types.filter((x) => x !== t) : [...f.types, t] })
  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault()
        if (!f.date || (!f.resortId && !f.place.trim())) {
          toast('Add a date and a place')
          return
        }
        const resort = resortById(f.resortId)
        upsert('days', { ...f, place: resort ? resort.name : f.place.trim(), id: initial?.id ?? newId('d'), updatedAt: 0 } as SkiDay)
        toast(initial ? 'Changes saved' : 'Day saved')
        setF(blank())
        onDone()
      }}
    >
      <h2>{initial ? 'Edit day' : 'Log a day'}</h2>
      <div className="fields">
        <div className="field"><label className="label" htmlFor="f-date">Date</label><input id="f-date" type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} required /></div>
        <div className="field"><label className="label" htmlFor="f-resort">Resort</label>
          <select id="f-resort" value={f.resortId ?? ''} onChange={(e) => set({ resortId: e.target.value || null })}>
            <option value="">Other place…</option>
            {RESORTS.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
          </select>
        </div>
        {!f.resortId && <div className="field"><label className="label" htmlFor="f-place">Place</label><input id="f-place" value={f.place} onChange={(e) => set({ place: e.target.value })} placeholder="Hammarbybacken" /></div>}
      </div>
      <div className="field"><span className="label">Type of skiing</span><Chips label="Type of skiing" options={SKI_TYPE} value={f.types} onToggle={toggle} /></div>
      <div className="fields">
        <div className="field"><label className="label" htmlFor="f-snow">Snow</label>
          <select id="f-snow" value={f.snow} onChange={(e) => set({ snow: e.target.value as SnowType })}>{(Object.keys(SNOW) as SnowType[]).map((s) => <option key={s} value={s}>{SNOW[s]}</option>)}</select>
        </div>
        <div className="field"><label className="label" htmlFor="f-vis">Weather</label>
          <select id="f-vis" value={f.visibility} onChange={(e) => set({ visibility: e.target.value as Visibility })}>{(Object.keys(VIS) as Visibility[]).map((s) => <option key={s} value={s}>{VIS[s]}</option>)}</select>
        </div>
        <div className="field"><label className="label" htmlFor="f-new">New snow (cm)</label><input id="f-new" type="number" inputMode="numeric" min={0} value={f.newSnow ?? ''} onChange={(e) => set({ newSnow: num(e.target.value) })} /></div>
        <div className="field"><label className="label" htmlFor="f-temp">Temp (°C)</label><input id="f-temp" type="number" inputMode="numeric" value={f.temp ?? ''} onChange={(e) => set({ temp: num(e.target.value) })} /></div>
      </div>
      <div className="field"><label className="label" htmlFor="f-hl">Best hit or line</label><input id="f-hl" value={f.highlight} maxLength={140} onChange={(e) => set({ highlight: e.target.value })} placeholder="Cliff off the ridge, ~4 m, stomped" /></div>
      <div className="field"><label className="label" htmlFor="f-notes">Notes</label><textarea id="f-notes" value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Boots, wax, crowds, what to try next time" /></div>
      <div className="field">
        <span className="label">Photos</span>
        <div className="photos">
          {(f.photos ?? []).map((p) => (
            <span key={p.id} className="thumb">
              <img src={safeSrc(p.url)} alt="" />
              <button type="button" className="thumb-x" aria-label="Remove photo" onClick={() => set({ photos: (f.photos ?? []).filter((x) => x.id !== p.id) })}>×</button>
            </span>
          ))}
          <label className="thumb add" aria-label="Add photos">
            {busy ? '…' : '+'}
            <input id="f-photos" type="file" accept="image/*" multiple hidden disabled={busy} onChange={async (e) => {
              const files = [...(e.target.files ?? [])]
              e.target.value = ''
              if (!files.length) return
              setBusy(true)
              const added: Photo[] = []
              for (const file of files) {
                try { added.push(await addPhoto(file)) } catch (err) { toast(err instanceof Error ? err.message : 'A photo could not be added') }
              }
              setF((cur) => ({ ...cur, photos: [...(cur.photos ?? []), ...added] }))
              setBusy(false)
            }} />
          </label>
        </div>
      </div>
      <div className="field"><span className="label">Rating</span>
        <div className="rating" role="group" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => <button type="button" key={n} aria-pressed={(f.rating ?? 0) >= n} aria-label={`${n} of 5`} onClick={() => set({ rating: f.rating === n ? null : n })}>{n}</button>)}
        </div>
      </div>
      <div className="row">
        <button type="submit" disabled={busy}>{busy ? 'Uploading photos…' : initial ? 'Save changes' : 'Save day'}</button>
        {initial && <button type="button" className="quiet" onClick={onDone}>Cancel</button>}
        {!initial && f.date && <span className="small muted">{fmtDate(f.date, { weekday: 'long', day: 'numeric', month: 'long' })}</span>}
      </div>
    </form>
  )
}
