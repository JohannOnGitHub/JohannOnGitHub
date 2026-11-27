// Live data: weather and snow from Open-Meteo (free, no key, CORS), avalanche
// bulletins from Varsom (Norway), SLF (Switzerland) and avalanche.report (Tyrol).
// Responses are cached in localStorage so the app stays fast and works offline.
import type { Avalanche, Resort } from '../data/resorts'
import { ARTIFACT, readSnapshot } from './artifactDb'

function cacheGet<T>(k: string, maxAgeMs: number): T | null {
  try {
    const raw = localStorage.getItem('skibase:cache:' + k)
    if (!raw) return null
    const { t, v } = JSON.parse(raw) as { t: number; v: T }
    return Date.now() - t < maxAgeMs ? v : null
  } catch {
    return null
  }
}
function cacheSet(k: string, v: unknown) {
  try {
    localStorage.setItem('skibase:cache:' + k, JSON.stringify({ t: Date.now(), v }))
  } catch {
    /* ignore */
  }
}
async function getJson<T>(url: string): Promise<T> {
  const r = await fetch(url)
  if (!r.ok) {
    let reason = `HTTP ${r.status}`
    try {
      const j = await r.json()
      if (j?.reason) reason = j.reason
    } catch {
      /* not JSON */
    }
    throw new Error(reason)
  }
  return r.json() as Promise<T>
}
const HOUR = 3600e3
const DAY = 24 * HOUR

// ---------------- Forecast ----------------

export type ForecastDay = {
  date: string
  code: number
  tMaxTop: number; tMinTop: number; tMaxBase: number; tMinBase: number
  snowTop: number // cm
  precip: number // mm at base
  rainBase: number // mm
  windTop: number; gustTop: number // km/h
  freezing: number | null // m, daily max
  sun: number // hours
}
export type Forecast = { days: ForecastDay[]; snowDepth: number | null; fetchedAt: number }

type OMDaily = {
  time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]
  snowfall_sum: number[]; precipitation_sum: number[]; rain_sum: number[]; wind_speed_10m_max: number[]
  wind_gusts_10m_max: number[]; sunshine_duration: number[]
}
type OMOne = { daily: OMDaily; hourly?: { time: string[]; freezing_level_height?: (number | null)[]; snow_depth?: (number | null)[] } }

