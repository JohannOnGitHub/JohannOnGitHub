import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { PLACES } from '../data/content'
import { TopBar } from '../components/ui'
import { removeKid, setFamily, updateKid, useStore } from '../lib/store'
import { canListen, canSpeak, speak } from '../lib/speech'
import { onSession, sendCode, signOut, syncAvailable, verifyCode } from '../lib/sync'

export function Parent({ onBack }: { onBack: () => void }) {
  const { family, kids } = useStore()
  const [session, setSession] = useState<Session | null>(null)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [sent, setSent] = useState(false)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    const off = onSession(setSession)
    return () => {
      off()
    }
  }, [])

  return (
    <div className="screen parent-screen">
      <TopBar onBack={onBack} title="Coin des parents" />
      <div className="parent-body">
        <section className="panel">
          <h3>🗣️ Voix et micro</h3>
          <p>
            Voix française : {canSpeak ? '✅ disponible' : '❌ non disponible'} — Micro (reconnaissance vocale) :{' '}
            {canListen ? '✅ disponible' : '❌ non disponible sur ce navigateur'}
          </p>
          <p className="muted">
            Fonctionne au mieux dans Chrome (Android, ordinateur) ou Safari (iPad/iPhone, avec Siri activé). Sans micro, l’enfant parle à voix haute
            et vous validez avec le bouton 👍 (appui long). Vous pouvez toujours valider vous-même si le micro ne comprend pas un petit.
          </p>
          <button className="btn" onClick={() => void speak('Bonjour ! Je parle français. On va bien s’amuser !')}>
            🔊 Tester la voix
          </button>
        </section>

        <section className="panel">
          <h3>👨‍👩‍👧‍👦 La famille</h3>
          <div className="row3">
            <label>
              Les enfants vous appellent
              <select value={family.parent} onChange={(e) => setFamily({ parent: e.target.value })}>
                <option>Papa</option>
                <option>Maman</option>
              </select>
            </label>
            <label>
              Grand-parent de Marseille
              <input value={family.mamie} onChange={(e) => setFamily({ mamie: e.target.value })} />
            </label>
            <label>
              Grand-parent de Rennes
              <input value={family.papi} onChange={(e) => setFamily({ papi: e.target.value })} />
            </label>
          </div>
          <label className="check">
            <input type="checkbox" checked={family.unlockAll} onChange={(e) => setFamily({ unlockAll: e.target.checked })} />
            Ouvrir tous les endroits de la carte (sinon : 3 jeux réussis pour ouvrir le suivant)
          </label>
        </section>

        <section className="panel">
          <h3>🧒 Les enfants</h3>
          {kids.map((k) => (
            <div key={k.id} className="kid-row">
              <strong>{k.name}</strong>
              <select value={k.age} onChange={(e) => updateKid(k.id, { age: Number(e.target.value) })}>
                {[2, 3, 4, 5, 6, 7, 8].map((a) => (
                  <option key={a} value={a}>
                    {a} ans
                  </option>
                ))}
              </select>
              <select value={k.buddy} onChange={(e) => updateKid(k.id, { buddy: e.target.value as 'rocco' | 'givrine' })}>
                <option value="rocco">Rocco</option>
                <option value="givrine">Givrine</option>
              </select>
              <span>
                ⭐ {k.stars} · {k.done.length} jeux · {PLACES.filter((p) => p.activities.every((a) => k.done.includes(a.id))).length} badges
              </span>
              <button
                className="btn danger"
                onClick={() => {
                  if (confirm(`Supprimer le profil de ${k.name} et toute sa progression ?`)) removeKid(k.id)
                }}
              >
                Supprimer
              </button>
            </div>
          ))}
          <p className="muted">Le micro est plus indulgent pour les plus petits (selon l’âge).</p>
        </section>

        <section className="panel">
          <h3>☁️ Sauvegarde en ligne</h3>
          {!syncAvailable ? (
            <p className="muted">La progression est enregistrée sur cet appareil. (Sauvegarde en ligne non configurée.)</p>
          ) : session ? (
            <>
              <p>
                ✅ Connecté : <strong>{session.user.email}</strong>. La progression est sauvegardée et partagée entre vos appareils.
              </p>
              <button className="btn" onClick={() => void signOut()}>
                Se déconnecter
              </button>
            </>
          ) : (
            <>
              <p className="muted">Connectez-vous avec votre e-mail pour retrouver la progression sur la tablette, le téléphone, etc.</p>
              {!sent ? (
                <div className="row">
                  <input type="email" placeholder="email@exemple.fr" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <button
                    className="btn primary"
                    onClick={async () => {
                      try {
                        await sendCode(email)
                        setSent(true)
                        setMsg('Code envoyé ! Regardez vos e-mails.')
                      } catch (e) {
                        setMsg((e as Error).message)
                      }
                    }}
                  >
                    Recevoir un code
                  </button>
                </div>
              ) : (
                <div className="row">
                  <input inputMode="numeric" placeholder="Code reçu" value={code} onChange={(e) => setCode(e.target.value)} />
                  <button
                    className="btn primary"
                    onClick={async () => {
                      try {
                        await verifyCode(email, code.trim())
                        setMsg('')
                      } catch (e) {
                        setMsg((e as Error).message)
                      }
                    }}
                  >
                    Valider
                  </button>
                </div>
              )}
              {msg && <p className="muted">{msg}</p>}
            </>
          )}
        </section>
      </div>
    </div>
  )
}
