import { useEffect, useState } from 'react'
import { FRIENDS, PLACES, type PlaceId } from '../data/content'
import { Buddy, Friend, Pic } from '../components/Characters'
import { Scene } from '../components/Scenes'
import { Bubble, TopBar } from '../components/ui'
import { markVisited, personalize, placeProgress, useStore, type Kid } from '../lib/store'
import { speak } from '../lib/speech'
import { sfx } from '../lib/sfx'
import { fit, useScreen } from '../lib/useScreen'

export function PlaceScreen({
  kid,
  placeId,
  onBack,
  onPlay,
  onAchievements,
}: {
  kid: Kid
  placeId: PlaceId
  onBack: () => void
  onPlay: (activityId: string) => void
  onAchievements: (ids: string[]) => void
}) {
  const { family } = useStore()
  const place = PLACES.find((p) => p.id === placeId)!
  const friend = FRIENDS[place.friend]
  const welcome = personalize(place.welcome, family)
  const [talking, setTalking] = useState(true)
  const prog = placeProgress(kid, placeId)
  const scr = useScreen()

  useEffect(() => {
    const newly = markVisited(kid.id, placeId)
    if (newly.length) onAchievements(newly)
    setTalking(true)
    void speak(welcome, friend.voice).then(() => setTalking(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeId])

  return (
    <div className="screen">
      <Scene place={placeId} />
      <TopBar onBack={onBack} stars={kid.stars} title={place.name} />
      <div className="place-stage">
        <div className="place-cast">
          <div className="cast-friend">
            <Friend id={place.friend} size={scr.portrait ? fit(scr, 0.42, 130, 320) : 230} talking={talking} />
          </div>
          <Bubble who={`${friend.name} ${friend.what}`} text={welcome} />
          <div className="cast-buddy">
            <Buddy id={kid.buddy} size={scr.portrait ? fit(scr, 0.32, 100, 240) : 170} outfit={kid.outfit} />
          </div>
        </div>
        <div className="activity-grid">
          {place.activities.map((a, i) => {
            const done = kid.done.includes(a.id)
            return (
              <button
                key={a.id}
                className={`activity-card ${done ? 'done' : ''}`}
                style={{ animationDelay: `${i * 0.08}s` }}
                onClick={() => {
                  sfx.tap()
                  onPlay(a.id)
                }}
              >
                <span className="activity-emoji"><Pic v={a.picture} /></span>
                <span className="activity-kind">
                  {a.kind === 'count' ? '🔢 Compter' : a.kind === 'repeat' ? '🦜 Répéter' : a.kind === 'choose' ? '🤔 Choisir' : '🗣️ Dire'}
                </span>
                {done && <span className="activity-check">✅</span>}
              </button>
            )
          })}
        </div>
        {prog.complete && (
          <div className="place-badge">
            {place.badge.emoji} Badge gagné : <strong>{place.badge.name}</strong>
          </div>
        )}
      </div>
    </div>
  )
}
