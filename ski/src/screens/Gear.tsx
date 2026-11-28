import { useMemo, useState } from 'react'
import { Seg, STATUS, StatusSelect, toast } from '../components/ui'
import { live, newId, remove, upsert, useStore } from '../lib/store'
import { ensurePicks } from '../lib/research'
import type { Discipline, GearItem, Status } from '../lib/types'

export const DISCIPLINES: Record<Discipline | 'shared', string> = {
  allmountain: 'All mountain & freeride',
  park: 'Park',
  touring: 'Touring',
  shared: 'For every kind',
}

/** Ready = owned or not needed. Every item on the list counts toward the total. */
export function coverage(items: GearItem[]) {
  const have = items.filter((g) => g.status === 'have' || g.status === 'na').length
  return { have, total: items.length }
}

export default function Gear() {
  const all = useStore((s) => s.gear)
  const gear = useMemo(() => live(all), [all])
  const [tab, setTab] = useState<Discipline | 'shared'>('allmountain')
  const shown = gear.filter((g) => g.discipline === tab)

  return (
    <>
      <div className="head">
        <div>
          <div className="label">Equipment</div>
          <h1>Gear</h1>
          <p>What you own and what you still need, for each kind of skiing. Mark each item, add the model, and the trips page will warn you about missing essentials.</p>
        </div>
      </div>

      <div className="grid3">
        {(['allmountain', 'park', 'touring', 'shared'] as (Discipline | 'shared')[]).map((d) => {
          const c = coverage(gear.filter((g) => g.discipline === d))
          const missing = gear.filter((g) => g.discipline === d && g.essential && g.status === 'missing').length
          const unknown = gear.filter((g) => g.discipline === d && g.status === 'unknown').length
          return (
            <button key={d} type="button" className="panel quiet" style={{ textAlign: 'left', cursor: 'pointer', color: 'var(--ink)', background: 'var(--surface)', borderColor: tab === d ? 'var(--accent)' : 'var(--line)' }} onClick={() => setTab(d)}>
              <span className="between" style={{ width: '100%' }}>
                <h3>{DISCIPLINES[d]}</h3>
                <span className="num">{c.have}/{c.total}</span>
              </span>
              <span className="meter" aria-hidden="true" style={{ width: '100%' }}>
                <i style={{ width: `${c.total ? (c.have / c.total) * 100 : 0}%`, background: 'var(--good)' }} />
              </span>
              <span className="small muted">
                Items ready{missing ? ` · ${missing} essential${missing === 1 ? '' : 's'} missing` : ''}{unknown ? ` · ${unknown} not checked` : ''}
              </span>
            </button>
          )
        })}
      </div>

      <section className="panel">
        <div className="between">
          <Seg label="Show" value={tab} onChange={setTab} options={DISCIPLINES} />
          <a className="small" href="#shop">Shopping list →</a>
        </div>
        {shown.length ? (
          <div className="list">
            {shown.map((g) => <GearRow key={g.id} g={g} showDiscipline={false} />)}
          </div>
        ) : (
          <div className="empty"><h3>No items in this list</h3><p>Add one below.</p></div>
        )}
        <AddGear discipline={tab} />
      </section>
    </>
  )
}

function GearRow({ g, showDiscipline }: { g: GearItem; showDiscipline: boolean }) {
  const [open, setOpen] = useState(false)
  const set = (p: Partial<GearItem>) => upsert('gear', { ...g, ...p })
  return (
    <div className="item">
      <div>
        <div className="name">
          {g.slot}
          {g.essential && <span className="ess">Essential</span>}
        </div>
        {(g.model || g.note || showDiscipline) && (
          <div className="sub">
            {showDiscipline && <>{DISCIPLINES[g.discipline]} · </>}
            {g.model && <b style={{ color: 'var(--ink)', fontWeight: 500 }}>{g.model}</b>}
            {g.model && g.note && ' · '}
            {g.note}
          </div>
        )}
      </div>
      <div className="controls">
        <StatusSelect id={`st-${g.id}`} value={g.status} onChange={(status) => set({ status })} />
        <button type="button" className="link" onClick={() => setOpen(!open)} aria-expanded={open}>{open ? 'Done' : 'Edit'}</button>
      </div>
      {open && (
        <div style={{ gridColumn: '1 / -1' }} className="stack">
          <div className="fields">
            <div className="field"><label className="label" htmlFor={`m-${g.id}`}>Model or brand</label><input id={`m-${g.id}`} value={g.model} onChange={(e) => set({ model: e.target.value })} placeholder="e.g. Mammut Barryvox S" /></div>
            <div className="field"><label className="label" htmlFor={`s-${g.id}`}>Item</label><input id={`s-${g.id}`} value={g.slot} onChange={(e) => set({ slot: e.target.value })} /></div>
          </div>
          <div className="field"><label className="label" htmlFor={`n-${g.id}`}>Notes (size, age, where to buy, price)</label><textarea id={`n-${g.id}`} value={g.note} onChange={(e) => set({ note: e.target.value })} /></div>
          <div className="row">
            <label className="row small"><input type="checkbox" style={{ width: 'auto' }} checked={g.essential} onChange={(e) => set({ essential: e.target.checked })} /> Essential for this kind of skiing</label>
            <button type="button" className="danger" style={{ marginLeft: 'auto' }} onClick={() => { remove('gear', g.id); toast('Item removed') }}>Remove item</button>
          </div>
        </div>
      )}
    </div>
  )
}

function AddGear({ discipline }: { discipline: Discipline | 'shared' }) {
  const [slot, setSlot] = useState('')
  const [status, setStatus] = useState<Status>('have')
  return (
    <form
      className="row"
      onSubmit={(e) => {
        e.preventDefault()
        if (!slot.trim()) return
        upsert('gear', { id: newId('g'), updatedAt: 0, discipline, slot: slot.trim(), model: '', status, essential: false, note: '' })
        setSlot('')
        void ensurePicks(slot.trim(), DISCIPLINES[discipline]).catch(() => null) // picks ready when it lands on the shopping list
        toast('Item added')
      }}
    >
      <input id={`add-${discipline}`} aria-label="New item" placeholder={`Add an item to ${DISCIPLINES[discipline].toLowerCase()}`} value={slot} onChange={(e) => setSlot(e.target.value)} style={{ flex: '1 1 220px' }} />
      <select id={`add-st-${discipline}`} aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value as Status)} style={{ width: 'auto' }}>
        {(Object.keys(STATUS) as Status[]).map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}
      </select>
      <button type="submit">Add</button>
    </form>
  )
}
