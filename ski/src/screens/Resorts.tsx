import { useMemo, useState } from 'react'
import { Seg, useAsync } from '../components/ui'
import { COUNTRY_NAMES, distanceKm, FLAG, RESORTS, STOCKHOLM, TAGS, type Country, type Resort, type Tag } from '../data/resorts'
import { forecast, history } from '../lib/conditions'
import { live, newId, upsert, useStore } from '../lib/store'

type Sort = 'km' | 'vertical' | 'top' | 'distance' | 'days'
const SORTS: Record<Sort, string> = { km: 'Km of pistes', vertical: 'Vertical', top: 'Top altitude', distance: 'Closest', days: 'Your days' }
const MAX_VERT = Math.max(...RESORTS.map((r) => r.top - r.base))

export default function Resorts({ go }: { go: (h: string) => void }) {
  const daysAll = useStore((s) => s.days)
  const daysAt = useMemo(() => {
    const m = new Map<string, number>()
    for (const d of live(daysAll)) if (d.resortId) m.set(d.resortId, (m.get(d.resortId) ?? 0) + 1)
    return m
  }, [daysAll])
  const [tags, setTags] = useState<Tag[]>([])
  const [country, setCountry] = useState<Country | 'all'>('all')
  const [sort, setSort] = useState<Sort>('km')

  const list = RESORTS.filter((r) => (country === 'all' || r.country === country) && tags.every((t) => r.tags.includes(t))).sort((a, b) => {
    if (sort === 'km') return b.km - a.km
    if (sort === 'vertical') return b.top - b.base - (a.top - a.base)
    if (sort === 'top') return b.top - a.top
    if (sort === 'days') return (daysAt.get(b.id) ?? 0) - (daysAt.get(a.id) ?? 0)
    return distanceKm(STOCKHOLM.lat, STOCKHOLM.lon, a.lat, a.lon) - distanceKm(STOCKHOLM.lat, STOCKHOLM.lon, b.lat, b.lon)
  })

  return (
    <>
      <div className="head">
        <div>
          <div className="label">Discover</div>
          <h1>Resorts</h1>
          <p>Compare size, vertical and snow. Snow data is loaded live: today's modelled depth and the average of the last five seasons.</p>
        </div>
      </div>
      <section className="panel">
        <div className="chips" role="group" aria-label="Good for">
          {(Object.keys(TAGS) as Tag[]).map((t) => (
            <button type="button" key={t} className="chip" aria-pressed={tags.includes(t)} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{TAGS[t]}</button>
          ))}
        </div>
        <div className="row">
          <select id="r-country" aria-label="Country" value={country} onChange={(e) => setCountry(e.target.value as Country | 'all')} style={{ width: 'auto' }}>
            <option value="all">All countries</option>
            {(Object.keys(COUNTRY_NAMES) as Country[]).map((c) => <option key={c} value={c}>{FLAG[c]} {COUNTRY_NAMES[c]}</option>)}
          </select>
          <Seg label="Sort by" value={sort} onChange={setSort} options={SORTS} />
          <span className="small muted">{list.length} resorts</span>
        </div>
      </section>
      {list.length ? (
        <div className="grid3">{list.map((r) => <ResortCard key={r.id} r={r} days={daysAt.get(r.id) ?? 0} go={go} />)}</div>
      ) : (
        <div className="empty"><h3>No resort has all of these</h3><p>Remove a filter.</p></div>
      )}
    </>
  )
}

