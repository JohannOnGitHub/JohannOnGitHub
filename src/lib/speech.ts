// Voice engine: French text-to-speech + speech recognition with
// age-aware, forgiving matching (a 3-year-old's "mamotte" is a marmotte!).

type Rec = {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  continuous: boolean
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
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

// ---------- Text to speech ----------

let frVoice: SpeechSynthesisVoice | null = null
function pickVoice() {
  if (!canSpeak) return
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith('fr'))
  // Prefer France French and nicer-sounding voices when available.
  const score = (v: SpeechSynthesisVoice) =>
    (v.lang.toLowerCase() === 'fr-fr' ? 4 : 0) +
    (/premium|enhanced|natural|neural|google|amélie|amelie|thomas|audrey|marie/i.test(v.name) ? 2 : 0) +
    (v.localService ? 1 : 0)
  frVoice = voices.sort((a, b) => score(b) - score(a))[0] ?? null
}
if (canSpeak) {
  pickVoice()
  speechSynthesis.onvoiceschanged = pickVoice
}

export type VoiceStyle = { pitch: number; rate: number }

export function speak(text: string, style: VoiceStyle = { pitch: 1.1, rate: 0.9 }): Promise<void> {
  return new Promise((resolve) => {
    if (!canSpeak) return resolve()
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text.replace(/[«»]/g, ''))
    u.lang = 'fr-FR'
    if (frVoice) u.voice = frVoice
    u.pitch = style.pitch
    u.rate = style.rate
    let done = false
    const finish = () => {
      if (!done) {
        done = true
        resolve()
      }
    }
    u.onend = finish
    u.onerror = finish
    // Safety net: some browsers never fire onend.
    setTimeout(finish, 1500 + text.length * 110)
    speechSynthesis.speak(u)
  })
}

export function stopSpeaking() {
  if (canSpeak) speechSynthesis.cancel()
}

// ---------- Speech recognition ----------

let current: Rec | null = null

/** Listen once; resolves with every transcript alternative heard ([] if nothing). */
export function listen(timeoutMs = 7000): Promise<string[]> {
  return new Promise((resolve) => {
    if (!RecCtor) return resolve([])
    stopSpeaking()
    current?.abort()
    const rec = new RecCtor()
    current = rec
    rec.lang = 'fr-FR'
    rec.interimResults = false
    rec.continuous = false
    rec.maxAlternatives = 5
    const heard: string[] = []
    let settled = false
    const settle = () => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      if (current === rec) current = null
      resolve(heard)
    }
    rec.onresult = (e) => {
      for (let i = 0; i < e.results.length; i++) {
        const r = e.results[i]
        for (let j = 0; j < r.length; j++) heard.push(r[j].transcript)
      }
    }
    rec.onerror = () => settle()
    rec.onend = () => settle()
    const timer = setTimeout(() => {
      try {
        rec.stop()
      } catch {
        /* ignore */
      }
      setTimeout(settle, 600)
    }, timeoutMs)
    try {
      rec.start()
    } catch {
      settle()
    }
  })
}

export function stopListening() {
  current?.abort()
  current = null
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
        for (const w of ht) best = Math.max(best, similarity(w, at[0] ?? an))
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
  if (age <= 4) return 0.6
  if (age <= 6) return 0.7
  return 0.8
}
