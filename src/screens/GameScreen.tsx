import { useEffect, useMemo, useRef, useState } from 'react'
import { BUDDIES, FRIENDS, PLACES, type PlaceId } from '../data/content'
import { Buddy, Friend, Pic } from '../components/Characters'
import { Scene } from '../components/Scenes'
import { Bubble, Confetti, HoldButton, TopBar } from '../components/ui'
import { personalize, placeProgress, recordSuccess, useStore, type Kid } from '../lib/store'
import { canListen, listen, scoreAnswer, speak, stopListening, stopSpeaking, thresholdForAge } from '../lib/speech'
import { sfx } from '../lib/sfx'

type Phase = 'telling' | 'ready' | 'listening' | 'success' | 'miss'
const NUM_WORDS = ['un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix']

export function GameScreen({
  kid,
  placeId,
  activityId,
  onBack,
  onNext,
  onAchievements,
}: {
  kid: Kid
  placeId: PlaceId
  activityId: string
  onBack: () => void
  onNext: (activityId: string | null) => void
  onAchievements: (ids: string[]) => void
}) {
  const { family } = useStore()
  const place = PLACES.find((p) => p.id === placeId)!
  const a = place.activities.find((x) => x.id === activityId)!
  const friend = FRIENDS[place.friend]
  const buddy = BUDDIES[kid.buddy]
  const P = (s: string) => personalize(s, family)
  const little = kid.age <= 3

  const [phase, setPhase] = useState<Phase>('telling')
  const [line, setLine] = useState(P(a.fact))
  const [speaker, setSpeaker] = useState<'friend' | 'buddy'>('friend')
  const [tries, setTries] = useState(0)
  const [heard, setHeard] = useState('')
  const [badgeWon, setBadgeWon] = useState(false)
  const [counted, setCounted] = useState(0)
  const alive = useRef(true)

  const answers = useMemo(() => a.answers.map(P), [a, family]) // eslint-disable-line react-hooks/exhaustive-deps

  const say = async (text: string, who: 'friend' | 'buddy' = 'friend') => {
    if (!alive.current) return
    setSpeaker(who)
    setLine(text)
    await speak(text, who === 'friend' ? friend.voice : buddy.voice)
  }

  const intro = async () => {
    setPhase('telling')
    await say(P(a.fact))
    await say(P(a.ask))
    if (little && a.hint) await say(P(a.hint))
    if (alive.current) setPhase('ready')
  }

  useEffect(() => {
    alive.current = true
    setTries(0)
    setHeard('')
    setBadgeWon(false)
    setCounted(0)
    void intro()
    return () => {
      alive.current = false
      stopSpeaking()
      stopListening()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId])

  const succeed = async () => {
    const wasComplete = placeProgress(kid, placeId).complete
    const newly = recordSuccess(kid.id, a.id, tries === 0)
    sfx.win()
    setPhase('success')
    const nowKid = { ...kid, done: kid.done.includes(a.id) ? kid.done : [...kid.done, a.id] }
    const nowComplete = placeProgress(nowKid, placeId).complete
    if (!wasComplete && nowComplete) setBadgeWon(true)
    if (newly.length) onAchievements(newly)
    await say(P(a.cheer))
    await say(`Bravo ${kid.name} ! Tu as gagné un autocollant !`, 'buddy')
    if (!wasComplete && nowComplete) await say(`Et le badge ${place.badge.name} ! Waouh !`, 'buddy')
  }

  const onMic = async () => {
    if (phase === 'listening') return
    sfx.listen()
    setPhase('listening')
    setHeard('')
    const results = await listen(little ? 8000 : 6500)
    if (!alive.current) return
    setHeard(results[0] ?? '')
    const score = scoreAnswer(results, answers)
    if (score >= thresholdForAge(kid.age)) return void succeed()
    const n = tries + 1
    setTries(n)
    sfx.oops()
    setPhase('miss')
    if (results.length === 0) await say('Je n’ai rien entendu… Parle bien fort, comme un lion !')
    else if (n === 1) await say(`Presque ! Essaie encore. ${a.hint ? P(a.hint) : P(a.ask)}`)
    else await say(`Tu y es presque ! ${a.hint ? P(a.hint) : ''} ${family.parent} peut t’aider !`)
    if (alive.current) setPhase('ready')
  }

  const replay = () => {
    stopListening()
    void intro()
  }

  const nextId = useMemo(() => {
    const list = place.activities
    const i = list.findIndex((x) => x.id === a.id)
    const after = [...list.slice(i + 1), ...list.slice(0, i)]
    const done = new Set([...kid.done, a.id])
    return after.find((x) => !done.has(x.id))?.id ?? null
  }, [place, a, kid.done])

  return (
    <div className="screen">
      <Scene place={placeId} />
      <TopBar onBack={onBack} stars={kid.stars} title={place.name} />
      <div className="game">
        <div className="game-cast">
          <Friend id={place.friend} size={150} talking={speaker === 'friend' && phase !== 'listening'} />
          <Bubble who={speaker === 'friend' ? friend.name : buddy.name} text={line} />
          <Buddy id={kid.buddy} size={120} outfit={kid.outfit} talking={speaker === 'buddy'} />
        </div>

        <div className={`game-card ${phase === 'success' ? 'won' : ''}`}>
          {a.kind === 'count' ? (
            <div className="count-row">
              {Array.from({ length: a.count ?? 1 }).map((_, i) => (
                <button
                  key={i}
                  className={`count-item ${i < counted ? 'counted' : ''}`}
                  style={{ animationDelay: `${i * 0.15}s` }}
                  onClick={() => {
                    if (i !== counted) return
                    sfx.pop()
                    setCounted(i + 1)
                    void speak(NUM_WORDS[i], buddy.voice)
                  }}
                >
                  <Pic v={a.picture} />
                  {i < counted && <span className="count-num">{i + 1}</span>}
                </button>
              ))}
            </div>
          ) : a.kind === 'choose' && a.options ? (
            <div className="choose-row">
              {a.options.map((o) => (
                <button key={o.label} className="choose-item" onClick={() => void speak(o.label, buddy.voice)}>
                  <span>{o.emoji}</span>
                  <small>{o.label}</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="big-picture"><Pic v={a.picture} /></div>
          )}
          {a.kind === 'repeat' && phase !== 'success' && <div className="repeat-text">🦜 {P(a.ask).replace(/^[^«]*«\s?|\s?»[^»]*$/g, '')}</div>}
        </div>

        {phase === 'success' ? (
          <div className="reward">
            <Confetti />
            <div className="sticker-reveal">
              <span className="sticker-emoji"><Pic v={a.sticker.emoji} /></span>
              <span>{a.sticker.name}</span>
              <span className="plus-stars">+{tries === 0 ? 3 : 2} ⭐</span>
            </div>
            {badgeWon && (
              <div className="badge-reveal">
                {place.badge.emoji} <strong>{place.badge.name}</strong>
              </div>
            )}
            <div className="row-center">
              {nextId && (
                <button className="big-btn go" onClick={() => onNext(nextId)}>
                  Encore ! ➡️
                </button>
              )}
              <button className="big-btn" onClick={onBack}>
                {nextId ? '🏠 Retour' : '🗺️ La carte'}
              </button>
            </div>
          </div>
        ) : (
          <div className="controls">
            <button className="round-btn big" onClick={replay} aria-label="Réécouter">
              🔊
            </button>
            {canListen ? (
              <button
                className={`mic ${phase === 'listening' ? 'listening' : ''} ${phase === 'ready' ? 'ready' : ''}`}
                onClick={() => void onMic()}
                disabled={phase === 'telling'}
              >
                <span className="mic-icon">🎤</span>
                <span>{phase === 'listening' ? 'Je t’écoute…' : 'À toi !'}</span>
              </button>
            ) : (
              <div className="no-mic">
                🗣️ Dis-le à voix haute !<br />
                <small>{family.parent} valide avec 👍</small>
              </div>
            )}
            <HoldButton ms={canListen ? 1200 : 600} className="parent-ok" onDone={() => void succeed()}>
              👍
              <small>{family.parent}</small>
            </HoldButton>
          </div>
        )}
        {heard && phase !== 'success' && <div className="heard">J’ai entendu : « {heard} »</div>}
      </div>
    </div>
  )
}
