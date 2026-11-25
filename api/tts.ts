// Natural voices for the app: turns a line of text into speech with ElevenLabs.
// The API key stays on the server (Vercel env var ELEVENLABS_API_KEY).
// Each line is generated once, then served from Vercel's CDN cache.

// Optional default voices per role (the parents' corner can pick others).
const DEFAULTS: Record<string, string | undefined> = {
  boy: process.env.ELEVENLABS_VOICE_BOY,
  girl: process.env.ELEVENLABS_VOICE_GIRL,
  woman: process.env.ELEVENLABS_VOICE_WOMAN,
  man: process.env.ELEVENLABS_VOICE_MAN,
}
const MODEL = process.env.ELEVENLABS_MODEL ?? 'eleven_multilingual_v2'
const VOICE_ID = /^[A-Za-z0-9]{10,40}$/

export async function GET(request: Request): Promise<Response> {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) return new Response('Voices not configured', { status: 503 })

  const url = new URL(request.url)
  const id = url.searchParams.get('id') ?? ''
  const role = url.searchParams.get('v') ?? ''
  const text = (url.searchParams.get('t') ?? '').trim()
  const voiceId = VOICE_ID.test(id) ? id : DEFAULTS[role]
  if (!voiceId) return new Response('No voice chosen', { status: 503 })
  if (!text || text.length > 400) return new Response('Bad text', { status: 400 })

  // Only our own pages may use this (keeps other sites from spending the credits).
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  if (referer && host && new URL(referer).host !== host) return new Response('Forbidden', { status: 403 })

  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_96`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35, use_speaker_boost: true },
    }),
  })
  if (!r.ok) return new Response(`Voice error ${r.status}: ${(await r.text()).slice(0, 300)}`, { status: 502 })

  return new Response(r.body, {
    headers: {
      'content-type': 'audio/mpeg',
      'cache-control': 'public, max-age=31536000, immutable',
      'cdn-cache-control': 'public, s-maxage=31536000, immutable',
    },
  })
}
