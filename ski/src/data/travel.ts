// Ways to get from Stockholm to a resort. Alpe d'Huez has a researched, specific
// set of options (November 2026). Every other resort gets options built from its
// airports, station and distance, with search links prefilled for the trip dates.
import { distanceKm, STOCKHOLM, type Resort } from './resorts'

export type Mode = 'fly' | 'train' | 'car' | 'bus'
export type Link = { label: string; url: string }
export type TravelOption = {
  id: string
  mode: Mode
  title: string
  time: string // door to door, one way
  hours: number // for sorting
  legs: string[]
  good: string[]
  watch: string[]
  links: Link[]
}

export const MODE_LABEL: Record<Mode, string> = { fly: 'Fly', train: 'Train', car: 'Car', bus: 'Bus' }

const gflights = (to: string, start?: string, end?: string) =>
  `https://www.google.com/travel/flights?q=${encodeURIComponent(
    `Flights from Stockholm ARN to ${to}${start ? ` on ${start}` : ''}${end ? ` returning ${end}` : ''}`,
  )}`
const gmaps = (r: Resort) =>
  `https://www.google.com/maps/dir/?api=1&origin=Stockholm&destination=${isFinite(r.lat) ? `${r.lat},${r.lon}` : encodeURIComponent(r.name)}&travelmode=driving`
const rome2rio = (r: Resort) => `https://www.rome2rio.com/s/Stockholm/${encodeURIComponent(r.name)}`
const SEAT61 = { label: 'Seat61: Sweden to Europe by train', url: 'https://www.seat61.com/Sweden.htm' }
const FLIX = { label: 'FlixBus', url: 'https://global.flixbus.com/' }
const SJ = { label: 'SJ (Swedish trains)', url: 'https://www.sj.se/en' }

