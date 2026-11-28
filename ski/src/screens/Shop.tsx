import { useEffect, useMemo, useState } from 'react'
import { toast } from '../components/ui'
import { CONDITIONS } from '../data/templates'
import { watchCollection } from '../lib/artifactDb'
import { live, upsert, useStore } from '../lib/store'
import type { ClothingItem, GearItem } from '../lib/types'
import { DISCIPLINES } from './Gear'

type Pick = { rank: number; name: string; brand: string; url: string; why: string; sources: string[] }
type Picks = { id: string; title: string; note: string; items: Pick[]; articles: { source: string; url: string }[]; updatedAt: number }

/** The review sites the picks are drawn from. */
export const REVIEW_SOURCES: { name: string; url: string; what: string }[] = [
  { name: 'Blister', url: 'https://blisterreview.com/', what: 'The most in-depth long-term ski and gear reviews' },
  { name: 'OutdoorGearLab', url: 'https://www.outdoorgearlab.com/', what: 'Side-by-side lab and field tests with scores' },
  { name: 'Freeskier', url: 'https://www.freeskier.com/', what: 'Annual Buyer\'s Guide, freeride and park focus' },
  { name: 'Newschoolers', url: 'https://www.newschoolers.com/', what: 'Park and freeride gear database and forum' },
  { name: 'Downdays', url: 'https://www.downdays.eu/', what: 'European freeride and park gear tests' },
  { name: 'Ski Magazine', url: 'https://www.skimag.com/', what: 'Large annual ski test and gear guides' },
  { name: 'Switchback Travel', url: 'https://www.switchbacktravel.com/', what: 'Clear buying guides with comparison tables' },
  { name: 'GearJunkie', url: 'https://gearjunkie.com/', what: 'Tested "best of" lists for gear and clothing' },
  { name: 'Åka Skidor', url: 'https://www.akaskidor.se/', what: 'Swedish ski magazine with Nordic gear tests' },
  { name: 'Fri Flyt', url: 'https://www.friflyt.no/', what: 'Norwegian freeride and touring gear tests' },
]

/** Match a shopping item to a researched category by its name. */
const KEYS: [RegExp, string][] = [
  [/transceiver|beacon/i, 'transceiver'], [/probe/i, 'probe'], [/shovel/i, 'shovel'], [/helmet/i, 'helmet'],
  [/goggle/i, 'goggles'], [/boot bag/i, 'boot-bag'], [/\bpoles?\b/i, 'poles'], [/scraper|brush|iron/i, 'tuning-kit'],
  [/edge/i, 'edge-tuner'], [/wax/i, 'wax'], [/merino.*heavy|heavy.*base/i, 'base-top-heavy'], [/merino.*light|light.*base/i, 'base-top-light'],
  [/base layer bottom|long johns/i, 'base-bottoms'], [/fleece/i, 'fleece'], [/belay|summit puffy|parka/i, 'belay-puffy'], [/vest/i, 'vest'],
  [/liner glove/i, 'liner-gloves'], [/mitten/i, 'mittens'], [/balaclava/i, 'balaclava'], [/beanie/i, 'beanie'], [/sock/i, 'ski-socks'],
  [/warmer/i, 'hand-warmers'], [/apr[eè]s/i, 'apres-boots'], [/sunglass|glacier glass|category 4/i, 'glacier-glasses'],
]
const keyFor = (name: string) => KEYS.find(([re]) => re.test(name))?.[1] ?? null

type Row = { id: string; kind: 'gear' | 'clothing'; name: string; model: string; status: 'missing' | 'upgrade'; essential: boolean; purpose: string[]; key: string | null; src: GearItem | ClothingItem }

