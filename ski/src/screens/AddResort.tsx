import { useMemo, useRef, useState } from 'react'
import { toast } from '../components/ui'
import { COUNTRY_NAMES, FLAG, RESORTS, TAGS, type Country, type Tag } from '../data/resorts'
import { newId, upsert, useStore } from '../lib/store'

const norm = (x: string) => x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const numOrNull = (v: string) => (v.trim() === '' || !isFinite(Number(v)) ? null : Number(v))

/** Form to add your own resort. It is saved with your data and appears on the Resorts tab. */
export function AddResortForm({ initialName = '', onDone }: { initialName?: string; onDone: (id: string | null) => void }) {
  const [f, setF] = useState({ name: initialName, country: 'SE' as Country, region: '', base: '', top: '', km: '', lat: '', lon: '', web: '', notes: '', tags: [] as Tag[] })
  const set = (p: Partial<typeof f>) => setF({ ...f, ...p })
  return (
    <form
      className="stack"
      style={{ background: 'var(--sunken)', borderRadius: 8, padding: 12 }}
      onSubmit={(e) => {
        e.preventDefault()
        if (!f.name.trim()) {
          toast('Give the resort a name')
          return
        }
        const exists = RESORTS.find((r) => norm(r.name) === norm(f.name.trim()))
        if (exists) {
          toast(`${exists.name} is already in the list`)
          onDone(exists.id)
          return
        }
        const id = newId('custom')
        upsert('resorts', {
          id, updatedAt: 0, name: f.name.trim(), country: f.country, region: f.region.trim(),
          base: numOrNull(f.base), top: numOrNull(f.top), km: numOrNull(f.km), lat: numOrNull(f.lat), lon: numOrNull(f.lon),
          web: /^https:\/\//.test(f.web.trim()) ? f.web.trim() : '', notes: f.notes.trim(), tags: f.tags,
        })
        toast(`${f.name.trim()} added to your resorts`)
        onDone(id)
      }}
    >
      <h3>Add a resort</h3>
      <div className="fields">
        <div className="field"><label className="label" htmlFor="ar-name">Name</label><input id="ar-name" value={f.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Orsa Grönklitt" /></div>
        <div className="field"><label className="label" htmlFor="ar-country">Country</label>
          <select id="ar-country" value={f.country} onChange={(e) => set({ country: e.target.value as Country })}>
            {(Object.keys(COUNTRY_NAMES) as Country[]).map((c) => <option key={c} value={c}>{FLAG[c]} {COUNTRY_NAMES[c]}</option>)}
          </select>
        </div>
        <div className="field"><label className="label" htmlFor="ar-region">Region</label><input id="ar-region" value={f.region} onChange={(e) => set({ region: e.target.value })} placeholder="Dalarna" /></div>
      </div>
      <div className="fields">
        <div className="field"><label className="label" htmlFor="ar-base">Base (m)</label><input id="ar-base" type="number" inputMode="numeric" value={f.base} onChange={(e) => set({ base: e.target.value })} /></div>
        <div className="field"><label className="label" htmlFor="ar-top">Top (m)</label><input id="ar-top" type="number" inputMode="numeric" value={f.top} onChange={(e) => set({ top: e.target.value })} /></div>
        <div className="field"><label className="label" htmlFor="ar-km">Km of pistes</label><input id="ar-km" type="number" inputMode="decimal" value={f.km} onChange={(e) => set({ km: e.target.value })} /></div>
      </div>
      <div className="fields">
        <div className="field"><label className="label" htmlFor="ar-lat">Latitude (optional)</label><input id="ar-lat" type="number" step="any" inputMode="decimal" value={f.lat} onChange={(e) => set({ lat: e.target.value })} placeholder="61.07" /></div>
        <div className="field"><label className="label" htmlFor="ar-lon">Longitude (optional)</label><input id="ar-lon" type="number" step="any" inputMode="decimal" value={f.lon} onChange={(e) => set({ lon: e.target.value })} placeholder="14.65" /></div>
        <div className="field"><label className="label" htmlFor="ar-web">Website</label><input id="ar-web" type="url" value={f.web} onChange={(e) => set({ web: e.target.value })} placeholder="https://…" /></div>
      </div>
      <div className="field"><span className="label">Good for</span>
        <div className="chips">{(Object.keys(TAGS) as Tag[]).map((t) => <button type="button" key={t} className="chip" aria-pressed={f.tags.includes(t)} onClick={() => set({ tags: f.tags.includes(t) ? f.tags.filter((x) => x !== t) : [...f.tags, t] })}>{TAGS[t]}</button>)}</div>
      </div>
      <div className="field"><label className="label" htmlFor="ar-notes">Notes</label><input id="ar-notes" value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="What it's like, who you go with…" /></div>
      <p className="note">Leave out what you don't know. With a position, Claude can add forecasts and snow history for it.</p>
      <div className="row"><button type="submit">Add resort</button><button type="button" className="quiet" onClick={() => onDone(null)}>Cancel</button></div>
    </form>
  )
}

/** Search-as-you-type picker for resorts, with an option to add a new one. */
export function ResortPicker({ selected, onPick, label }: { selected: string[]; onPick: (id: string) => void; label: string }) {
  useStore((s) => s.resorts)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState<string | null>(null)
  const [hi, setHi] = useState(0)
  const box = useRef<HTMLDivElement>(null)
  const matches = useMemo(() => {
    const n = norm(q.trim())
    return RESORTS.filter((r) => !selected.includes(r.id) && (!n || norm(`${r.name} ${r.area ?? ''} ${r.region} ${COUNTRY_NAMES[r.country]}`).includes(n))).slice(0, 8)
  }, [q, selected])
  const options = [...matches.map((r) => ({ id: r.id, text: `${FLAG[r.country]} ${r.name}`, sub: r.region })), ...(q.trim() ? [{ id: '__add', text: `+ Add “${q.trim()}” as a new resort`, sub: '' }] : [])]
  const choose = (id: string) => {
    if (id === '__add') {
      setAdding(q.trim())
      setOpen(false)
      return
    }
    onPick(id)
    setQ('')
    setHi(0)
  }

  if (adding !== null) return <AddResortForm initialName={adding} onDone={(id) => { setAdding(null); setQ(''); if (id) onPick(id) }} />
  return (
    <div className="combo" ref={box} onBlur={(e) => { if (!box.current?.contains(e.relatedTarget as Node)) setOpen(false) }}>
      <input
        id="resort-picker"
        type="search"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-controls="resort-picker-list"
        aria-activedescendant={open && options[hi] ? `rp-${hi}` : undefined}
        placeholder="Search resorts or type a new one…"
        value={q}
        onFocus={() => setOpen(true)}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setHi(0) }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setHi(Math.min(hi + 1, options.length - 1)) }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setHi(Math.max(hi - 1, 0)) }
          else if (e.key === 'Enter' && open && options[hi]) { e.preventDefault(); choose(options[hi].id) }
          else if (e.key === 'Escape') setOpen(false)
        }}
      />
      {open && options.length > 0 && (
        <ul className="combo-list" id="resort-picker-list" role="listbox">
          {options.map((o, i) => (
            <li key={o.id} id={`rp-${i}`} role="option" aria-selected={i === hi} className={o.id === '__add' ? 'add' : ''}
              onMouseDown={(e) => { e.preventDefault(); choose(o.id) }} onMouseEnter={() => setHi(i)}>
              <span>{o.text}</span>{o.sub && <span className="muted small">{o.sub}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
