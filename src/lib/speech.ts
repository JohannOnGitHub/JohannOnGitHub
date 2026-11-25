import { music } from './music'
import { ac } from './sfx'

// Voice engine:
// - Speaking: natural ElevenLabs voices through our /api/tts function (cached),
//   falling back to the device's French voice if that isn't available.
// - Listening: patient speech recognition that keeps listening while a child
//   thinks, stops as soon as the right answer is heard, and is forgiving.

type Alt = { transcript: string }
type Rec = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<Alt> & { isFinal: boolean }> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
}

const RecCtor: (new () => Rec) | undefined =
  typeof window !== 'undefined'
    ? ((window as unknown as Record<string, unknown>).SpeechRecognition as new () => Rec) ??
      ((window as unknown as Record<string, unknown>).webkitSpeechRecognition as new () => Rec)
    : undefined

export const canListen = !!RecCtor
export const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window

// ---------- Voices ----------

/** Which natural voice a character uses. */
export type VoiceId = 'boy' | 'girl' | 'woman' | 'man'
export type VoiceStyle = { id: VoiceId; rate?: number }

// Device fallback: pick a male or a female French voice, no robotic pitch tricks.
const MALE = /thomas|nicolas|henri|daniel|paul|jacques|male|homme|guillaume|antoine|remy|rémy|mathieu/i
const FEMALE = /audrey|aurélie|aurelie|amélie|amelie|marie|virginie|julie|denise|eloise|élise|elise|female|femme|celine|céline|google français/i
let deviceVoices: SpeechSynthesisVoice[] = []
function loadDeviceVoices() {
  if (!canSpeak) return
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang.toLowerCase() === 'fr-fr' ? 4 : 0) + (/premium|enhanced|amélior|natural|neural/i.test(v.name) ? 3 : 0) + (v.localService ? 1 : 0)
  deviceVoices = speechSynthesis
    .getVoices()
    .filter((v) => v.lang.toLowerCase().startsWith('fr'))
    .sort((a, b) => score(b) - score(a))
}
if (canSpeak) {
  loadDeviceVoices()
  speechSynthesis.onvoiceschanged = loadDeviceVoices
}
function deviceVoiceFor(id: VoiceId) {
  const wantMale = id === 'boy' || id === 'man'
  return deviceVoices.find((v) => (wantMale ? MALE : FEMALE).test(v.name)) ?? deviceVoices[0] ?? null
}

// ---------- Natural voices (ElevenLabs via /api/tts) ----------

let cloud: 'unknown' | 'on' | 'off' = 'unknown'
/** Voices chosen by the parents (ElevenLabs voice ids), per role. */
let chosen: Partial<Record<VoiceId, string>> = {}
export function setVoiceIds(v: Partial<Record<VoiceId, string>>) {
  const changed = JSON.stringify(v) !== JSON.stringify(chosen)
  chosen = { ...v }
  if (changed && cloud === 'off') cloud = 'unknown' // a voice was just picked: try again
}
const cache = new Map<string, Promise<AudioBuffer | null>>()
const noVoice = new Set<VoiceId>()
let current: { stop: () => void } | null = null

function clean(text: string) {
  return text.replace(/[«»]/g, '').replace(/\s+/g, ' ').trim()
}

function fetchVoice(text: string, id: VoiceId): Promise<AudioBuffer | null> {
  const vid = chosen[id] ?? ''
  const key = `${vid || id}|${text}`
  let p = cache.get(key)
  if (!p) {
    p = (async () => {
      if (cloud === 'off' || (!vid && noVoice.has(id))) return null
      const c = ac()
      if (!c) return null
      try {
        const r = await fetch(`/api/tts?v=${id}${vid ? `&id=${vid}` : ''}&t=${encodeURIComponent(text)}`)
        if (r.status === 503 || r.status === 404) {
          // No key on the server, or no voice chosen for this role: use the device voice.
          if (!vid) noVoice.add(id)
          if (r.status === 404 || vid) cloud = 'off'
          return null
        }
        if (!r.ok) return null
        cloud = 'on'
        const buf = await r.arrayBuffer()
        return await c.decodeAudioData(buf)
      } catch {
        return null
      }
    })()
    cache.set(key, p)
    p.then((b) => {
      if (!b) cache.delete(key)
    })
  }
  return p
}

