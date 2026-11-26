import { PLACES } from '../data/content'
import { TopBar } from '../components/ui'
import { removeKid, setFamily, updateKid, useStore } from '../lib/store'
import { canListen, canSpeak, speak } from '../lib/speech'
import { VoicePicker } from './VoicePicker'
import { FamilySync } from './FamilySync'

export function Parent({ onBack }: { onBack: () => void }) {
  const { family, kids } = useStore()

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
        </section>

        <section className="panel">
          <h3>🎙️ Les voix des personnages</h3>
          <VoicePicker />
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
              <input
                className="spoken-input"
                value={k.spoken ?? ''}
                placeholder={`Se prononce… (ex. ${k.name === 'Mathis' ? 'Matisse' : k.name})`}
                onChange={(e) => updateKid(k.id, { spoken: e.target.value })}
              />
              <button className="btn" onClick={() => void speak(`Bravo ${k.name} !`, { id: k.buddy === 'rocco' ? 'boy' : 'girl' })}>
                🔊
              </button>
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
          <h3>☁️ Partager entre téléphones</h3>
          <FamilySync />
        </section>
      </div>
    </div>
  )
}
