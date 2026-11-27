import { useState } from 'react'
import { fmtDate, toast } from '../components/ui'
import { newId, upsert } from '../lib/store'
import type { Injury, Profile } from '../lib/types'

const STATUS: Record<Injury['status'], string> = { recovering: 'Recovering', ongoing: 'Ongoing', healed: 'Healed' }
const BODY = ['Knee', 'Shoulder', 'Wrist', 'Hand / thumb', 'Ankle', 'Back', 'Neck', 'Head / concussion', 'Hip', 'Ribs', 'Collarbone', 'Other']

export function InjuriesSection({ p }: { p: Profile }) {
  const list = [...(p.injuries ?? [])].sort((a, b) => b.date.localeCompare(a.date))
  const [editing, setEditing] = useState<string | null>(null)
  const save = (inj: Injury) => upsert('profile', { ...p, injuries: [...(p.injuries ?? []).filter((x) => x.id !== inj.id), inj] })
  const del = (id: string) => upsert('profile', { ...p, injuries: (p.injuries ?? []).filter((x) => x.id !== id) })
  const active = list.filter((i) => i.status !== 'healed')
  return (
    <div className="stack" style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
      <div className="between">
        <h3>Injury history</h3>
        <button type="button" className="link" onClick={() => setEditing('new')}>Add injury</button>
      </div>
      {active.length > 0 && (
        <div className="warn">Still {active.length === 1 ? 'healing' : 'affected'}: {active.map((i) => `${i.what || i.body} (${STATUS[i.status].toLowerCase()})`).join(', ')}. Take it into account when you plan jumps and big days.</div>
      )}
      {editing === 'new' && <InjuryForm onSave={(i) => { save(i); setEditing(null); toast('Injury added') }} onCancel={() => setEditing(null)} />}
      {list.length ? (
        <div className="list">
          {list.map((i) =>
            editing === i.id ? (
              <InjuryForm key={i.id} initial={i} onSave={(x) => { save(x); setEditing(null); toast('Saved') }} onCancel={() => setEditing(null)} onDelete={() => { del(i.id); setEditing(null); toast('Injury removed') }} />
            ) : (
              <div key={i.id} className="item">
                <div>
                  <div className="name">{i.what || i.body}<span className={`kind inj-${i.status}`}>{STATUS[i.status]}</span></div>
                  <div className="sub">{[i.body, i.where, i.date && fmtDate(i.date, { month: 'short', year: 'numeric' })].filter(Boolean).join(' · ')}{i.notes && ` · ${i.notes}`}</div>
                </div>
                <button type="button" className="link" onClick={() => setEditing(i.id)}>Edit</button>
              </div>
            ),
          )}
        </div>
      ) : editing !== 'new' && <p className="small muted">No injuries recorded. Add past injuries so you remember what to protect and when they happened.</p>}
    </div>
  )
}

function InjuryForm({ initial, onSave, onCancel, onDelete }: { initial?: Injury; onSave: (i: Injury) => void; onCancel: () => void; onDelete?: () => void }) {
  const [f, setF] = useState<Injury>(initial ?? { id: newId('inj'), date: '', what: '', body: 'Knee', where: '', status: 'recovering', notes: '' })
  const set = (x: Partial<Injury>) => setF({ ...f, ...x })
  const k = f.id
  return (
    <form className="stack" style={{ background: 'var(--sunken)', borderRadius: 8, padding: 12, margin: '6px 0' }}
      onSubmit={(e) => { e.preventDefault(); if (!f.what.trim() && !f.body) return; onSave({ ...f, what: f.what.trim(), where: f.where.trim(), notes: f.notes.trim() }) }}>
      <div className="fields">
        <div className="field"><label className="label" htmlFor={`i-what-${k}`}>Injury</label><input id={`i-what-${k}`} value={f.what} onChange={(e) => set({ what: e.target.value })} placeholder="e.g. Sprained MCL" /></div>
        <div className="field"><label className="label" htmlFor={`i-body-${k}`}>Body part</label>
          <select id={`i-body-${k}`} value={f.body} onChange={(e) => set({ body: e.target.value })}>{BODY.map((b) => <option key={b}>{b}</option>)}</select>
        </div>
        <div className="field"><label className="label" htmlFor={`i-date-${k}`}>When</label><input id={`i-date-${k}`} type="date" value={f.date} onChange={(e) => set({ date: e.target.value })} /></div>
      </div>
      <div className="fields">
        <div className="field"><label className="label" htmlFor={`i-where-${k}`}>Where</label><input id={`i-where-${k}`} list="resort-names" value={f.where} onChange={(e) => set({ where: e.target.value })} placeholder="Resort or place" /></div>
        <div className="field"><label className="label" htmlFor={`i-status-${k}`}>Status</label>
          <select id={`i-status-${k}`} value={f.status} onChange={(e) => set({ status: e.target.value as Injury['status'] })}>{(Object.keys(STATUS) as Injury['status'][]).map((s) => <option key={s} value={s}>{STATUS[s]}</option>)}</select>
        </div>
      </div>
      <div className="field"><label className="label" htmlFor={`i-notes-${k}`}>Notes</label><textarea id={`i-notes-${k}`} value={f.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="How it happened, treatment, brace or protection to use, time off snow" /></div>
      <div className="row">
        <button type="submit">Save</button>
        <button type="button" className="quiet" onClick={onCancel}>Cancel</button>
        {onDelete && <button type="button" className="danger" style={{ marginLeft: 'auto' }} onClick={onDelete}>Remove</button>}
      </div>
    </form>
  )
}
