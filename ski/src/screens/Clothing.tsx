import { useMemo, useState } from 'react'
import { StatusSelect, toast } from '../components/ui'
import { CONDITIONS } from '../data/templates'
import { live, newId, remove, upsert, useStore } from '../lib/store'
import type { ClothingItem, CondId } from '../lib/types'

const LAYERS: Record<ClothingItem['layer'], string> = {
  base: 'Base layer', mid: 'Mid layer', outer: 'Outer layer', hands: 'Hands', head: 'Head and neck', feet: 'Feet', extra: 'Extras',
}

export function readiness(items: ClothingItem[], c: CondId) {
  const forC = items.filter((i) => i.conditions.includes(c))
  return { have: forC.filter((i) => i.status === 'have' || i.status === 'na').length, total: forC.length, missing: forC.filter((i) => i.status === 'missing').length }
}

export default function Clothing() {
  const all = useStore((s) => s.clothing)
  const items = useMemo(() => live(all), [all])
  const [cond, setCond] = useState<CondId | 'all'>('normal')
  const shown = cond === 'all' ? items : items.filter((i) => i.conditions.includes(cond))

  return (
    <>
      <div className="head">
        <div>
          <div className="label">Layers</div>
          <h1>Clothing</h1>
          <p>Pick the conditions to see what you need. Each item counts for every condition it is tagged with.</p>
        </div>
      </div>

      <div className="grid3">
        {(Object.keys(CONDITIONS) as CondId[]).map((c) => {
          const r = readiness(items, c)
          return (
            <button key={c} type="button" className="panel" style={{ textAlign: 'left', cursor: 'pointer', color: 'var(--ink)', background: 'var(--surface)', borderColor: cond === c ? 'var(--accent)' : 'var(--line)' }} onClick={() => setCond(c)} aria-pressed={cond === c}>
              <span className="between" style={{ width: '100%' }}><h3>{CONDITIONS[c].name}</h3><span className="num">{r.have}/{r.total}</span></span>
              <span className="meter" style={{ width: '100%' }} aria-hidden="true"><i style={{ width: `${r.total ? (r.have / r.total) * 100 : 0}%`, background: 'var(--good)' }} /></span>
              <span className="small muted">{CONDITIONS[c].hint}{r.missing ? ` ${r.missing} missing.` : ''}</span>
            </button>
          )
        })}
      </div>

      <section className="panel">
        <div className="between">
          <h2>{cond === 'all' ? 'All clothing' : CONDITIONS[cond].name}</h2>
          <button type="button" className="quiet" onClick={() => setCond(cond === 'all' ? 'normal' : 'all')}>{cond === 'all' ? 'Show by condition' : 'Show all items'}</button>
        </div>
        {(Object.keys(LAYERS) as ClothingItem['layer'][]).map((layer) => {
          const rows = shown.filter((i) => i.layer === layer)
          if (!rows.length) return null
          return (
            <div key={layer} className="stack" style={{ gap: 0 }}>
              <div className="label" style={{ marginTop: 6 }}>{LAYERS[layer]}</div>
              <div className="list">{rows.map((i) => <ClothingRow key={i.id} i={i} />)}</div>
            </div>
          )
        })}
        <AddClothing cond={cond} />
      </section>
    </>
  )
}

function ClothingRow({ i }: { i: ClothingItem }) {
  const [open, setOpen] = useState(false)
  const set = (p: Partial<ClothingItem>) => upsert('clothing', { ...i, ...p })
  const toggle = (c: CondId) => set({ conditions: i.conditions.includes(c) ? i.conditions.filter((x) => x !== c) : [...i.conditions, c] })
  return (
    <div className="item">
      <div>
        <div className="name">{i.name}</div>
        <div className="sub">
          {i.model && <b style={{ color: 'var(--ink)', fontWeight: 500 }}>{i.model} · </b>}
          {i.conditions.map((c) => CONDITIONS[c].name).join(', ')}
          {i.note && ` · ${i.note}`}
        </div>
      </div>
      <div className="controls">
        <StatusSelect id={`cs-${i.id}`} value={i.status} onChange={(status) => set({ status })} />
        <button type="button" className="link" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Done' : 'Edit'}</button>
      </div>
      {open && (
        <div style={{ gridColumn: '1 / -1' }} className="stack">
          <div className="fields">
            <div className="field"><label className="label" htmlFor={`cn-${i.id}`}>Item</label><input id={`cn-${i.id}`} value={i.name} onChange={(e) => set({ name: e.target.value })} /></div>
            <div className="field"><label className="label" htmlFor={`cm-${i.id}`}>Model or brand</label><input id={`cm-${i.id}`} value={i.model} onChange={(e) => set({ model: e.target.value })} placeholder="e.g. Norrøna Lofoten Gore-Tex Pro" /></div>
            <div className="field"><label className="label" htmlFor={`cl-${i.id}`}>Layer</label>
              <select id={`cl-${i.id}`} value={i.layer} onChange={(e) => set({ layer: e.target.value as ClothingItem['layer'] })}>
                {(Object.keys(LAYERS) as ClothingItem['layer'][]).map((l) => <option key={l} value={l}>{LAYERS[l]}</option>)}
              </select>
            </div>
          </div>
          <div className="field"><span className="label">Good for</span>
            <div className="chips">
              {(Object.keys(CONDITIONS) as CondId[]).map((c) => <button type="button" key={c} className="chip" aria-pressed={i.conditions.includes(c)} onClick={() => toggle(c)}>{CONDITIONS[c].name}</button>)}
            </div>
          </div>
          <div className="field"><label className="label" htmlFor={`cno-${i.id}`}>Notes</label><input id={`cno-${i.id}`} value={i.note} onChange={(e) => set({ note: e.target.value })} placeholder="Size, colour, needs re-proofing…" /></div>
          <div className="row"><button type="button" className="danger" style={{ marginLeft: 'auto' }} onClick={() => { remove('clothing', i.id); toast('Item removed') }}>Remove item</button></div>
        </div>
      )}
    </div>
  )
}

function AddClothing({ cond }: { cond: CondId | 'all' }) {
  const [name, setName] = useState('')
  const [layer, setLayer] = useState<ClothingItem['layer']>('mid')
  return (
    <form
      className="row"
      onSubmit={(e) => {
        e.preventDefault()
        if (!name.trim()) return
        upsert('clothing', { id: newId('c'), updatedAt: 0, name: name.trim(), layer, model: '', status: 'have', conditions: cond === 'all' ? ['normal'] : [cond], note: '' })
        setName('')
        toast('Item added')
      }}
    >
      <input id="add-clothing" aria-label="New clothing item" placeholder="Add a clothing item" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: '1 1 220px' }} />
      <select id="add-clothing-layer" aria-label="Layer" value={layer} onChange={(e) => setLayer(e.target.value as ClothingItem['layer'])} style={{ width: 'auto' }}>
        {(Object.keys(LAYERS) as ClothingItem['layer'][]).map((l) => <option key={l} value={l}>{LAYERS[l]}</option>)}
      </select>
      <button type="submit">Add</button>
    </form>
  )
}
