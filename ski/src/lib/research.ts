// Picks for the shopping list. Claude researches the standard items and writes them to the
// "picks" collection. For anything else (an item you added yourself), the page asks Claude
// through the artifact's sample capability and saves the answer, so every item gets picks.
import { getDb } from './artifactDb'

export type Pick = { rank: number; name: string; brand: string; url: string; why: string; sources: string[] }
export type Picks = { id?: string; title: string; note: string; items: Pick[]; articles: { source: string; url: string }[]; updatedAt: number; generated?: 'claude' }

/** Researched categories, matched on the item's name. Order matters: specific before general. */
const KEYS: [RegExp, string][] = [
  [/transceiver|beacon/i, 'transceiver'], [/probe/i, 'probe'], [/shovel/i, 'shovel'], [/airbag/i, 'airbag'],
  [/freeride backpack/i, 'backpack-freeride'], [/touring backpack/i, 'backpack-touring'],
  [/park ski/i, 'park-skis'], [/touring ski|hybrid-binding setup/i, 'touring-skis'],
  [/park binding/i, 'park-bindings'], [/touring binding/i, 'touring-bindings'], [/binding/i, 'bindings'],
  [/park boot/i, 'park-boots'], [/touring boot/i, 'touring-boots'], [/boot bag/i, 'boot-bag'], [/apr[eè]s/i, 'apres-boots'],
  [/^\s*(ski )?boots\b/i, 'boots'], [/^\s*skis\b/i, 'skis'],
  [/back protector/i, 'back-protector'], [/impact short/i, 'impact-shorts'], [/wrist/i, 'wrist-guards'],
  [/climbing skin|^\s*skins/i, 'skins'], [/ski crampon/i, 'ski-crampons'], [/crampons and ice axe|ice axe/i, 'crampons-axe'],
  [/harness|crevasse/i, 'harness'], [/touring pole|adjustable/i, 'touring-poles'], [/\bpoles?\b/i, 'poles'],
  [/headlamp|head ?torch/i, 'headlamp'], [/first aid/i, 'first-aid'], [/repair kit/i, 'repair-kit'], [/bivy|foil blanket/i, 'bivy'],
  [/map|compass|gps/i, 'navigation'], [/helmet/i, 'helmet'], [/low-light|spare goggle lens|goggle lens/i, 'lowlight-lens'], [/goggle/i, 'goggles'],
  [/ski bag/i, 'ski-bag'], [/scraper|brush|iron/i, 'tuning-kit'], [/edge/i, 'edge-tuner'], [/wax/i, 'wax'],
  [/merino.*heavy|heavy.*base/i, 'base-top-heavy'], [/merino.*light|light.*base/i, 'base-top-light'], [/base layer bottom|long johns/i, 'base-bottoms'],
  [/insulated midlayer|down or synthetic/i, 'insulated-midlayer'], [/fleece/i, 'fleece'], [/belay|summit puffy|parka/i, 'belay-puffy'], [/vest/i, 'vest'],
  [/softshell/i, 'softshell'], [/shell jacket/i, 'shell-jacket'], [/shell pants|bibs/i, 'shell-pants'], [/insulated jacket/i, 'insulated-jacket'], [/insulated pants/i, 'insulated-pants'],
  [/liner glove/i, 'liner-gloves'], [/mitten/i, 'mittens'], [/spring glove|thin.*glove/i, 'spring-gloves'], [/glove/i, 'insulated-gloves'],
  [/balaclava/i, 'balaclava'], [/neck gaiter|neck warmer/i, 'neck-gaiter'], [/beanie/i, 'beanie'],
  [/category 4|glacier glass/i, 'glacier-glasses'], [/sunglass/i, 'sunglasses'],
  [/socks?, warm|warm.*sock/i, 'socks-warm'], [/sock/i, 'ski-socks'], [/warmer/i, 'hand-warmers'], [/sunscreen|lip balm|spf/i, 'sunscreen'],
]

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
export const picksKey = (name: string) => KEYS.find(([re]) => re.test(name))?.[1] ?? `ai-${slug(name)}`

type Sample = { json<T>(input: string, opts?: { modelTier?: string }): Promise<T> }
let sampleP: Promise<Sample | null> | null = null
const getSample = () => (sampleP ??= window.claude?.use ? (window.claude.use('sample') as Promise<Sample | null>).catch(() => null) : Promise.resolve(null))

const pending = new Map<string, Promise<Picks | null>>()

/**
 * Make sure picks exist for an item; asks Claude when they don't. Call it only from a click
 * (the first call asks the viewer for consent). Resolves null when Claude can't be reached.
 */
export function ensurePicks(name: string, purpose: string): Promise<Picks | null> {
  const key = picksKey(name)
  const existing = pending.get(key)
  if (existing) return existing
  const p = (async () => {
    const db = await getDb()
    if (db) {
      const snap = await db.collection('picks').doc(key).get()
      if (snap.exists) return snap.data() as Picks
    }
    const sample = await getSample()
    if (!sample) return null
    const prompt = `You are an expert ski gear buyer for skiers based in Europe (Scandinavia and the Alps).
Item to buy: "${name}" (used for: ${purpose}).
List up to 10 of the best options currently sold in Europe, best first.
Rules:
- Only real products from proper brands that are easy to buy in Europe. No retailer house brands (e.g. REI Co-op, Decathlon's own labels are fine only if clearly a sports brand like Wed'ze), no US-only brands.
- Prefer products that European review sites rate highly: Fall-Line, PlanetSKI, ALPIN, Skipass, PisteHors, Downdays, Freeride.se, Åka Skidor, Fri Flyt. In "sources" name only sites you are confident reviewed that product; otherwise leave it empty.
- "url" is the brand's official homepage (https). Never invent product page URLs.
- "why" is one short sentence.
Return only JSON: {"title": string, "note": string, "items": [{"name": string, "brand": string, "url": string, "why": string, "sources": string[]}]}`
    const out = await sample.json<{ title?: string; note?: string; items?: Partial<Pick>[] }>(prompt, { modelTier: 'default' })
    const items = (out.items ?? [])
      .filter((i) => i && typeof i.name === 'string' && typeof i.brand === 'string')
      .slice(0, 10)
      .map((i, n) => ({
        rank: n + 1, name: String(i.name).slice(0, 80), brand: String(i.brand).slice(0, 40),
        url: typeof i.url === 'string' && /^https:\/\/[^\s"<>]+$/.test(i.url) ? i.url : '',
        why: String(i.why ?? '').slice(0, 200), sources: Array.isArray(i.sources) ? i.sources.map(String).slice(0, 4) : [],
      }))
    if (!items.length) return null
    const picks: Picks = { title: String(out.title ?? name).slice(0, 80), note: String(out.note ?? '').slice(0, 240), items, articles: [], updatedAt: Date.now(), generated: 'claude' }
    try {
      await db?.collection('picks').doc(key).set(picks as unknown as Record<string, unknown>)
    } catch {
      /* viewers who can't write still see the answer this time */
    }
    return picks
  })().finally(() => pending.delete(key))
  pending.set(key, p)
  return p
}
