import { useMemo, useState } from 'react'
import { Chips, DangerBadge, daysBetween, fmtDate, SKI_TYPE, toast, today, useAsync } from '../components/ui'
import { GENERAL_APPS, GENERAL_RULES, PRACTICAL } from '../data/practical'
import { COUNTRY_NAMES, FLAG, resortById, RESORTS, type Resort } from '../data/resorts'
import { CONDITIONS } from '../data/templates'
import { dateWarnings, MODE_LABEL, travelOptions } from '../data/travel'
import { avalanche, depthOn, forecast, history, verdict, weatherLabel, type Forecast } from '../lib/conditions'
import { live, newId, remove, upsert, useStore } from '../lib/store'
import type { CondId, Discipline, SkiType, Trip } from '../lib/types'

export default function Trips({ tripId, go }: { tripId: string | null; go: (h: string) => void }) {
  const all = useStore((s) => s.trips)
  const trips = useMemo(() => live(all).sort((a, b) => a.start.localeCompare(b.start)), [all])
  const trip = trips.find((t) => t.id === tripId)
  if (trip) return <TripDetail trip={trip} go={go} />

  const upcoming = trips.filter((t) => t.end >= today())
  const past = trips.filter((t) => t.end < today()).reverse()
  return (
    <>
      <div className="head">
        <div>
          <div className="label">Plans</div>
          <h1>Trips</h1>
          <p>Upcoming ski days with live conditions, how to get there from Stockholm, and what to pack.</p>
        </div>
      </div>
      <NewTrip onCreate={(id) => go(`trip-${id}`)} />
      <section className="stack">
        <h2>Upcoming</h2>
        {upcoming.length ? <div className="grid3">{upcoming.map((t) => <TripCard key={t.id} t={t} go={go} />)}</div> : <div className="empty"><h3>No upcoming trips</h3><p>Add one above.</p></div>}
      </section>
      {past.length > 0 && (
        <section className="stack">
          <h2>Past</h2>
          <div className="grid3">{past.map((t) => <TripCard key={t.id} t={t} go={go} />)}</div>
        </section>
      )}
    </>
  )
}

export function TripCard({ t, go }: { t: Trip; go: (h: string) => void }) {
  const r = resortById(t.resortId)
  const until = daysBetween(today(), t.start)
  return (
    <button type="button" className="resort" style={{ textAlign: 'left', cursor: 'pointer', color: 'var(--ink)', font: 'inherit' }} onClick={() => go(`trip-${t.id}`)}>
      <span className="between" style={{ width: '100%' }}>
        <h3>{t.name}</h3>
        <span className="tag num">{until > 0 ? `in ${until} d` : t.end >= today() ? 'now' : 'done'}</span>
      </span>
      <span className="small">{r ? `${FLAG[r.country]} ${r.name}` : t.place} · {fmtDate(t.start)} – {fmtDate(t.end)}</span>
      <span className="chips">{t.types.map((x) => <span key={x} className="tag">{SKI_TYPE[x]}</span>)}{t.source && <span className="tag">From {t.source}</span>}</span>
    </button>
  )
}

function NewTrip({ onCreate }: { onCreate: (id: string) => void }) {
  const [resortId, setResortId] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  return (
    <form
      className="panel"
      onSubmit={(e) => {
        e.preventDefault()
        const r = resortById(resortId)
        if (!r || !start) {
          toast('Pick a resort and a start date')
          return
        }
        const id = newId('trip')
        upsert('trips', {
          id, updatedAt: 0, name: `${r.name}, ${fmtDate(start, { month: 'long' })}`, resortId: r.id, place: r.name,
          start, end: end && end >= start ? end : start, types: ['piste', 'freeride'], travelChoice: '', plan: '', checklist: {},
        })
        onCreate(id)
      }}
    >
      <h2>Plan a trip</h2>
      <div className="fields">
        <div className="field"><label className="label" htmlFor="nt-resort">Resort</label>
          <select id="nt-resort" value={resortId} onChange={(e) => setResortId(e.target.value)}>
            <option value="">Choose…</option>
            {RESORTS.map((r) => <option key={r.id} value={r.id}>{FLAG[r.country]} {r.name}</option>)}
          </select>
        </div>
        <div className="field"><label className="label" htmlFor="nt-start">First ski day</label><input id="nt-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div className="field"><label className="label" htmlFor="nt-end">Last ski day</label><input id="nt-end" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} /></div>
      </div>
      <div><button type="submit">Create trip</button></div>
    </form>
  )
}

