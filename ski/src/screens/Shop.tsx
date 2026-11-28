import { useEffect, useMemo, useState } from 'react'
import { toast } from '../components/ui'
import { CONDITIONS } from '../data/templates'
import { watchCollection } from '../lib/artifactDb'
import { live, upsert, useStore } from '../lib/store'
import type { ClothingItem, GearItem } from '../lib/types'
import { DISCIPLINES } from './Gear'
import { ensurePicks, picksKey, type Picks } from '../lib/research'


/** The review sites the picks are drawn from: European first, then international. */
export const REVIEW_SOURCES: { name: string; url: string; what: string; europe: boolean }[] = [
  { name: 'Fall-Line', url: 'https://www.fall-line.co.uk/', what: 'UK ski magazine: 500+ products tested each season', europe: true },
  { name: 'PlanetSKI', url: 'https://planetski.eu/', what: 'European ski news site with regular gear reviews', europe: true },
  { name: 'ALPIN', url: 'https://www.alpin.de/', what: 'German mountain magazine with lab and field tests', europe: true },
  { name: 'Skipass', url: 'https://www.skipass.com/', what: 'French ski site with thousands of user-rated gear tests', europe: true },
  { name: 'PisteHors', url: 'https://pistehors.com/', what: 'French off-piste site with gear and avalanche guides', europe: true },
  { name: 'Downdays', url: 'https://www.downdays.eu/', what: 'European freeride and park gear tests', europe: true },
  { name: 'Freeride', url: 'https://www.freeride.se/', what: 'Swedish gear database, test pilots and forum', europe: true },
  { name: 'Åka Skidor', url: 'https://www.akaskidor.se/', what: 'Swedish ski magazine with gear guides', europe: true },
  { name: 'Fri Flyt', url: 'https://www.friflyt.no/', what: 'Norwegian freeride and touring gear tests', europe: true },
  { name: 'Blister', url: 'https://blisterreview.com/', what: 'In-depth long-term reviews', europe: false },
  { name: 'OutdoorGearLab', url: 'https://www.outdoorgearlab.com/', what: 'Side-by-side lab and field tests', europe: false },
  { name: 'Freeskier', url: 'https://www.freeskier.com/', what: 'Annual Buyer\'s Guide, freeride and park focus', europe: false },
  { name: 'Newschoolers', url: 'https://www.newschoolers.com/', what: 'Park and freeride gear database and forum', europe: false },
  { name: 'Ski Magazine', url: 'https://www.skimag.com/', what: 'Large annual ski test', europe: false },
  { name: 'Switchback Travel', url: 'https://www.switchbacktravel.com/', what: 'Buying guides with comparison tables', europe: false },
  { name: 'GearJunkie', url: 'https://gearjunkie.com/', what: 'Tested "best of" lists', europe: false },
]

type Row = { id: string; kind: 'gear' | 'clothing'; name: string; model: string; status: 'missing' | 'upgrade'; essential: boolean; purpose: string[]; key: string; src: GearItem | ClothingItem }

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
      purpose: [x.discipline === 'shared' ? 'Any skiing' : DISCIPLINES[x.discipline]], key: picksKey(x.slot), src: x,
    }))
    const c = live(clothesAll).filter((x) => x.status === 'missing' || x.status === 'upgrade').map<Row>((x) => ({
      id: x.id, kind: 'clothing', name: x.name, model: x.model, status: x.status as Row['status'], essential: false,
      purpose: x.conditions.map((k) => CONDITIONS[k].name), key: picksKey(x.name), src: x,
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
        <div className="stack">{shown.map((r) => <ShopItem key={r.id} r={r} picks={picks?.get(r.key)} picksError={picksError} loaded={picks !== null} />)}</div>
      ) : (
        <div className="empty"><h3>Nothing to buy</h3><p>Mark items as Missing or Replace on the Gear and Clothing pages and they show up here.</p></div>
      )}

      <section className="panel">
        <h2>Where the picks come from</h2>
        <p className="small muted">Picks are for skiers in Europe: European tests come first, international tests fill the gaps, and brands that are hard to buy in Europe are left out. Each pick shows which sites rated it; picks without a site are well-known options no test covered.</p>
        {[true, false].map((eu) => (
          <div key={String(eu)} className="stack" style={{ gap: 0 }}>
            <span className="label">{eu ? 'European sources' : 'International sources'}</span>
            <div className="list">
              {REVIEW_SOURCES.filter((x) => x.europe === eu).map((x) => (
                <div key={x.name} className="item">
                  <div><a className="name" href={x.url} target="_blank" rel="noreferrer">{x.name} ↗</a><div className="sub">{x.what}</div></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </>
  )
}

function ShopItem({ r, picks: saved, picksError, loaded }: { r: Row; picks?: Picks; picksError: string | null; loaded: boolean }) {
  const [open, setOpen] = useState(false)
  const [asked, setAsked] = useState<{ state: 'idle' | 'busy' | 'failed'; picks?: Picks }>({ state: 'idle' })
  const picks = saved ?? asked.picks
  const research = () => {
    setAsked({ state: 'busy' })
    ensurePicks(r.name, r.purpose.join(', ')).then(
      (p) => setAsked(p ? { state: 'idle', picks: p } : { state: 'failed' }),
      () => setAsked({ state: 'failed' }),
    )
  }
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
          <button type="button" className={open ? '' : 'ghost'} onClick={() => { if (!open && !picks && loaded && asked.state === 'idle') research(); setOpen(!open) }} aria-expanded={open}>
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
            <p className="note">
              {picks.generated === 'claude'
                ? `Suggested by Claude from its own knowledge on ${new Date(picks.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}, not from a live search of the review sites. Ask Claude in a chat for a fully researched list.`
                : `Researched by Claude from the review sites, ${new Date(picks.updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}.`} Prices and models change; check the brand site.
            </p>
          </div>
        ) : (
          <div className="stack" style={{ gap: 6 }}>
            <p className="small muted">
              {!loaded ? (picksError ?? 'Loading picks…')
                : asked.state === 'busy' ? 'Claude is finding the best options for this item…'
                : asked.state === 'failed' ? 'Picks could not be found right now.'
                : 'No picks for this item yet.'}
            </p>
            {loaded && asked.state !== 'busy' && <div><button type="button" className="quiet" onClick={research}>Find picks with Claude</button></div>}
          </div>
        )
      )}
    </article>
  )
}
