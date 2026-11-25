// Voice picker for the parents' corner: searches the ElevenLabs voice library
// for French voices, and adds a chosen library voice to the account.

const API = 'https://api.elevenlabs.io'

type Shared = {
  public_owner_id: string
  voice_id: string
  name: string
  gender?: string
  age?: string
  accent?: string
  language?: string
  description?: string
  descriptive?: string
  preview_url?: string
}

function guard(request: Request) {
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')
  return !(referer && host && new URL(referer).host !== host)
}

/** GET /api/voices?gender=male|female&q=enfant → library voices that speak French. */
export async function GET(request: Request): Promise<Response> {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) return Response.json({ error: 'ELEVENLABS_API_KEY manquante sur Vercel' }, { status: 503 })
  if (!guard(request)) return new Response('Forbidden', { status: 403 })
  const url = new URL(request.url)
  const gender = url.searchParams.get('gender') ?? ''
  const q = (url.searchParams.get('q') ?? '').slice(0, 60)

  const searches = q ? [q] : ['enfant', 'child', 'kid', '']
  const seen = new Map<string, Shared>()
  for (const search of searches) {
    const p = new URLSearchParams({ page_size: '30', language: 'fr' })
    if (gender) p.set('gender', gender)
    if (search) p.set('search', search)
    try {
      const r = await fetch(`${API}/v1/shared-voices?${p}`, { headers: { 'xi-api-key': key } })
      if (!r.ok) continue
      const data = (await r.json()) as { voices?: Shared[] }
      for (const v of data.voices ?? []) if (!seen.has(v.voice_id)) seen.set(v.voice_id, v)
    } catch {
      /* try the next search */
    }
    if (seen.size >= 40) break
  }
  const voices = [...seen.values()].slice(0, 40).map((v) => ({
    id: v.voice_id,
    owner: v.public_owner_id,
    name: v.name,
    info: [v.gender, v.age, v.accent, v.descriptive].filter(Boolean).join(' · '),
    description: (v.description ?? '').slice(0, 160),
    preview: v.preview_url,
  }))
  return Response.json({ voices })
}

/** POST /api/voices {id, owner, name} → adds a library voice to the account, returns its voice id. */
export async function POST(request: Request): Promise<Response> {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) return Response.json({ error: 'ELEVENLABS_API_KEY manquante sur Vercel' }, { status: 503 })
  if (!guard(request)) return new Response('Forbidden', { status: 403 })
  const { id, owner, name } = (await request.json()) as { id?: string; owner?: string; name?: string }
  const ok = /^[A-Za-z0-9]{10,80}$/
  if (!id || !owner || !ok.test(id) || !ok.test(owner)) return Response.json({ error: 'bad voice' }, { status: 400 })
  const r = await fetch(`${API}/v1/voices/add/${owner}/${id}`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json' },
    body: JSON.stringify({ new_name: `Pépette – ${(name ?? 'voix').slice(0, 40)}` }),
  })
  if (r.ok) {
    const data = (await r.json()) as { voice_id?: string }
    return Response.json({ id: data.voice_id ?? id })
  }
  // Already in the account (or not addable): the original id usually still works.
  return Response.json({ id, note: `add returned ${r.status}` })
}