export default function Shop() {
  const gearAll = useStore((s) => s.gear)
  const clothesAll = useStore((s) => s.clothing)
  const [filter, setFilter] = useState<'all' | 'gear' | 'clothing'>('all')
  const [picks, setPicks] = useState<Map<string, Picks> | null>(null)
  const [picksError, setPicksError] = useState<string | null>(null)
  useEffect(() => watchCollection<Omit<Picks, 'id'>>('picks', (rows, err) => {
    if (rows) setPicks(new Map(rows.map((r) => [r.id, r as Picks])))
    else setPicksError(err ?? null)
  }), [])

  const rows = useMemo<Row[]>(() => {
    const g = live(gearAll).filter((x) => x.status === 'missing' || x.status === 'upgrade').map<Row>((x) => ({
      id: x.id, kind: 'gear', name: x.slot, model: x.model, status: x.status as Row['status'], essential: x.essential,
      purpose: [x.discipline === 'shared' ? 'Any skiing' : DISCIPLINES[x.discipline]], key: keyFor(x.slot), src: x,
    }))
    const c = live(clothesAll).filter((x) => x.status === 'missing' || x.status === 'upgrade').map<Row>((x) => ({
      id: x.id, kind: 'clothing', name: x.name, model: x.model, status: x.status as Row['status'], essential: false,
      purpose: x.conditions.map((k) => CONDITIONS[k].name), key: keyFor(x.name), src: x,
    }))
    return [...g.sort((a, b) => Number(b.essential) - Number(a.essential)), ...c]
  }, [gearAll, clothesAll])
  const shown = rows.filter((r) => filter === 'all' || r.kind === filter)

  return (
    <>
      <div className="head">
        <div>
          <div className="label">To buy</div>
          <h1>Shopping list</h1>
          <p>Everything you marked Missing or Replace, in gear and clothing. Open an item to see the best-reviewed options and buy from the brand.</p>
        </div>
        <div className="seg" role="group" aria-label="Show">
          {(['all', 'gear', 'clothing'] as const).map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}>
              {f === 'all' ? `All (${rows.length})` : f === 'gear' ? `Gear (${rows.filter((r) => r.kind === 'gear').length})` : `Clothing (${rows.filter((r) => r.kind === 'clothing').length})`}
            </button>
          ))}
        </div>
      </div>

      {shown.length ? (
        <div className="stack">{shown.map((r) => <ShopItem key={r.id} r={r} picks={r.key ? picks?.get(r.key) : undefined} picksError={picksError} loaded={picks !== null} />)}</div>
      ) : (
        <div className="empty"><h3>Nothing to buy</h3><p>Mark items as Missing or Replace on the Gear and Clothing pages and they show up here.</p></div>
      )}

      <section className="panel">
        <h2>Where the picks come from</h2>
        <p className="small muted">Picks are ranked from the tests and buyer's guides of these ten sites. Each pick shows which sites rated it; picks without a site are well-known options that no tested list covered.</p>
        <div className="list">
          {REVIEW_SOURCES.map((s, i) => (
            <div key={s.name} className="item">
              <div><a className="name" href={s.url} target="_blank" rel="noreferrer">{i + 1}. {s.name} ↗</a><div className="sub">{s.what}</div></div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}

function ShopItem({ r, picks, picksError, loaded }: { r: Row; picks?: Picks; picksError: string | null; loaded: boolean }) {
  const [open, setOpen] = useState(false)
  const bought = () => {
    if (r.kind === 'gear') upsert('gear', { ...(r.src as GearItem), status: 'have' })
    else upsert('clothing', { ...(r.src as ClothingItem), status: 'have' })
    toast(`${r.name} marked as bought`)
  }
  return (
    <article className="shop-item">
      <div className="between">
        <div className="stack" style={{ gap: 4 }}>
          <b>{r.name}{r.essential && <span className="ess">Essential</span>}</b>
          <div className="chips">
            <span className="tag">{r.kind === 'gear' ? 'Gear' : 'Clothing'}</span>
            {r.purpose.map((p) => <span key={p} className="tag purpose">{p}</span>)}
            <span className={`status st-${r.status}`}>{r.status === 'missing' ? 'Missing' : 'Replace'}</span>
          </div>
          {r.model && <span className="small muted">Current: {r.model}</span>}
        </div>
        <div className="row">
          <button type="button" className={open ? '' : 'ghost'} onClick={() => setOpen(!open)} aria-expanded={open}>
            {open ? 'Hide picks' : picks ? `Top ${picks.items.length} picks` : 'Top picks'}
          </button>
          <button type="button" className="quiet" onClick={bought}>Bought it</button>
        </div>
      </div>
      {open && (
        picks ? (
          <div className="stack">
            {picks.note && <p className="small warn">{picks.note}</p>}
            <ol className="picks">
              {picks.items.map((p) => (
                <li key={p.name}>
                  <div className="between">
                    <span><b>{p.brand} {p.name}</b></span>
                    {/^https:\/\//.test(p.url) && <a className="btn ghost" href={p.url} target="_blank" rel="noreferrer">{p.brand} site ↗</a>}
                  </div>
                  <span className="small">{p.why}</span>
                  <span className="small muted">{p.sources.length ? `Rated by ${p.sources.join(', ')}` : 'Not in a published test'}</span>
                </li>
              ))}
            </ol>
            {picks.articles.length > 0 && (
              <p className="small">Read the tests: {picks.articles.map((a, i) => <span key={a.url}>{i > 0 && ' · '}<a href={a.url} target="_blank" rel="noreferrer">{a.source}</a></span>)}</p>
            )}
            <p className="note">Researched by Claude, {new Date(picks.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}. Prices and models change; check the brand site.</p>
          </div>
        ) : (
          <p className="small muted">{!loaded ? (picksError ?? 'Loading picks…') : 'No picks researched for this item yet. Ask Claude to research it and the top 10 will appear here.'}</p>
        )
      )}
    </article>
  )
}