export async function forecast(r: Resort): Promise<Forecast> {
  if (ARTIFACT) return readSnapshot<Forecast>(`fc-${r.id}`)
  const k = `fc:${r.id}`
  const hit = cacheGet<Forecast>(k, 3 * HOUR)
  if (hit) return hit
  const daily = 'weather_code,temperature_2m_max,temperature_2m_min,snowfall_sum,precipitation_sum,rain_sum,wind_speed_10m_max,wind_gusts_10m_max,sunshine_duration'
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${r.lat},${r.lat}&longitude=${r.lon},${r.lon}` +
    `&elevation=${r.top},${r.base}&daily=${daily}&hourly=freezing_level_height,snow_depth&forecast_days=16&timezone=auto`
  const [top, base] = await getJson<OMOne[]>(url)
  const fl = new Map<string, number>()
  top.hourly?.time.forEach((t, i) => {
    const v = top.hourly?.freezing_level_height?.[i]
    if (v == null) return
    const d = t.slice(0, 10)
    fl.set(d, Math.max(fl.get(d) ?? -Infinity, v))
  })
  const nowIdx = Math.max(0, (top.hourly?.time ?? []).findIndex((t) => t >= new Date().toISOString().slice(0, 13)))
  const sd = top.hourly?.snow_depth?.[nowIdx]
  const days: ForecastDay[] = top.daily.time.map((date, i) => ({
    date,
    code: top.daily.weather_code[i],
    tMaxTop: top.daily.temperature_2m_max[i], tMinTop: top.daily.temperature_2m_min[i],
    tMaxBase: base.daily.temperature_2m_max[i], tMinBase: base.daily.temperature_2m_min[i],
    snowTop: top.daily.snowfall_sum[i] ?? 0,
    precip: base.daily.precipitation_sum[i] ?? 0,
    rainBase: base.daily.rain_sum[i] ?? 0,
    windTop: top.daily.wind_speed_10m_max[i], gustTop: top.daily.wind_gusts_10m_max[i],
    freezing: fl.has(date) ? Math.round(fl.get(date)!) : null,
    sun: (top.daily.sunshine_duration[i] ?? 0) / 3600,
  }))
  const out = { days, snowDepth: sd == null ? null : Math.round(sd * 100), fetchedAt: Date.now() }
  cacheSet(k, out)
  return out
}

// ---------------- Snow history (modelled, ERA5) ----------------

export type Season = {
  label: string; snowfall: number; meanDepth: number; maxDepth: number; daysOver50: number
  depth: Record<string, number> // "MM-DD" → cm at noon, 1 Nov – 30 Apr
}
export type History = { seasons: Season[]; elevation: number; fetchedAt: number }

/** Snow depth on a given day ("MM-DD") in each past season. */
export const depthOn = (h: History, md: string) => h.seasons.map((s) => ({ label: s.label, cm: s.depth[md] ?? null, snowfall: s.snowfall, meanDepth: s.meanDepth }))

/**
 * The last five seasons at the resort's mid-mountain point, from the ERA5 reanalysis.
 * Model data on a ~10–25 km grid: good for comparing resorts and seasons, not exact
 * on-piste depth. One request per season keeps each call small.
 */
export async function history(r: Resort): Promise<History> {
  if (ARTIFACT) return readSnapshot<History>(`hist-${r.id}`)
  const k = `hist2:${r.id}`
  const hit = cacheGet<History>(k, 14 * DAY)
  if (hit) return hit
  const now = new Date()
  const lastEndYear = now.getMonth() >= 4 ? now.getFullYear() : now.getFullYear() - 1
  const mid = Math.round((r.top + r.base) / 2)
  const seasons: Season[] = []
  for (let y = lastEndYear - 5; y < lastEndYear; y++) {
    const url =
      `https://archive-api.open-meteo.com/v1/archive?latitude=${r.lat}&longitude=${r.lon}&elevation=${mid}` +
      `&start_date=${y}-11-01&end_date=${y + 1}-04-30&daily=snowfall_sum&hourly=snow_depth&timezone=auto`
    const j = await getJson<{ daily: { time: string[]; snowfall_sum: (number | null)[] }; hourly: { time: string[]; snow_depth: (number | null)[] } }>(url)
    const depth: Record<string, number> = {}
    const core: number[] = []
    j.hourly.time.forEach((t, i) => {
      const v = j.hourly.snow_depth[i]
      if (t.slice(11, 13) !== '12' || v == null) return
      const cm = Math.round(v * 100)
      depth[t.slice(5, 10)] = cm
      const m = Number(t.slice(5, 7))
      if (m === 12 || m <= 3) core.push(cm)
    })
    seasons.push({
      label: `${y}/${String(y + 1).slice(2)}`,
      snowfall: Math.round(j.daily.snowfall_sum.reduce<number>((a, b) => a + (b ?? 0), 0)),
      meanDepth: core.length ? Math.round(core.reduce((a, b) => a + b, 0) / core.length) : 0,
      maxDepth: core.length ? Math.max(...core) : 0,
      daysOver50: core.filter((v) => v >= 50).length,
      depth,
    })
  }
  const out = { seasons, elevation: mid, fetchedAt: Date.now() }
  cacheSet(k, out)
  return out
}

// ---------------- Avalanche ----------------

export type Danger = 0 | 1 | 2 | 3 | 4 | 5
export type AvaDay = { date: string; level: Danger; levelHigh?: Danger; split?: string; region: string; text: string; problems: string[] }
export type AvaResult = { source: string; url: string; days: AvaDay[]; fetchedAt: number }

const LEVEL: Record<string, Danger> = { low: 1, moderate: 2, considerable: 3, high: 4, very_high: 5 }
export const DANGER_NAME = ['No rating', 'Low', 'Moderate', 'Considerable', 'High', 'Very high']
const PROBLEM: Record<string, string> = {
  new_snow: 'New snow', wind_slab: 'Wind slab', persistent_weak_layers: 'Persistent weak layers',
  wet_snow: 'Wet snow', gliding_snow: 'Gliding snow', favourable_situation: 'Favourable situation', cornices: 'Cornices',
}

type Caaml = {
  bulletins: {
    validTime: { startTime: string; endTime: string }
    regions: { regionID: string; name?: string }[]
    dangerRatings: { mainValue: string; elevation?: { lowerBound?: string; upperBound?: string } }[]
    avalancheProblems?: { problemType: string }[]
    avalancheActivity?: { highlights?: string; comment?: string }
    snowpackStructure?: { comment?: string }
  }[]
}