// ---------------------------------------------------------------------------

function TripDetail({ trip, go }: { trip: Trip; go: (h: string) => void }) {
  const r = resortById(trip.resortId)
  const set = (p: Partial<Trip>) => upsert('trips', { ...trip, ...p })
  const [confirm, setConfirm] = useState(false)
  const until = daysBetween(today(), trip.start)
  const nDays = daysBetween(trip.start, trip.end) + 1

  return (
    <>
      <div className="head">
        <div>
          <button type="button" className="link" style={{ paddingLeft: 0 }} onClick={() => go('trips')}>← All trips</button>
          <h1>{trip.name}</h1>
          <p>
            {r ? `${FLAG[r.country]} ${r.name}, ${r.region}` : trip.place} · {fmtDate(trip.start, { weekday: 'short', day: 'numeric', month: 'long' })} – {fmtDate(trip.end, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })} · {nDays} ski {nDays === 1 ? 'day' : 'days'}
            {until > 0 && ` · starts in ${until} days`}
          </p>
        </div>
      </div>

      <section className="panel">
        <div className="fields">
          <div className="field"><label className="label" htmlFor="t-name">Name</label><input id="t-name" value={trip.name} onChange={(e) => set({ name: e.target.value })} /></div>
          <div className="field"><label className="label" htmlFor="t-start">First ski day</label><input id="t-start" type="date" value={trip.start} onChange={(e) => set({ start: e.target.value, end: trip.end < e.target.value ? e.target.value : trip.end })} /></div>
          <div className="field"><label className="label" htmlFor="t-end">Last ski day</label><input id="t-end" type="date" min={trip.start} value={trip.end} onChange={(e) => set({ end: e.target.value })} /></div>
        </div>
        <div className="field"><span className="label">Planned skiing</span>
          <Chips label="Planned skiing" options={SKI_TYPE} value={trip.types} onToggle={(t) => set({ types: trip.types.includes(t) ? trip.types.filter((x) => x !== t) : [...trip.types, t] })} />
        </div>
      </section>

      {trip.source && (
        <section className="panel">
          <div className="between"><h2>Bookings</h2><span className="tag">From {trip.source}</span></div>
          {trip.bookings?.length ? (
            <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>{trip.bookings.map((b) => <li key={b}>{b}</li>)}</ul>
          ) : <p className="small muted">Nothing booked yet in {trip.source}.</p>}
          <p className="note">Copied from {trip.source}. Change bookings there and ask Claude to sync again.</p>
        </section>
      )}
      {r && <Conditions r={r} trip={trip} />}
      {r && <Travel r={r} trip={trip} set={set} />}
      {r && <PracticalInfo r={r} />}
      <Packing trip={trip} set={set} />

      <section className="panel">
        <h2>Plan and bookings</h2>
        <textarea id="t-plan" aria-label="Plan and bookings" style={{ minHeight: 140 }} value={trip.plan} onChange={(e) => set({ plan: e.target.value })}
          placeholder={'Flights, booking numbers, lodging, who is coming…\nSK 1234 ARN 07:05 → GVA 09:45'} />
      </section>

      <div className="row">
        {confirm ? (
          <>
            <button type="button" className="danger" onClick={() => { remove('trips', trip.id); go('trips'); toast('Trip deleted') }}>Delete this trip</button>
            <button type="button" className="quiet" onClick={() => setConfirm(false)}>Keep it</button>
          </>
        ) : (
          <button type="button" className="quiet" onClick={() => setConfirm(true)}>Delete trip…</button>
        )}
      </div>
    </>
  )
}

// ---------------- Conditions ----------------

