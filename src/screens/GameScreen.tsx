import { useEffect, useMemo, useRef, useState } from 'react'
import { BUDDIES, FRIENDS, PLACES, type PlaceId } from '../data/content'
import { Buddy, Friend, Pic } from '../components/Characters'
import { Scene } from '../components/Scenes'
import { Bubble, Confetti, HoldButton, TopBar } from '../components/ui'
import { personalize, placeProgress, recordSuccess, useStore, type Kid } from '../lib/store'
import { canListen, listen, preload, scoreAnswer, speak, stopListening, stopSpeaking, thresholdForAge } from '../lib/speech'
import { sfx } from '../lib/sfx'
import { BUDDY, NUM_WORDS, effortLine, missLine as missLineFor } from '../data/lines'
import { fit, useScreen } from '../lib/useScreen'

type Phase = 'telling' | 'ready' | 'listening' | 'success' | 'miss'

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
  const scr = useScreen()
  const friendSize = scr.portrait ? fit(scr, 0.34, 110, 270) : 150
  const buddySize = scr.portrait ? fit(scr, 0.27, 90, 210) : 120

  const [phase, setPhase] = useState<Phase>('telling')
  const [line, setLine] = useState(P(a.fact))
  const [speaker, setSpeaker] = useState<'friend' | 'buddy'>('friend')
  const [tries, setTries] = useState(0)
  const [heard, setHeard] = useState('')
  const [badgeWon, setBadgeWon] = useState(false)
  const [counted, setCounted] = useState(0)
  const alive = useRef(true)

  const answers = useMemo(() => a.answers.map(P), [a, family]) // eslint-disable-line react-hooks/exhaustive-deps

  // Every new sequence (intro, listening, feedback) gets a token; older sequences stop talking.
  const run = useRef(0)
  const voiceOf = (who: 'friend' | 'buddy') => (who === 'friend' ? friend.voice : buddy.voice)

  const say = async (text: string, who: 'friend' | 'buddy', token: number) => {
    if (!alive.current || token !== run.current) return false
    setSpeaker(who)
    setLine(text)
    await speak(text, voiceOf(who))
    return alive.current && token === run.current
  }

  const introLines = (): [string, 'friend' | 'buddy'][] => {
    const l: [string, 'friend' | 'buddy'][] = [
      [P(a.fact), 'friend'],
      [P(a.ask), 'friend'],
    ]
    if (little && a.hint) l.push([P(a.hint), 'friend'])
    if (a.kind === 'count') l.push([BUDDY.count, 'buddy'])
    if (a.kind === 'choose') l.push([BUDDY.choose, 'buddy'])
    // Explain the microphone to the little ones every time, to the bigger ones for their first games.
    if (little || kid.done.length < 6)
      l.push([canListen ? BUDDY.mic : BUDDY.noMic, 'buddy'])
    return l
  }

  const missLine = (n: number) => missLineFor(a, family, n, little)
  const NOTHING = BUDDY.nothing

  const intro = async () => {
    const my = ++run.current
    stopListening()
    setPhase('telling')
    setHeard('')
    const lines = introLines()
    preload(lines.map(([t, w]) => [t, voiceOf(w)]))
    for (const [t, w] of lines) if (!(await say(t, w, my))) return
    setPhase('ready')
    // Get the feedback lines ready so the answer comes back instantly.
    preload([
      [P(a.cheer), friend.voice],
      [BUDDY.bravo(kid.name), buddy.voice],
      [missLine(1), friend.voice],
      [missLine(2), friend.voice],
      [NOTHING, buddy.voice],
    ])
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
      run.current++
      stopSpeaking()
      stopListening()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activityId])

  const succeed = async (effort = false) => {
    const my = ++run.current
    stopListening()
    stopSpeaking()
    const wasComplete = placeProgress(kid, placeId).complete
    const newly = recordSuccess(kid.id, a.id, tries === 0 && !effort)
    sfx.win()
    setPhase('success')
    const nowKid = { ...kid, done: kid.done.includes(a.id) ? kid.done : [...kid.done, a.id] }
    const nowComplete = placeProgress(nowKid, placeId).complete
    if (!wasComplete && nowComplete) setBadgeWon(true)
    if (newly.length) onAchievements(newly)
    const lines: [string, 'friend' | 'buddy'][] = effort
      ? [
          [effortLine(a, family), 'friend'],
          [BUDDY.effortWin(kid.name), 'buddy'],
        ]
      : [
          [P(a.cheer), 'friend'],
          [BUDDY.bravo(kid.name), 'buddy'],
        ]
    if (!wasComplete && nowComplete) lines.push([BUDDY.badge(place.badge.name), 'buddy'])
    lines.push([nextId ? BUDDY.nextMore : BUDDY.nextMap, 'buddy'])
    for (const [t, w] of lines) if (!(await say(t, w, my))) return
  }

  const onMic = async () => {
    if (phase !== 'ready') return
    const my = ++run.current
    stopSpeaking()
    setPhase('listening')
    setHeard('')
    sfx.listen()
    await new Promise((r) => setTimeout(r, 300)) // don't let the beep reach the microphone
    if (!alive.current || my !== run.current) return
    const thr = thresholdForAge(kid.age)
    const res = await listen({
      maxMs: little ? 10000 : 8000,
      silenceMs: little ? 2000 : 1600,
      isMatch: (h) => scoreAnswer(h, answers) >= thr,
      onHeard: (t) => setHeard(t),
    })
    if (!alive.current || my !== run.current) return
    if (res.matched) return void succeed()
    if (res.error === 'not-allowed') {
      setPhase('miss')
      await say(BUDDY.micDenied(family.parent), 'buddy', my)
      if (my === run.current) setPhase('ready')
      return
    }
    const spoke = res.heard.length > 0
    const n = spoke ? tries + 1 : tries
    setTries(n)
    // Several real attempts: reward the effort rather than frustrate a little one.
    if (spoke && n >= (little ? 3 : 4)) return void succeed(true)
    sfx.oops()
    setPhase('miss')
    await say(spoke ? missLine(n) : NOTHING, spoke ? 'friend' : 'buddy', my)
    if (alive.current && my === run.current) setPhase('ready')
  }

  const replay = () => {
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
          <Friend id={place.friend} size={friendSize} talking={speaker === 'friend' && phase !== 'listening'} />
          <Bubble who={speaker === 'friend' ? friend.name : buddy.name} text={line} voice={speaker === 'friend' ? friend.voice : buddy.voice} />
          <Buddy id={kid.buddy} size={buddySize} outfit={kid.outfit} talking={speaker === 'buddy'} />
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
                onClick={() => (phase === 'listening' ? stopListening() : void onMic())}
                disabled={phase !== 'ready' && phase !== 'listening'}
              >
                <span className="mic-icon">{phase === 'listening' ? '👂' : '🎤'}</span>
                <span>{phase === 'listening' ? 'J’écoute…' : phase === 'ready' ? 'À toi !' : '…'}</span>
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
        {heard && phase !== 'success' && (
          <div className="heard">
            {phase === 'listening' ? 'J’entends' : 'J’ai entendu'} : « {heard} »
          </div>
        )}
      </div>
    </div>
  )
}