function ResortCard({ r, days, go }: { r: Resort; days: number; go: (h: string) => void }) {
  const [snow, setSnow] = useState(false)
  const vert = r.top - r.base
  const dist = Math.round(distanceKm(STOCKHOLM.lat, STOCKHOLM.lon, r.lat, r.lon) / 10) * 10
  return (
    <article className="resort">
      <div className="between">
        <h3>{FLAG[r.country]} {r.name}</h3>
        {days > 0 && <span className="tag">{days} {days === 1 ? 'day' : 'days'} logged</span>}
      </div>
      <p className="small muted">{r.area ? `${r.area} · ` : ''}{r.region} · {r.season}</p>
      <div className="figs">
        <div><b>{r.km}</b><span>km pistes</span></div>
        <div><b>{vert.toLocaleString('en')}</b><span>m vertical</span></div>
        <div><b>{r.top.toLocaleString('en')}</b><span>m top</span></div>
      </div>
      <div className="vbar" aria-label={`${r.base} to ${r.top} m`}>
        <div className="track"><div className="fill" style={{ left: `${(r.base / 4000) * 100}%`, width: `${(vert / 4000) * 100}%` }} /></div>
        <span className="small muted num">{r.base}–{r.top} m · {Math.round((vert / MAX_VERT) * 100)}% of the biggest vertical here · {dist.toLocaleString('en')} km from Stockholm</span>
      </div>
      <div className="chips">{r.tags.map((t) => <span key={t} className="tag">{TAGS[t]}</span>)}</div>
      <p className="small">{r.about}</p>
      {r.pass && <p className="small"><b>Pass:</b> {r.pass.text}</p>}
      {snow ? <SnowFacts r={r} /> : null}
      <div className="row">
        <button type="button" className="quiet" onClick={() => setSnow(!snow)} aria-expanded={snow}>{snow ? 'Hide snow data' : 'Snow data'}</button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            const id = newId('trip')
            const d = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10)
            upsert('trips', { id, updatedAt: 0, name: `${r.name} trip`, resortId: r.id, place: r.name, start: d, end: d, types: ['piste', 'freeride'], travelChoice: '', plan: '', checklist: {} })
            go(`trip-${id}`)
          }}
        >
          Plan a trip
        </button>
        <a className="small" href={r.web} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto' }}>Website ↗</a>
      </div>
    </article>
  )
}

function SnowFacts({ r }: { r: Resort }) {
  const fc = useAsync(`fc:${r.id}`, () => forecast(r))
  const h = useAsync(`hist:${r.id}`, () => history(r))
  const next7 = fc.data?.days.slice(0, 7).reduce((a, d) => a + d.snowTop, 0)
  const avg = (k: 'snowfall' | 'meanDepth' | 'maxDepth' | 'daysOver50') =>
    h.data && h.data.seasons.length ? Math.round(h.data.seasons.reduce((a, s) => a + s[k], 0) / h.data.seasons.length) : null
  return (
    <div className="stack" style={{ gap: 6, background: 'var(--sunken)', borderRadius: 6, padding: 10 }}>
      {fc.loading || h.loading ? <span className="small muted">Loading snow data…</span> : null}
      {fc.error && <span className="small tone-bad">Live snow didn't load ({fc.error}).</span>}
      {fc.data && <span className="small">Now: <b className="num">{fc.data.snowDepth ?? '–'} cm</b> modelled depth · next 7 days: <b className="num">{Math.round(next7 ?? 0)} cm</b> new at the top</span>}
      {h.error && <span className="small tone-bad">History didn't load ({h.error}).</span>}
      {h.data && (
        <>
          <span className="small">Last 5 seasons at {h.data.elevation} m: <b className="num">{avg('snowfall')} cm</b> snowfall a season, <b className="num">{avg('meanDepth')} cm</b> average depth Dec–Mar, <b className="num">{avg('daysOver50')}</b> days a season with 50 cm or more.</span>
          <div className="scroll-x">
            <table>
              <thead><tr><th>Season</th><th className="num">Snowfall</th><th className="num">Avg depth</th><th className="num">Max</th></tr></thead>
              <tbody>{h.data.seasons.map((s) => <tr key={s.label}><td>{s.label}</td><td className="num">{s.snowfall}</td><td className="num">{s.meanDepth}</td><td className="num">{s.maxDepth}</td></tr>)}</tbody>
            </table>
          </div>
          <span className="note">cm, modelled (ERA5 via Open-Meteo). Use it to compare resorts and seasons.</span>
        </>
      )}
    </div>
  )
}
