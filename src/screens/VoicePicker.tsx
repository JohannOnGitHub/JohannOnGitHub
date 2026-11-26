import { useState } from 'react'
import { setFamily, useStore } from '../lib/store'
import { tryVoice, type VoiceId } from '../lib/speech'

const ROLES: { id: VoiceId; label: string; gender: 'male' | 'female'; sample: string; q: string }[] = [
  { id: 'boy', label: '🐶 Rocco — voix de garçon', gender: 'male', sample: 'Coucou ! C’est moi, Rocco ! On part à l’aventure dans les montagnes ?', q: 'garçon' },
  { id: 'girl', label: '❄️ Givrine — voix de fille', gender: 'female', sample: 'Coucou ! C’est moi, Givrine, la princesse des neiges ! Tu viens jouer ?', q: 'fille' },
  { id: 'woman', label: '🐿️ Pépette, Cigalou, Gaby — voix de femme', gender: 'female', sample: 'Bienvenue à l’Alpe d’Huez ! Moi, c’est Pépette la marmotte. On joue ?', q: '' },
  { id: 'man', label: '🦌 Gaspard — voix d’homme', gender: 'male', sample: 'Degemer mat ! Je suis Korri le korrigan. Bienvenue en Bretagne !', q: '' },
]

type LibVoice = { id: string; owner: string; name: string; info: string; description: string; preview?: string }

export function VoicePicker() {
  const { family } = useStore()
  const [open, setOpen] = useState<VoiceId | null>(null)
  const [list, setList] = useState<LibVoice[]>([])
  const [q, setQ] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [pasted, setPasted] = useState('')

  const choose = (role: VoiceId, id: string, name: string) => {
    setFamily({ voices: { ...(family.voices ?? {}), [role]: { id, name } } })
    setOpen(null)
    setMsg(`✅ Voix « ${name} » choisie.`)
  }

  const search = async (role: (typeof ROLES)[number], query: string) => {
    setBusy(true)
    setMsg('')
    try {
      const r = await fetch(`/api/voices?gender=${role.gender}&q=${encodeURIComponent(query)}`)
      const data = (await r.json()) as { voices?: LibVoice[]; error?: string }
      if (!r.ok) setMsg(data.error ?? `Erreur ${r.status}`)
      setList(data.voices ?? [])
      if (r.ok && !data.voices?.length) setMsg('Aucune voix trouvée. Essayez un autre mot.')
    } catch {
      setMsg('Recherche impossible (pas de connexion ?)')
    }
    setBusy(false)
  }

  const test = async (id: string, sample: string) => {
    setBusy(true)
    setMsg('⏳ Génération de l’essai…')
    const err = await tryVoice(id, sample)
    setMsg(err ?? '')
    setBusy(false)
  }

  const pick = async (role: VoiceId, v: LibVoice) => {
    setBusy(true)
    try {
      const r = await fetch('/api/voices', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ id: v.id, owner: v.owner, name: v.name }),
      })
      const data = (await r.json()) as { id?: string; error?: string }
      if (data.id) choose(role, data.id, v.name)
      else setMsg(data.error ?? 'Impossible d’ajouter cette voix')
    } catch {
      setMsg('Impossible d’ajouter cette voix')
    }
    setBusy(false)
  }

  return (
    <div className="voice-picker">
      <p className="muted">
        Voix naturelles ElevenLabs. Choisissez une voix pour chaque personnage : « Chercher » montre des voix françaises de la bibliothèque
        ElevenLabs, « Essayer » la fait parler en français. Sans voix choisie, l’application utilise la voix de l’iPhone.
      </p>
      {ROLES.map((role) => {
        const cur = family.voices?.[role.id]
        return (
          <div key={role.id} className="voice-role">
            <div className="voice-role-head">
              <strong>{role.label}</strong>
              <span className="muted">{cur ? `🎙️ ${cur.name}` : 'voix de l’iPhone'}</span>
            </div>
            <div className="row">
              {cur && (
                <button className="btn" disabled={busy} onClick={() => void test(cur.id, role.sample)}>
                  ▶ Écouter
                </button>
              )}
              <button
                className="btn primary small"
                disabled={busy}
                onClick={() => {
                  setOpen(open === role.id ? null : role.id)
                  setQ(role.q)
                  setList([])
                  setPasted('')
                  if (open !== role.id) void search(role, role.q)
                }}
              >
                {open === role.id ? 'Fermer' : cur ? 'Changer' : 'Chercher une voix'}
              </button>
              {cur && (
                <button
                  className="btn ghost"
                  onClick={() => {
                    const v = { ...(family.voices ?? {}) }
                    delete v[role.id]
                    setFamily({ voices: v })
                  }}
                >
                  Retirer
                </button>
              )}
            </div>
            {open === role.id && (
              <div className="voice-search">
                <div className="row">
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ex. enfant, garçon, joyeux…" />
                  <button className="btn" disabled={busy} onClick={() => void search(role, q)}>
                    🔎
                  </button>
                </div>
                {busy && <p className="muted">⏳ …</p>}
                <div className="voice-list">
                  {list.map((v) => (
                    <div key={v.id} className="voice-item">
                      <div>
                        <strong>{v.name}</strong> <span className="muted">{v.info}</span>
                        {v.description && <div className="muted small">{v.description}</div>}
                      </div>
                      <div className="row">
                        <button className="btn" disabled={busy} onClick={() => void test(v.id, role.sample)}>
                          ▶ Essayer
                        </button>
                        <button className="btn primary small" disabled={busy} onClick={() => void pick(role.id, v)}>
                          Choisir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="row">
                  <input value={pasted} onChange={(e) => setPasted(e.target.value.trim())} placeholder="…ou collez l’ID d’une voix ElevenLabs" />
                  <button className="btn" disabled={busy || pasted.length < 10} onClick={() => void test(pasted, role.sample)}>
                    ▶
                  </button>
                  <button className="btn primary small" disabled={pasted.length < 10} onClick={() => choose(role.id, pasted, `ID ${pasted.slice(0, 6)}…`)}>
                    Choisir
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
      {msg && <p className="voice-msg">{msg}</p>}
    </div>
  )
}