/** Parents' corner: hear a voice id say a sample sentence. Returns an error message, or null. */
export async function tryVoice(voiceId: string, text: string): Promise<string | null> {
  const c = ac()
  if (!c) return 'Audio indisponible'
  try {
    const r = await fetch(`/api/tts?id=${voiceId}&t=${encodeURIComponent(text)}`)
    if (!r.ok) return r.status === 503 ? 'Clé ElevenLabs manquante sur Vercel.' : `Erreur ${r.status} : ${(await r.text()).slice(0, 160)}`
    const b = await c.decodeAudioData(await r.arrayBuffer())
    stopSpeaking()
    await playBuffer(b)
    return null
  } catch (e) {
    return (e as Error).message
  }
}

/** Start downloading lines that will be spoken soon, so there's no wait. */
export function preload(lines: [string, VoiceStyle][]) {
  if (cloud === 'off') return
  for (const [t, v] of lines) void fetchVoice(clean(t), v.id)
}

function playBuffer(b: AudioBuffer, rate = 1): Promise<void> {
  return new Promise((resolve) => {
    const c = ac()
    if (!c) return resolve()
    const src = c.createBufferSource()
    src.buffer = b
    src.playbackRate.value = rate
    src.connect(c.destination)
    let done = false
    const finish = () => {
      if (done) return
      done = true
      if (current?.stop === stop) current = null
      resolve()
    }
    const stop = () => {
      try {
        src.stop()
      } catch {
        /* already stopped */
      }
      finish()
    }
    src.onended = finish
    current = { stop }
    src.start()
  })
}

function speakDevice(text: string, style: VoiceStyle): Promise<void> {
  return new Promise((resolve) => {
    if (!canSpeak) return resolve()
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = 'fr-FR'
    const v = deviceVoiceFor(style.id)
    if (v) u.voice = v
    u.rate = style.rate ?? 0.95
    u.pitch = 1
    let done = false
    const finish = () => {
      if (done) return
      done = true
      if (current?.stop === stop) current = null
      resolve()
    }
    const stop = () => {
      speechSynthesis.cancel()
      finish()
    }
    u.onend = finish
    u.onerror = finish
    setTimeout(finish, 2000 + text.length * 120) // some browsers never fire onend
    current = { stop }
    speechSynthesis.speak(u)
  })
}

/** Say a line in a character's voice. Resolves when finished (or interrupted). */
export async function speak(text: string, style: VoiceStyle = { id: 'woman' }): Promise<void> {
  const t = clean(text)
  if (!t) return
  stopSpeaking()
  const token = ++speakToken
  music.duck(0.3)
  try {
    const b = await fetchVoice(t, style.id)
    if (token !== speakToken) return // something else started talking meanwhile
    if (b) await playBuffer(b, style.rate ?? 1)
    else await speakDevice(t, style)
  } finally {
    if (token === speakToken) music.duck(1)
  }
}
let speakToken = 0

export function stopSpeaking() {
  speakToken++
  current?.stop()
  current = null
  if (canSpeak) speechSynthesis.cancel()
}

// ---------- Listening ----------

let activeRec: Rec | null = null
let cancelListen: (() => void) | null = null

export type ListenResult = { heard: string[]; matched: boolean; error?: 'not-allowed' }

/**
 * Listen patiently: keeps the microphone open while a child thinks (iPhone
 * stops after short silences, so we quietly restart it), finishes as soon as
 * `isMatch` accepts what was heard, or after `silenceMs` of quiet once the
 * child has spoken, or after `maxMs`.
 */
