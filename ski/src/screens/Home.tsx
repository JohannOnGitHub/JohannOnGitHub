import { useEffect, useMemo, useState } from 'react'
import { fmtDate, SKI_TYPE, toast, TYPE_COLOR } from '../components/ui'
import { resortById } from '../data/resorts'
import { CONDITIONS } from '../data/templates'
import { exportJson, importJson, live, useStore } from '../lib/store'
import { normalizeCode, onSync, startSync, stopSync, syncAvailable, syncNow, type SyncStatus } from '../lib/sync'
import type { CondId, Discipline, SkiType } from '../lib/types'
import { readiness } from './Clothing'
import { coverage, DISCIPLINES } from './Gear'
import { currentSeason, seasonOf } from './Log'
import { ProfileCard, UpcomingDays } from './Profile'
import { ARTIFACT } from '../lib/artifactDb'

export default function Home({ go }: { go: (h: string) => void }) {
  const s = useStore((x) => x)
  const days = useMemo(() => live(s.days), [s.days])
  const gear = useMemo(() => live(s.gear), [s.gear])
  const clothing = useMemo(() => live(s.clothing), [s.clothing])
  const trips = useMemo(() => live(s.trips).filter((t) => t.end >= new Date().toISOString().slice(0, 10)).sort((a, b) => a.start.localeCompare(b.start)), [s.trips])
  const season = currentSeason()
  const inSeason = days.filter((d) => seasonOf(d.date) === season)
  const byType = (Object.keys(SKI_TYPE) as SkiType[]).map((t) => [t, inSeason.filter((d) => d.types.includes(t)).length] as const)
  const shopping = gear.filter((g) => g.status === 'missing' || g.status === 'upgrade').length + clothing.filter((c) => c.status === 'missing' || c.status === 'upgrade').length
  const last = [...days].sort((a, b) => b.date.localeCompare(a.date))[0]

  return (
    <>
      <div className="head">
        <div>
          <div className="label">Season {season}</div>
          <h1>Ski Base</h1>
          <p>Your gear, clothing, days on snow and trips in one place.</p>
        </div>
      </div>

      <div className="stats">
        <div className="stat"><span className="label">Days this season</span><b className="num">{inSeason.length}</b></div>
        {byType.filter(([, n]) => n).map(([t, n]) => <div className="stat" key={t}><span className="label" style={{ color: TYPE_COLOR[t] }}>{SKI_TYPE[t]}</span><b className="num">{n}</b></div>)}
        <div className="stat"><span className="label">All-time days</span><b className="num">{days.length}</b></div>
        <div className="stat"><span className="label">To buy</span><b className="num">{shopping}</b></div>
      </div>

      <ProfileCard />

      <section className="stack">
        <div className="between"><h2>Upcoming ski days</h2><button type="button" className="ghost" onClick={() => go('trips')}>All trips</button></div>
        <UpcomingDays trips={trips} go={go} />
      </section>

      <div className="grid2">
        <section className="panel">
          <div className="between"><h2>Gear readiness</h2><button type="button" className="link" onClick={() => go('gear')}>Open gear</button></div>
          {(['allmountain', 'park', 'touring', 'shared'] as (Discipline | 'shared')[]).map((d) => {
            const c = coverage(gear.filter((g) => g.discipline === d))
            return (
              <div key={d} className="stack" style={{ gap: 4 }}>
                <div className="between small"><span>{DISCIPLINES[d]}</span><span className="num">{c.have}/{c.total} ready</span></div>
                <div className="meter"><i style={{ width: `${c.total ? (c.have / c.total) * 100 : 0}%`, background: 'var(--good)' }} /></div>
              </div>
            )
          })}
          <div className="between small" style={{ marginTop: 4 }}><b>Clothing</b><button type="button" className="link" onClick={() => go('clothing')}>Open clothing</button></div>
          {(Object.keys(CONDITIONS) as CondId[]).map((c) => {
            const r = readiness(clothing, c)
            return <div key={c} className="between small"><span>{CONDITIONS[c].name}</span><span className="num">{r.have}/{r.total}</span></div>
          })}
        </section>

        <section className="panel">
          <div className="between"><h2>Last day out</h2><button type="button" className="link" onClick={() => go('log')}>Open log</button></div>
          {last ? (
            <div className="stack" style={{ gap: 4 }}>
              <b>{resortById(last.resortId)?.name ?? last.place}</b>
              <span className="small">{fmtDate(last.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
              {last.highlight && <span className="small">{last.highlight}</span>}
            </div>
          ) : <p className="small muted">Nothing logged yet. Log your days on the Log page.</p>}
        </section>
      </div>

      <Settings />
    </>
  )
}

function Settings() {
  if (ARTIFACT) return <ArtifactData />
  return <LocalSettings />
}

function ArtifactData() {
  return (
    <section className="panel">
      <h2>Your data</h2>
      <p className="small muted">Everything you change here is saved to this page and follows you to any device where you open it on claude.ai. Weather, snow and avalanche data are snapshots fetched by Claude; each section shows when it was updated. Ask Claude to refresh conditions before a trip.</p>
    </section>
  )
}

function LocalSettings() {
  const [sync, setSync] = useState<SyncStatus | null>(null)
  const [code, setCode] = useState('')
  useEffect(() => onSync(setSync), [])
  return (
    <section className="panel">
      <h2>Your data</h2>
      <p className="small muted">Everything is saved on this device. Export a backup file now and then, or turn on sync to share the data between your phone and computer.</p>
      <div className="row">
        <button
          type="button"
          className="quiet"
          onClick={() => {
            const blob = new Blob([exportJson()], { type: 'application/json' })
            const a = document.createElement('a')
            a.href = URL.createObjectURL(blob)
            a.download = `ski-base-${new Date().toISOString().slice(0, 10)}.json`
            a.click()
            URL.revokeObjectURL(a.href)
          }}
        >
          Export backup
        </button>
        <label className="btn ghost" style={{ cursor: 'pointer' }}>
          Import backup
          <input
            type="file"
            accept="application/json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              toast(importJson(await f.text()) ? 'Backup merged in' : 'That file is not a Ski Base backup')
              e.target.value = ''
            }}
          />
        </label>
      </div>
      {syncAvailable && sync && (
        <div className="stack">
          <h3>Sync between devices</h3>
          {sync.code ? (
            <>
              <p className="small">Sync code (type it on your other device): <b className="mono">{sync.code}</b></p>
              <p className="small muted">
                {sync.state === 'syncing' ? 'Syncing…' : sync.state === 'error' ? `Sync failed: ${sync.message}` : sync.lastSync ? `Last synced ${new Date(sync.lastSync).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` : ''}
              </p>
              <div className="row">
                <button type="button" className="quiet" onClick={() => void syncNow()}>Sync now</button>
                <button type="button" className="link" onClick={stopSync}>Stop syncing on this device</button>
              </div>
            </>
          ) : (
            <div className="row">
              <button type="button" onClick={() => void startSync()}>Create a sync code</button>
              <span className="small muted">or</span>
              <input id="sync-code" aria-label="Sync code from another device" placeholder="XXXX-XXXX-XXXX-XXXX" value={code} onChange={(e) => setCode(normalizeCode(e.target.value))} style={{ width: 220 }} />
              <button type="button" className="quiet" onClick={() => void startSync(code)}>Join</button>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
