import { useMemo, useState } from 'react'
import { Seg, useAsync } from '../components/ui'
import { COUNTRY_NAMES, distanceKm, FLAG, RESORTS, STOCKHOLM, TAGS, type Country, type Resort, type Tag } from '../data/resorts'
import { depthLabel, forecast, GLACIER_CM, history, snowSummary, type SnowSummary } from '../lib/conditions'
import { live, newId, upsert, useStore } from '../lib/store'
import { AddResortForm } from './AddResort'

type Sort = 'km' | 'vertical' | 'top' | 'snow' | 'distance' | 'days'
const SORTS: Record<Sort, string> = { km: 'Km of pistes', vertical: 'Vertical', top: 'Top altitude', snow: 'Snow depth', distance: 'Closest', days: 'Your days' }
const DEPTHS = [0, 30, 50, 75, 100, 150]
const dKm = (r: Resort) => (isFinite(r.lat) ? distanceKm(STOCKHOLM.lat, STOCKHOLM.lon, r.lat, r.lon) : Infinity)

export default function Resorts({ go }: { go: (h: string) => void }) {
  const daysAll = useStore((s) => s.days)
  useStore((s) => s.resorts) // re-render when you add a resort
  const [adding, setAdding] = useState(false)
  const daysAt = useMemo(() => {
    const m = new Map<string, number>()
    for (const d of live(daysAll)) if (d.resortId) m.set(d.resortId, (m.get(d.resortId) ?? 0) + 1)
    return m
  }, [daysAll])
  const [tags, setTags] = useState<Tag[]>([])
  const [country, setCountry] = useState<Country | 'all'>('all')
  const [sort, setSort] = useState<Sort>('km')
  const [q, setQ] = useState('')
  const [minDepth, setMinDepth] = useState(0)
  const snow = useAsync('snow-summary', snowSummary)
  const depthOf = (r: Resort) => snow.data?.[r.id]?.meanDepth
  const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  const list = RESORTS.filter((r) => (country === 'all' || r.country === country) && tags.every((t) => r.tags.includes(t)) && (!q || norm(`${r.name} ${r.area ?? ''} ${r.region}`).includes(norm(q))) && (!minDepth || (depthOf(r) ?? -1) >= minDepth)).sort((a, b) => {
    if (sort === 'snow') return (depthOf(b) ?? -1) - (depthOf(a) ?? -1)
    if (sort === 'km') return b.km - a.km
    if (sort === 'vertical') return b.top - b.base - (a.top - a.base)
    if (sort === 'top') return b.top - a.top
    if (sort === 'days') return (daysAt.get(b.id) ?? 0) - (daysAt.get(a.id) ?? 0)
    return dKm(a) - dKm(b)
  })

  return (
    <>
      <div className="head">
        <div>
          <div className="label">Discover</div>
          <h1>Resorts</h1>
          <p>Compare size, vertical and snow. Average snow depth is the modelled natural snow at mid-mountain, December to March, over the last five seasons. It leaves out machine-made snow, so small hills with snow-making look thin.</p>
        </div>
      </div>
      <section className="panel">
        <div className="chips" role="group" aria-label="Good for">
          {(Object.keys(TAGS) as Tag[]).map((t) => (
            <button type="button" key={t} className="chip" aria-pressed={tags.includes(t)} onClick={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])}>{TAGS[t]}</button>
          ))}
        </div>
        <div className="row">
          <input id="r-search" type="search" aria-label="Search resorts" placeholder="Search: Vars, Dolomites, Sälen…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: '1 1 200px', width: 'auto' }} />
          <select id="r-country" aria-label="Country" value={country} onChange={(e) => setCountry(e.target.value as Country | 'all')} style={{ width: 'auto' }}>
            <option value="all">All countries</option>
            {(Object.keys(COUNTRY_NAMES) as Country[]).map((c) => <option key={c} value={c}>{FLAG[c]} {COUNTRY_NAMES[c]}</option>)}
          </select>
          <select id="r-depth" aria-label="Average snow depth" value={minDepth} onChange={(e) => setMinDepth(Number(e.target.value))} style={{ width: 'auto' }}>
            {DEPTHS.map((d) => <option key={d} value={d}>{d ? `Avg snow depth ${d}+ cm` : 'Any snow depth'}</option>)}
          </select>
          <Seg label="Sort by" value={sort} onChange={setSort} options={SORTS} />
          <span className="small muted">{list.length} resorts{minDepth && snow.data ? ` · ${RESORTS.filter((r) => depthOf(r) == null).length} without snow data are hidden` : ''}</span>
          <button type="button" className="ghost" style={{ marginLeft: 'auto' }} onClick={() => setAdding(!adding)} aria-expanded={adding}>{adding ? 'Close' : 'Add a resort'}</button>
        </div>
        {adding && <AddResortForm initialName={q} onDone={(id) => { setAdding(false); if (id) setQ('') }} />}
      </section>
      {list.length ? (
        <div className="grid3">{list.map((r) => <ResortCard key={r.id} r={r} days={daysAt.get(r.id) ?? 0} go={go} snow={snow.data?.[r.id]} />)}</div>
      ) : (
        <div className="empty"><h3>No resort matches</h3><p>Remove a filter, or use Add a resort to add {q ? `“${q}”` : 'a new one'}.</p></div>
      )}
    </>
  )
}

function ResortCard({ r, days, go, snow: avg }: { r: Resort; days: number; go: (h: string) => void; snow?: SnowSummary[string] }) {
  const [snow, setSnow] = useState(false)
  const vert = r.top - r.base
  const d = dKm(r)
  const dist = isFinite(d) ? Math.round(d / 10) * 10 : null
  const maxVert = Math.max(...RESORTS.map((x) => x.top - x.base))
  return (
    <article className="resort">
      <div className="between">
        <h3>{FLAG[r.country]} {r.name}</h3>
        <span className="row" style={{ gap: 4 }}>{r.custom && <span className="tag">Added by you</span>}{days > 0 && <span className="tag">{days} {days === 1 ? 'day' : 'days'} logged</span>}</span>
      </div>
      <p className="small muted">{[r.area, r.region, r.season].filter(Boolean).join(' · ')}</p>
      <div className="figs">
        <div><b>{r.km}</b><span>km pistes</span></div>
        <div><b>{vert.toLocaleString('en')}</b><span>m vertical</span></div>
        <div><b>{r.top.toLocaleString('en')}</b><span>m top</span></div>
      </div>
      {avg && (
        <p className="small">
          <b className="num">{depthLabel(avg.meanDepth)} cm</b> average snow depth Dec–Mar · <span className="num">{avg.snowfall}</span> cm snowfall a season
          {avg.meanDepth > GLACIER_CM && <span className="muted"> (glacier model cell)</span>}
        </p>
      )}
      <div className="vbar" aria-label={`${r.base} to ${r.top} m`}>
        <div className="track"><div className="fill" style={{ left: `${(r.base / 4000) * 100}%`, width: `${(vert / 4000) * 100}%` }} /></div>
        <span className="small muted num">{r.base}–{r.top} m · {Math.round((vert / maxVert) * 100)}% of the biggest vertical here · {dist != null ? `${dist.toLocaleString('en')} km from Stockholm` : 'position not set'}</span>
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