export function listen(opts: {
  maxMs?: number
  silenceMs?: number
  isMatch?: (heard: string[]) => boolean
  onHeard?: (text: string) => void
}): Promise<ListenResult> {
  const { maxMs = 9000, silenceMs = 1600, isMatch, onHeard } = opts
  return new Promise((resolve) => {
    if (!RecCtor) return resolve({ heard: [], matched: false })
    stopSpeaking()
    cancelListen?.()
    music.duck(0)
    const heard = new Set<string>()
    const t0 = Date.now()
    let lastSpeech = 0
    let finished = false
    let error: ListenResult['error']
    let restarts = 0

    const finish = (matched: boolean, wait = 450) => {
      if (finished) return
      finished = true
      clearInterval(tick)
      const rec = activeRec
      try {
        rec?.stop()
      } catch {
        /* ignore */
      }
      // Give the recognizer a moment to deliver its final words.
      setTimeout(
        () => {
          if (activeRec === rec) {
            try {
              rec?.abort()
            } catch {
              /* ignore */
            }
            activeRec = null
          }
          cancelListen = null
          music.duck(1)
          resolve({ heard: [...heard], matched: matched || (!!isMatch && isMatch([...heard])), error })
        },
        matched ? 0 : wait,
      )
    }
    cancelListen = () => finish(false, 0)

    const start = () => {
      if (finished) return
      const rec = new RecCtor()
      activeRec = rec
      rec.lang = 'fr-FR'
      rec.continuous = true
      rec.interimResults = true
      rec.maxAlternatives = 5
      rec.onresult = (e) => {
        let latest = ''
        for (let i = 0; i < e.results.length; i++) {
          const r = e.results[i]
          for (let j = 0; j < r.length; j++) {
            const tr = r[j].transcript.trim()
            if (tr) heard.add(tr)
            if (j === 0 && tr) latest = tr
          }
        }
        if (latest) {
          lastSpeech = Date.now()
          onHeard?.(latest)
        }
        if (isMatch && isMatch([...heard])) finish(true)
      }
      rec.onerror = (e) => {
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          error = 'not-allowed'
          finish(false, 0)
        }
      }
      rec.onend = () => {
        if (finished || activeRec !== rec) return
        // iPhone ends on short silences: keep listening while there's time left.
        const quietTooLong = lastSpeech && Date.now() - lastSpeech > silenceMs
        if (!quietTooLong && Date.now() - t0 < maxMs - 500 && restarts < 12) {
          restarts++
          setTimeout(start, 120)
        } else finish(false)
      }
      try {
        rec.start()
      } catch {
        finish(false, 0)
      }
    }

    const tick = setInterval(() => {
      const now = Date.now()
      if (lastSpeech && now - lastSpeech > silenceMs) finish(false)
      else if (now - t0 > maxMs) finish(false)
    }, 150)

    start()
  })
}

export function stopListening() {
  cancelListen?.()
}

// ---------- Matching ----------

const NUMBERS: Record<string, string> = {
  '0': 'zero', '1': 'un', '2': 'deux', '3': 'trois', '4': 'quatre', '5': 'cinq',
  '6': 'six', '7': 'sept', '8': 'huit', '9': 'neuf', '10': 'dix', '21': 'vingt et un',
}

export function normalize(s: string): string {
  let t = s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’']/g, ' ')
    .replace(/[^a-z0-9 ]/g, ' ')
  t = t.replace(/\b\d+\b/g, (d) => NUMBERS[d] ?? d)
  return t.replace(/\s+/g, ' ').trim()
}

const FILLER = new Set(['le', 'la', 'les', 'l', 'un', 'une', 'des', 'de', 'du', 'c', 'est', 'ce', 'euh', 'ben', 'alors'])

function tokens(s: string) {
  return normalize(s).split(' ').filter((w) => w && !FILLER.has(w))
}