function fromCaaml(j: Caaml, region: string): AvaDay[] {
  const strip = (s?: string) => (s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  return j.bulletins
    .filter((b) => b.regions.some((x) => x.regionID === region))
    .map((b) => {
      const levels = b.dangerRatings.map((d) => LEVEL[d.mainValue] ?? 0) as Danger[]
      const hi = Math.max(...levels) as Danger
      const lo = Math.min(...levels) as Danger
      const bound = b.dangerRatings.find((d) => d.elevation?.lowerBound || d.elevation?.upperBound)?.elevation
      const split = bound ? `${bound.lowerBound ?? bound.upperBound} m` : undefined
      return {
        date: b.validTime.endTime.slice(0, 10),
        level: lo, levelHigh: hi !== lo ? hi : undefined, split,
        region: b.regions.find((x) => x.regionID === region)?.name ?? region,
        text: strip(b.avalancheActivity?.highlights || b.avalancheActivity?.comment || b.snowpackStructure?.comment).slice(0, 400),
        problems: [...new Set((b.avalancheProblems ?? []).map((p) => PROBLEM[p.problemType] ?? p.problemType))],
      }
    })
}

export async function avalanche(r: Resort): Promise<AvaResult | null> {
  const a: Avalanche = r.avalanche
  if (a.kind === 'link') return null
  if (ARTIFACT) return readSnapshot<AvaResult>(`ava-${r.id}`)
  const k = `ava:${r.id}`
  const hit = cacheGet<AvaResult>(k, 2 * HOUR)
  if (hit) return hit
  let out: AvaResult
  if (a.kind === 'nve') {
    const today = new Date().toISOString().slice(0, 10)
    const end = new Date(Date.now() + 2 * DAY).toISOString().slice(0, 10)
    type N = { RegionName: string; DangerLevel: string; ValidFrom: string; MainText: string }
    const j = await getJson<N[]>(`https://api01.nve.no/hydrology/forecast/avalanche/v6.3.0/api/AvalancheWarningByCoordinates/Simple/${r.lat}/${r.lon}/2/${today}/${end}`)
    out = {
      source: 'Varsom (NVE)', url: 'https://www.varsom.no/en/avalanche-bulletins/', fetchedAt: Date.now(),
      days: j.map((d) => ({ date: d.ValidFrom.slice(0, 10), level: (Number(d.DangerLevel) || 0) as Danger, region: d.RegionName, text: d.MainText, problems: [] })),
    }
  } else if (a.kind === 'slf') {
    const j = await getJson<Caaml>('https://aws.slf.ch/api/bulletin/caaml/en/json')
    out = { source: 'SLF', url: 'https://www.slf.ch/en/avalanche-bulletin-and-snow-situation/', days: fromCaaml(j, a.region), fetchedAt: Date.now() }
  } else {
    const j = await getJson<Caaml>('https://static.avalanche.report/bulletins/latest/EUREGIO_en_CAAMLv6.json')
    out = { source: 'avalanche.report (Euregio)', url: 'https://avalanche.report/', days: fromCaaml(j, a.region), fetchedAt: Date.now() }
  }
  cacheSet(k, out)
  return out
}

// ---------------- Weather codes ----------------

export function weatherLabel(code: number): { icon: string; text: string } {
  if (code === 0) return { icon: '☀️', text: 'Clear' }
  if (code <= 2) return { icon: '🌤️', text: 'Partly cloudy' }
  if (code === 3) return { icon: '☁️', text: 'Overcast' }
  if (code === 45 || code === 48) return { icon: '🌫️', text: 'Fog' }
  if (code >= 51 && code <= 57) return { icon: '🌦️', text: 'Drizzle' }
  if (code >= 61 && code <= 67) return { icon: '🌧️', text: 'Rain' }
  if (code >= 71 && code <= 77) return { icon: '🌨️', text: 'Snow' }
  if (code >= 80 && code <= 82) return { icon: '🌦️', text: 'Showers' }
  if (code === 85 || code === 86) return { icon: '🌨️', text: 'Snow showers' }
  if (code >= 95) return { icon: '⛈️', text: 'Thunderstorm' }
  return { icon: '·', text: '' }
}

/** A short ski-oriented verdict for one forecast day. */
export function verdict(d: ForecastDay): { label: string; tone: 'good' | 'ok' | 'bad' } {
  if (d.snowTop >= 20 && d.windTop < 40) return { label: 'Powder day', tone: 'good' }
  if (d.gustTop >= 70) return { label: 'Wind holds likely', tone: 'bad' }
  if (d.rainBase >= 5) return { label: 'Rain low down', tone: 'bad' }
  if (d.snowTop >= 5) return { label: 'Fresh snow, flat light', tone: 'ok' }
  if (d.sun >= 6 && d.tMaxBase > 3) return { label: 'Spring snow', tone: 'ok' }
  if (d.sun >= 6) return { label: 'Bluebird', tone: 'good' }
  return { label: 'Mixed', tone: 'ok' }
}