function alpeDHuez(r: Resort, start?: string, end?: string): TravelOption[] {
  // Norwegian's non-stop to Lyon runs Mon and Fri only; other days need a stop.
  const lyonNonStop = !start || [1, 5].includes(new Date(start + 'T12:00:00').getDay())
  return [
    {
      id: 'fly-gva', mode: 'fly', title: 'Fly to Geneva, then drive or shuttle', time: '~7–8 h', hours: 7.5,
      legs: [
        'Arlanda → Geneva non-stop (SAS or SWISS), ~2 h 40',
        'Geneva → Alpe d\'Huez by rental car or shared transfer, ~220 km, ~3 h (more on Saturdays)',
      ],
      good: ['Non-stop flights most days, so it works with a Wednesday start', 'Most transfer companies serve Geneva'],
      watch: ['Longest road transfer of the three airports', 'Rental cars from the Swiss side need French winter equipment: book from the French sector'],
      links: [{ label: 'Flights ARN → GVA', url: gflights('GVA', start, end) }, { label: 'Route on Google Maps', url: gmaps(r) }],
    },
    {
      id: 'fly-lys', mode: 'fly', title: 'Fly to Lyon, then drive or shuttle',
      time: lyonNonStop ? '~6.5–8 h' : '~8–10 h (one stop)', hours: lyonNonStop ? 7 : 9,
      legs: [
        'Arlanda → Lyon non-stop (Norwegian, Mon and Fri from late Jan 2027), ~2 h 45; other days with one stop',
        'Lyon Saint-Exupéry → Alpe d\'Huez by car or transfer, ~150 km, ~2 h',
      ],
      good: ['Shortest transfer from a big airport'],
      watch: ['The non-stop days (Mon, Fri) do not match a Wed 17 – Sun 21 trip: you would fly with one stop or shift the dates'],
      links: [{ label: 'Flights ARN → LYS', url: gflights('LYS', start, end) }],
    },
    {
      id: 'fly-cdg-tgv', mode: 'fly', title: 'Fly to Paris, TGV to Grenoble, bus up', time: '~10–11 h', hours: 10.5,
      legs: [
        'Arlanda → Paris CDG non-stop (SAS, Air France), ~2 h 40',
        'TGV from CDG airport station to Grenoble, ~3 h 15 (or via Paris Gare de Lyon)',
        'Transaltitude bus Grenoble → Alpe d\'Huez, ~1 h 30, ~5 a day',
      ],
      good: ['No car needed', 'Many flights a day'],
      watch: ['Three connections: book the bus with a margin', 'The Grenoble bus station is next to the train station'],
      links: [{ label: 'Flights ARN → CDG', url: gflights('CDG', start, end) }, { label: 'SNCF Connect', url: 'https://www.sncf-connect.com/en-en/' }, { label: 'Transaltitude', url: 'https://www.transaltitude.fr/' }],
    },
    {
      id: 'train', mode: 'train', title: 'Night train to Hamburg, then TGV via Paris', time: '~1.5 days', hours: 34,
      legs: [
        'Stockholm → Hamburg on the EuroNight sleeper (RDC, 3 nights a week, leaves ~17:30)',
        'Hamburg → Paris by ICE, ~6–7 h with one change',
        'Paris Gare de Lyon → Grenoble by TGV, ~3 h',
        'Transaltitude bus to Alpe d\'Huez, ~1 h 30',
      ],
      good: ['Lowest CO₂', 'A night in a bed instead of a day of driving'],
      watch: ['The sleeper runs only some nights a week: check which days in Feb 2027', 'Too slow for a 5-day trip unless you add days'],
      links: [{ label: 'EuroNight timetable', url: 'https://www.nachtexpress.de/en/timetable' }, SEAT61, { label: 'SNCF Connect', url: 'https://www.sncf-connect.com/en-en/' }],
    },
    {
      id: 'car', mode: 'car', title: 'Drive', time: '~24 h driving (2 days)', hours: 30,
      legs: [
        'Stockholm → Malmö, ~610 km',
        'Öresund bridge, then the Rødby–Puttgarden ferry (45 min) — or the overnight Trelleborg–Rostock ferry',
        'Hamburg → Frankfurt → Basel → Geneva or Lyon → Grenoble, ~1 500 km',
        'Grenoble → Bourg-d\'Oisans → 21 hairpins to Alpe d\'Huez',
      ],
      good: ['All your gear, no luggage fees', 'Freedom to ski La Grave or Les 2 Alpes on the same trip'],
      watch: ['Two days each way: does not fit a 5-day trip', 'French law requires winter tyres or chains on the mountain road', 'Swiss vignette if you go via Geneva'],
      links: [{ label: 'Route on Google Maps', url: gmaps(r) }],
    },
    {
      id: 'bus', mode: 'bus', title: 'Long-distance bus', time: '~35–45 h', hours: 40,
      legs: ['FlixBus Stockholm → Copenhagen → Hamburg/Berlin → Lyon or Grenoble, several changes', 'Transaltitude bus to the resort'],
      good: ['Usually the cheapest'],
      watch: ['By far the slowest', 'Ski bags may be refused or charged extra'],
      links: [FLIX, { label: 'Rome2Rio overview', url: rome2rio(r) }],
    },
  ]
}