function lev(a: string, b: string): number {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0]
    dp[0] = i
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j]
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1))
      prev = tmp
    }
  }
  return dp[b.length]
}

/** Rough French phonetic key, so "far" ≈ "phare" and "la vente" ≈ "lavande". */
function phon(word: string): string {
  return word
    .replace(/ph/g, 'f')
    .replace(/qu/g, 'k')
    .replace(/c(?=[eiy])/g, 's')
    .replace(/c/g, 'k')
    .replace(/gu(?=[ei])/g, 'g')
    .replace(/h/g, '')
    .replace(/eau|au/g, 'o')
    .replace(/oi/g, 'wa')
    .replace(/ou/g, 'u')
    .replace(/(ai|ei)(?![nm])/g, 'e')
    .replace(/[ae][nm](?![aeiouy])/g, 'A')
    .replace(/(ai|ei|i|y)[nm](?![aeiouy])/g, 'I')
    .replace(/o[nm](?![aeiouy])/g, 'O')
    .replace(/y/g, 'i')
    .replace(/([a-z])\1+/g, '$1')
    .replace(/(?<=..)(e|es|s|t|d|x|z|ent)$/g, '')
    .replace(/(?<=.)[dt]$/g, '')
}

function similarity(a: string, b: string) {
  if (!a || !b) return 0
  const plain = 1 - lev(a, b) / Math.max(a.length, b.length)
  const pa = phon(a)
  const pb = phon(b)
  const sound = pa && pb ? 1 - lev(pa, pb) / Math.max(pa.length, pb.length) : 0
  return Math.max(plain, sound)
}

/** Best similarity (0..1) between anything heard and any accepted answer. */
export function scoreAnswer(heard: string[], answers: string[]): number {
  let best = 0
  for (const h of heard) {
    const hn = normalize(h)
    const ht = tokens(h)
    for (const a of answers) {
      const an = normalize(a)
      const at = tokens(a)
      if (!an) continue
      if (` ${hn} `.includes(` ${an} `)) return 1
      // Phrase answers: compare whole stripped phrases.
      if (at.length > 1) {
        best = Math.max(best, similarity(ht.join(' '), at.join(' ')))
        // Fraction of target words heard (fuzzy).
        const hit = at.filter((w) => ht.some((x) => similarity(x, w) >= 0.75)).length
        best = Math.max(best, hit / at.length)
      } else {
        const target = at[0] ?? an
        for (const w of ht) {
          best = Math.max(best, similarity(w, target))
          // Same word with another ending: « skier » for « ski », « marmottes » for « marmotte ».
          if (target.length >= 3 && w.length >= 3 && (w.startsWith(target) || (w.length >= 4 && target.startsWith(w))))
            best = Math.max(best, 0.9)
        }
        // Words glued or split by the recognizer ("mar motte").
        best = Math.max(best, similarity(ht.join(''), at[0] ?? an) * 0.95)
      }
    }
  }
  return best
}

/** How forgiving we are, by age. */
export function thresholdForAge(age: number) {
  if (age <= 3) return 0.5
  if (age <= 4) return 0.58
  if (age <= 6) return 0.62
  return 0.72
}

/**
 * iPhone/iPad Safari only lets a page speak after a user gesture.
 * On the first touch we speak a silent utterance to "unlock" the voice.
 */
export function unlockSpeechOnFirstTouch() {
  if (!canSpeak) return
  const unlock = () => {
    loadDeviceVoices()
    const u = new SpeechSynthesisUtterance(' ')
    u.volume = 0
    u.lang = 'fr-FR'
    speechSynthesis.speak(u)
    window.removeEventListener('pointerdown', unlock, true)
    window.removeEventListener('touchend', unlock, true)
  }
  window.addEventListener('pointerdown', unlock, true)
  window.addEventListener('touchend', unlock, true)
}
