import { useEffect, useState } from 'react'
import { createFamily, joinFamily, leaveFamily, onSync, syncAvailable, syncNow, type SyncStatus } from '../lib/sync'

/** Parents' corner: share the children's progress between phones with a family code. */
export function FamilySync() {
  const [s, setS] = useState<SyncStatus | null>(null)
  const [input, setInput] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    const off = onSync(setS)
    return () => {
      off()
    }
  }, [])

  if (!syncAvailable) return <p className="muted">La progression est enregistrée sur ce téléphone. (Partage non configuré.)</p>
  if (!s) return null

  if (s.code)
    return (
      <div className="family-sync">
        <p>
          ✅ Ce téléphone est relié à la famille. Les étoiles, autocollants et trophées sont partagés avec les autres téléphones qui ont le même code.
        </p>
        <div className="family-code">{s.code}</div>
        <p className="muted">
          Sur l’autre téléphone : ouvrez l’application → Coin des parents → « J’ai déjà un code », et tapez ce code. Gardez-le pour vous : il donne
          accès à la progression des enfants.
        </p>
        <div className="row">
          <button
            className="btn"
            onClick={() => {
              void navigator.clipboard?.writeText(s.code!).then(() => setMsg('Code copié ✅'))
            }}
          >
            📋 Copier le code
          </button>
          <button className="btn" disabled={busy} onClick={() => void syncNow()}>
            🔄 Synchroniser
          </button>
        </div>
        <p className="muted">
          {s.state === 'syncing'
            ? '⏳ Synchronisation…'
            : s.state === 'error'
              ? `⚠️ Pas de connexion pour l’instant (${s.message ?? 'erreur'}). Ce sera réessayé.`
              : s.lastSync
                ? `Dernière synchronisation : ${new Date(s.lastSync).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
                : ''}
        </p>
        {msg && <p className="voice-msg">{msg}</p>}
        <button
          className="btn ghost"
          onClick={() => {
            if (confirm('Ne plus partager la progression sur ce téléphone ? (Rien n’est effacé.)')) leaveFamily()
          }}
        >
          Ne plus partager sur ce téléphone
        </button>
      </div>
    )

  return (
    <div className="family-sync">
      <p className="muted">
        Pour que les enfants retrouvent leurs étoiles et autocollants sur plusieurs téléphones (le vôtre et celui de votre conjoint·e), reliez-les
        avec un code famille.
      </p>
      <button
        className="btn primary"
        disabled={busy}
        onClick={async () => {
          setBusy(true)
          await createFamily()
          setBusy(false)
        }}
      >
        ☁️ Créer un code famille (premier téléphone)
      </button>
      <div className="label">J’ai déjà un code (autre téléphone)</div>
      <div className="row">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="K7PX-M3QD-T9WB-2FHR" autoCapitalize="characters" />
        <button
          className="btn primary small"
          disabled={busy || input.trim().length < 16}
          onClick={async () => {
            setBusy(true)
            const r = await joinFamily(input)
            setMsg(r.ok ? '✅ Relié ! Les profils de la famille sont arrivés.' : r.message ?? 'Erreur')
            setBusy(false)
          }}
        >
          Relier
        </button>
      </div>
      {msg && <p className="voice-msg">{msg}</p>}
    </div>
  )
}