function generic(r: Resort, start?: string, end?: string): TravelOption[] {
  const km = isFinite(r.lat) ? distanceKm(STOCKHOLM.lat, STOCKHOLM.lon, r.lat, r.lon) : NaN
  if (!isFinite(km)) {
    return [{
      id: 'car', mode: 'car', title: 'Drive', time: 'see map', hours: 99, legs: ['Set the resort\'s position to get distances and times'], good: [], watch: [],
      links: [{ label: 'Route on Google Maps', url: gmaps(r) }, { label: 'Rome2Rio overview', url: rome2rio(r) }],
    }]
  }
  const roadKm = Math.round((km * 1.3) / 10) * 10
  const nordic = r.country === 'SE' || r.country === 'NO'
  const out: TravelOption[] = []
  const air = r.airports.filter((a) => a.code && a.code !== 'ARN')
  for (const a of air.slice(0, 2)) {
    const transferH = Math.max(0.3, a.km / 70)
    const flightH = nordic ? 1.2 : 2.6
    const total = flightH + transferH + 2.5 // check-in, security, bags
    out.push({
      id: `fly-${a.code!.toLowerCase()}`, mode: 'fly', title: `Fly to ${a.name}`, time: `~${Math.round(total)} h`, hours: total,
      legs: [`Arlanda → ${a.name} (${a.code})`, `${a.name} → ${r.name}, ~${a.km} km${r.transfer ? '' : ', by car or transfer'}`],
      good: a.note ? [a.note] : [], watch: ['Check whether there is a non-stop flight on your dates'],
      links: [{ label: `Flights ARN → ${a.code}`, url: gflights(a.code!, start, end) }],
    })
  }
  if (r.station) {
    out.push({
      id: 'train', mode: 'train', title: nordic ? 'Train' : 'Train via Copenhagen and Hamburg', time: nordic ? '~6–18 h' : '~1.5–2 days', hours: nordic ? 12 : 36,
      legs: nordic ? [`Stockholm → ${r.station.name}`] : ['Stockholm → Hamburg (EuroNight sleeper, or day trains via Copenhagen)', `Onward to ${r.station.name}`],
      good: ['Lowest CO₂'], watch: nordic ? [] : ['Several connections: book a through ticket where you can'],
      links: [nordic ? SJ : SEAT61, { label: 'Rome2Rio overview', url: rome2rio(r) }],
    })
  }
  const driveH = roadKm / 80
  out.push({
    id: 'car', mode: 'car', title: 'Drive', time: driveH > 14 ? `~${Math.round(driveH)} h driving (2 days)` : `~${Math.round(driveH)} h`, hours: driveH,
    legs: [`About ${roadKm.toLocaleString('en')} km by road`],
    good: ['All your gear, no luggage fees'], watch: nordic ? ['Winter tyres are required in winter conditions'] : ['Ferry or bridge to Denmark, then through Germany', 'Check vignettes and winter-tyre rules on the way'],
    links: [{ label: 'Route on Google Maps', url: gmaps(r) }],
  })
  out.push({
    id: 'bus', mode: 'bus', title: nordic ? 'Ski bus' : 'Long-distance bus', time: nordic ? `~${Math.round(driveH + 1)} h` : '~30–45 h', hours: nordic ? driveH + 1 : 38,
    legs: [nordic ? 'Ski buses run from Stockholm to the big Swedish and Norwegian resorts in season' : 'FlixBus with several changes'],
    good: ['Usually the cheapest'], watch: ['Check ski bag rules'],
    links: [FLIX, { label: 'Rome2Rio overview', url: rome2rio(r) }],
  })
  return out
}

export function travelOptions(r: Resort, start?: string, end?: string): TravelOption[] {
  const list = r.id === 'alpedhuez' ? alpeDHuez(r, start, end) : generic(r, start, end)
  return list.sort((a, b) => a.hours - b.hours)
}

/** Trip-specific warnings that depend on the dates (school holidays, black Saturdays). */
export function dateWarnings(r: Resort, start: string, end: string): string[] {
  const out: string[] = []
  if (r.country === 'FR') {
    // French winter school holidays 2027 (zones A, B, C), from the published calendar.
    const zones: [string, string, string][] = [
      ['C (Paris, Toulouse, Montpellier)', '2027-02-06', '2027-02-22'],
      ['A (Lyon, Grenoble, Bordeaux…)', '2027-02-13', '2027-03-01'],
      ['B (Marseille, Lille, Nantes…)', '2027-02-20', '2027-03-08'],
    ]
    const hit = zones.filter(([, s, e]) => start < e && end >= s).map(([z]) => z)
    if (hit.length) out.push(`French school holidays for zone ${hit.join(', zone ')} overlap your dates: expect full slopes and higher prices. Book lodging and transfers early.`)
    for (let d = new Date(start + 'T12:00:00'); d <= new Date(end + 'T12:00:00'); d.setDate(d.getDate() + 1)) {
      if (d.getDay() === 6 && hit.length) out.push(`Saturday ${d.getDate()} ${d.toLocaleString('en', { month: 'short' })} is a changeover day: avoid driving up or down the mountain that day if you can.`)
    }
  }
  if (r.country === 'SE') {
    const m = start.slice(5, 7)
    if (m === '02' || m === '03') out.push('Swedish sportlov (weeks 7–10, depending on the region) can make Swedish resorts very busy.')
  }
  return out
}