function Conditions({ r, trip }: { r: Resort; trip: Trip }) {
  const fc = useAsync(`fc:${r.id}`, () => forecast(r))
  const ava = useAsync(r.avalanche.kind === 'link' ? null : `ava:${r.id}`, () => avalanche(r))
  const md = trip.start.slice(5)
  const hist = useAsync(`hist:${r.id}`, () => history(r))
  const until = daysBetween(today(), trip.start)
  const tripDays = fc.data?.days.filter((d) => d.date >= trip.start && d.date <= trip.end) ?? []
  const opens = new Date(new Date(trip.start + 'T12:00:00').getTime() - 15 * 864e5).toISOString().slice(0, 10)

  return (
    <section className="panel">
      <div className="between">
        <h2>Conditions</h2>
        {fc.data && <span className="small muted">Updated {new Date(fc.data.fetchedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · Open-Meteo</span>}
      </div>

      {fc.loading && <p className="muted">Loading the forecast…</p>}
      {fc.error && <p className="tone-bad">The forecast didn't load ({fc.error}). Check your connection and reopen the trip.</p>}
      {fc.data && (
        <>
          <div className="row small">
            <span>Modelled snow depth now: <b className="num">{fc.data.snowDepth ?? '–'} cm</b></span>
            <span className="muted">· Top {r.top} m · base {r.base} m</span>
          </div>
          {tripDays.length ? (
            <p className="small">The forecast covers {tripDays.length} of your ski days (highlighted). Forecasts beyond 5–7 days are rough.</p>
          ) : until > 0 ? (
            <p className="small">Your first ski day is {until} days away. The forecast for it appears around <b>{fmtDate(opens, { day: 'numeric', month: 'long' })}</b>. Here is the next 16 days at the resort:</p>
          ) : null}
          <ForecastStrip fc={fc.data} trip={trip} />
        </>
      )}

      <div className="stack">
        <h3>Avalanche danger</h3>
        {r.avalanche.kind === 'link' ? (
          <p className="small">No open data for this area: read the <a href={r.avalanche.url} target="_blank" rel="noreferrer">{r.avalanche.label}</a>. It is published every afternoon for the next day.</p>
        ) : ava.loading ? <p className="muted small">Loading the bulletin…</p> : ava.error ? (
          <p className="small tone-bad">The bulletin didn't load ({ava.error}).</p>
        ) : ava.data && ava.data.days.length ? (
          <div className="stack">
            {ava.data.days.slice(0, 3).map((d) => (
              <div key={d.date} className="stack" style={{ gap: 4 }}>
                <div className="row"><b className="small">{fmtDate(d.date)}</b><DangerBadge level={d.level} high={d.levelHigh} split={d.split} /><span className="small muted">{d.region}</span></div>
                {d.problems.length > 0 && <div className="chips">{d.problems.map((p) => <span key={p} className="tag">{p}</span>)}</div>}
                {d.text && <p className="small">{d.text}</p>}
              </div>
            ))}
            <p className="note">Current bulletin from <a href={ava.data.url} target="_blank" rel="noreferrer">{ava.data.source}</a>. It only says something about your trip once you are 1–2 days out. Read the full bulletin before going off-piste.</p>
          </div>
        ) : <p className="small muted">No bulletin is published for this area today (often the case outside the season).</p>}
      </div>

      <div className="stack">
        <h3>Snow on {fmtDate(trip.start, { day: 'numeric', month: 'long' })} in past seasons</h3>
        {hist.loading && <p className="muted small">Loading five seasons of snow history…</p>}
        {hist.error && <p className="small tone-bad">History didn't load ({hist.error}).</p>}
        {hist.data && (
          <>
            <div className="scroll-x">
              <table>
                <thead><tr><th>Season</th><th className="num">Depth that day</th><th className="num">Season snowfall</th><th className="num">Avg depth Dec–Mar</th></tr></thead>
                <tbody>{depthOn(hist.data, md).map((s) => <tr key={s.label}><td>{s.label}</td><td className="num">{s.cm ?? '–'} cm</td><td className="num">{s.snowfall} cm</td><td className="num">{s.meanDepth} cm</td></tr>)}</tbody>
              </table>
            </div>
            <p className="note">Modelled at {hist.data.elevation} m (ERA5 reanalysis via Open-Meteo). Good for comparing years, not an exact on-piste depth.</p>
          </>
        )}
      </div>
    </section>
  )
}

function ForecastStrip({ fc, trip }: { fc: Forecast; trip: Trip }) {
  return (
    <div className="scroll-x">
      <div className="fc">
        {fc.days.map((d) => {
          const w = weatherLabel(d.code)
          const v = verdict(d)
          const on = d.date >= trip.start && d.date <= trip.end
          return (
            <div key={d.date} className={`fc-day${on ? ' on' : ''}`}>
              <span className="d">{fmtDate(d.date)}</span>
              <span className="big" aria-label={w.text}>{w.icon}</span>
              <span className={`small tone-${v.tone}`}>{v.label}</span>
              <span className="num">❄ {d.snowTop.toFixed(0)} cm</span>
              <span className="num muted">Top {Math.round(d.tMinTop)}/{Math.round(d.tMaxTop)}°</span>
              <span className="num muted">Base {Math.round(d.tMinBase)}/{Math.round(d.tMaxBase)}°</span>
              <span className="num muted">Wind {Math.round(d.windTop)} ({Math.round(d.gustTop)})</span>
              {d.freezing != null && <span className="num muted">0° at {d.freezing} m</span>}
              {d.precip > 0 && <span className="num muted">{d.precip.toFixed(1)} mm{d.rainBase >= 1 ? ' (rain)' : ''}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------- Travel ----------------

function Travel({ r, trip, set }: { r: Resort; trip: Trip; set: (p: Partial<Trip>) => void }) {
  const opts = travelOptions(r, trip.start, trip.end)
  const warnings = dateWarnings(r, trip.start, trip.end)
  const fastest = opts[0]
  return (
    <section className="panel">
      <div className="between"><h2>Getting there from Stockholm</h2><span className="small muted">Sorted fastest first · times are one way, door to door</span></div>
      {warnings.map((w) => <div key={w} className="warn">{w}</div>)}
      {r.transfer && <p className="small"><b>Last leg:</b> {r.transfer}</p>}
      <div className="stack">
        {opts.map((o) => {
          const chosen = trip.travelChoice === o.id
          return (
            <article key={o.id} className={`opt${chosen ? ' chosen' : ''}`}>
              <div className="between">
                <div className="row">
                  <span className="mode">{MODE_LABEL[o.mode]}</span>
                  {o === fastest && <span className="mode fastest">Fastest</span>}
                  <b>{o.title}</b>
                </div>
                <span className="num">{o.time}</span>
              </div>
              <ol className="small">{o.legs.map((l) => <li key={l}>{l}</li>)}</ol>
              {(o.good.length > 0 || o.watch.length > 0) && (
                <ul>
                  {o.good.map((g) => <li key={g}><span className="tone-good">+</span> {g}</li>)}
                  {o.watch.map((g) => <li key={g}><span className="tone-ok">!</span> {g}</li>)}
                </ul>
              )}
              <div className="row">
                {o.links.map((l) => <a key={l.url} className="btn ghost" href={l.url} target="_blank" rel="noreferrer">{l.label} ↗</a>)}
                <button type="button" className={chosen ? '' : 'quiet'} style={{ marginLeft: 'auto' }} onClick={() => set({ travelChoice: chosen ? '' : o.id })}>{chosen ? '✓ Chosen' : 'Choose this'}</button>
              </div>
            </article>
          )
        })}
      </div>
      <p className="note">Schedules change every season. The links search your exact dates; confirm times and prices there before booking.</p>
    </section>
  )
}

// ---------------- Practical ----------------

function PracticalInfo({ r }: { r: Resort }) {
  const p = PRACTICAL[r.country]
  return (
    <section className="panel">
      <h2>Practical info</h2>
      <div className="grid2">
        <div className="stack">
          <h3>Emergency in {COUNTRY_NAMES[r.country]}</h3>
          <div className="phones">{p.phones.map((x) => <FragmentRow key={x.number} a={<b>{x.number}</b>} b={x.what} />)}</div>
          <h3>Ski pass</h3>
          {r.pass ? <p className="small">{r.pass.text} <span className="muted">(source: {r.pass.source}, {r.pass.asOf})</span></p> : <p className="small muted">No price saved yet.</p>}
          <p className="small"><a href={r.passUrl} target="_blank" rel="noreferrer">Official prices and online booking ↗</a> · Currency: {p.currency}</p>
          <p className="small"><a href={r.web} target="_blank" rel="noreferrer">Resort website, piste map and lift status ↗</a></p>
        </div>
        <div className="stack">
          <h3>Useful apps</h3>
          <div className="list">
            {[...p.apps, ...GENERAL_APPS].map((a) => (
              <div key={a.name} className="item" style={{ gridTemplateColumns: '1fr' }}>
                <div><a className="name" href={a.url} target="_blank" rel="noreferrer">{a.name}</a><div className="sub">{a.what}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="stack">
        <h3>Good to know</h3>
        <ul className="small" style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }}>{[...p.rules, ...GENERAL_RULES].map((x) => <li key={x}>{x}</li>)}</ul>
      </div>
    </section>
  )
}
const FragmentRow = ({ a, b }: { a: React.ReactNode; b: string }) => (<>{a}<span className="small">{b}</span></>)

// ---------------- Packing ----------------

const NEEDS: Record<SkiType, Discipline[]> = { piste: ['allmountain'], freeride: ['allmountain'], park: ['park'], touring: ['touring'], backcountry: ['touring', 'allmountain'] }

function Packing({ trip, set }: { trip: Trip; set: (p: Partial<Trip>) => void }) {
  const gearAll = useStore((s) => s.gear)
  const clothesAll = useStore((s) => s.clothing)
  const disciplines = new Set(trip.types.flatMap((t) => NEEDS[t]))
  const gear = live(gearAll).filter((g) => (g.discipline === 'shared' || disciplines.has(g.discipline as Discipline)) && (g.essential || g.status === 'have') && g.status !== 'na')
  const conds = new Set<CondId>(['normal'])
  const m = Number(trip.start.slice(5, 7))
  if (m === 12 || m <= 2) conds.add('cold')
  if (m >= 3 && m <= 6) conds.add('spring')
  conds.add('storm')
  if (trip.types.includes('touring') || trip.types.includes('backcountry')) conds.add('uphill')
  const clothes = live(clothesAll).filter((c) => c.conditions.some((x) => conds.has(x)) && c.status !== 'na')
  const missing = [...gear, ...clothes].filter((x) => x.status === 'missing' || x.status === 'unknown')
  const check = (id: string) => set({ checklist: { ...trip.checklist, [id]: !trip.checklist[id] } })
  const packed = [...gear, ...clothes].filter((x) => trip.checklist[x.id]).length

  return (
    <section className="panel">
      <div className="between"><h2>Packing</h2><span className="num small">{packed}/{gear.length + clothes.length} packed</span></div>
      <p className="small muted">Based on the planned skiing and the season: {[...conds].map((c) => CONDITIONS[c].name.toLowerCase()).join(', ')}.</p>
      {missing.length > 0 && (
        <div className="warn">
          <b>Sort out before you go:</b> {missing.slice(0, 8).map((x) => ('slot' in x ? x.slot : x.name) + (x.status === 'unknown' ? ' (not checked)' : '')).join(', ')}
          {missing.length > 8 && ` and ${missing.length - 8} more`}.
        </div>
      )}
      <div className="grid2">
        {[{ title: 'Gear', rows: gear.map((g) => ({ id: g.id, name: g.slot, model: g.model, status: g.status })) }, { title: 'Clothing', rows: clothes.map((c) => ({ id: c.id, name: c.name, model: c.model, status: c.status })) }].map((col) => (
          <div key={col.title} className="stack" style={{ gap: 0 }}>
            <h3>{col.title}</h3>
            {col.rows.map((x) => (
              <label key={x.id} className="item" style={{ gridTemplateColumns: 'auto minmax(0,1fr) auto', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: 18, height: 18 }} checked={!!trip.checklist[x.id]} onChange={() => check(x.id)} />
                <span><span className="name">{x.name}</span>{x.model && <span className="sub"> · {x.model}</span>}</span>
                {x.status !== 'have' && <span className={`status st-${x.status}`}>{x.status === 'unknown' ? '?' : x.status === 'upgrade' ? 'Replace' : 'Missing'}</span>}
              </label>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
