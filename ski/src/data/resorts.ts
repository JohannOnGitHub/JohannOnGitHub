// Resort reference data. Figures are rounded from resort and guide sources as of
// autumn 2026 and are meant for comparing resorts, not for planning to the metre:
// check the resort's own site before a trip. Live snow, history and avalanche data
// are fetched in the app instead of being typed in here.
import type { CustomResort } from '../lib/types'

export type Country = 'SE' | 'NO' | 'FR' | 'CH' | 'AT' | 'IT' | 'DE'
export type Tag = 'freeride' | 'park' | 'family' | 'touring' | 'glacier' | 'snowsure' | 'late' | 'big' | 'local' | 'night'

export const TAGS: Record<Tag, string> = {
  freeride: 'Freeride',
  park: 'Park',
  family: 'Family',
  touring: 'Touring',
  glacier: 'Glacier',
  snowsure: 'Snow-sure',
  late: 'Late season',
  big: 'Big area',
  local: 'Near Stockholm',
  night: 'Night skiing',
}

export type Avalanche =
  | { kind: 'nve' } // Varsom (Norway), by coordinates
  | { kind: 'slf'; region: string } // SLF (Switzerland), CAAML region id
  | { kind: 'euregio'; region: string } // avalanche.report (Tyrol, South Tyrol, Trentino)
  | { kind: 'link'; label: string; url: string } // no open API: link to the official bulletin

export type Hub = { name: string; code?: string; km: number; note?: string }

export type Resort = {
  id: string
  name: string
  area?: string // linked ski area, e.g. "Grand Domaine"
  country: Country
  region: string
  lat: number
  lon: number
  top: number // m
  base: number // m
  km: number // marked pistes, km (approx.)
  lifts?: number
  tags: Tag[]
  season: string
  about: string
  web: string
  passUrl: string
  pass?: { text: string; source: string; asOf: string }
  avalanche: Avalanche
  airports: Hub[]
  station?: Hub
  transfer?: string // how to get from the station/airport up to the resort
  custom?: boolean // added by you
}

const BERA = (massif: string): Avalanche => ({
  kind: 'link',
  label: `Météo-France avalanche bulletin (BERA), massif ${massif}`,
  url: 'https://meteofrance.com/meteo-montagne',
})
const LAVIN = (area: string): Avalanche => ({
  kind: 'link',
  label: `Lavinprognoser: ${area}`,
  url: 'https://lavinprognoser.se/',
})

export const RESORTS: Resort[] = [
  // ---------- Sweden ----------
  {
    id: 'stoten', name: 'Stöten', area: 'SkiStar Sälen', country: 'SE', region: 'Dalarna',
    lat: 61.268, lon: 12.886, top: 870, base: 530, km: 25, tags: ['family', 'park'],
    season: 'Late Nov – late Apr',
    about: 'Quiet part of Sälen with good tree skiing and a park. Close to the Scandinavian Mountains Airport.',
    web: 'https://www.skistar.com/en/ski-destinations/salen/', passUrl: 'https://www.skistar.com/en/ski-destinations/salen/ski-pass/',
    pass: { text: 'Adult 6-day in sportlov 2027: 3 126 SEK (all Sälen)', source: 'efn.se', asOf: '2026-11' },
    avalanche: LAVIN('no forecast area for Sälen (low avalanche terrain)'),
    airports: [{ name: 'Scandinavian Mountains (Sälen)', code: 'SCR', km: 10 }, { name: 'Stockholm Arlanda', code: 'ARN', km: 450 }],
    transfer: 'Ski buses from Stockholm run Fri/Sat in season (Fjällexpressen and others). By car: ~5 h via Mora.',
  },
  {
    id: 'idre', name: 'Idre Fjäll', country: 'SE', region: 'Dalarna',
    lat: 61.889, lon: 12.848, top: 890, base: 590, km: 43, tags: ['family', 'park', 'snowsure'],
    season: 'Early Nov – early May',
    about: 'Often the first Swedish resort to open. Ski-in/ski-out village, good park and a long season.',
    web: 'https://idrefjall.se/en/', passUrl: 'https://idrefjall.se/en/about-us/information/prices',
    pass: { text: 'Adult day pass ~490 SEK, week ~1 885 SEK (2025/26 figures)', source: 'skiinfo.fr', asOf: '2025-12' },
    avalanche: LAVIN('no forecast area for Idre'),
    airports: [{ name: 'Scandinavian Mountains (Sälen)', code: 'SCR', km: 90 }, { name: 'Stockholm Arlanda', code: 'ARN', km: 520 }],
    transfer: 'Bus from Stockholm via Mora (~7 h). By car: ~6 h.',
  },
  {
    id: 'lofsdalen', name: 'Löfsdalen', country: 'SE', region: 'Härjedalen',
    lat: 62.12, lon: 13.27, top: 1000, base: 600, km: 30, tags: ['family', 'snowsure'],
    season: 'Late Nov – late Apr',
    about: 'Small, family-run and snow-reliable, a little further north than Sälen and Idre.',
    web: 'https://www.lofsdalen.com/', passUrl: 'https://www.lofsdalen.com/',
    avalanche: LAVIN('Västra Härjedalen'),
    airports: [{ name: 'Sveg', code: 'EVG', km: 75 }, { name: 'Östersund', code: 'OSD', km: 190 }],
    transfer: 'By car ~6 h from Stockholm. Train to Sveg or Östersund, then bus or taxi.',
  },
  {
    id: 'are', name: 'Åre', area: 'SkiStar Åre', country: 'SE', region: 'Jämtland',
    lat: 63.399, lon: 13.081, top: 1274, base: 380, km: 100, tags: ['freeride', 'park', 'family', 'touring', 'big'],
    season: 'Late Nov – early May',
    about: 'Sweden\'s biggest vertical. Off-piste from the Åreskutan top, a big park, and touring on the surrounding fells.',
    web: 'https://www.skistar.com/en/ski-destinations/are/', passUrl: 'https://www.skistar.com/en/ski-destinations/are/ski-pass/',
    avalanche: LAVIN('Jämtlandsfjällen'),
    airports: [{ name: 'Åre Östersund', code: 'OSD', km: 100 }],
    station: { name: 'Åre station (SJ day and night trains from Stockholm)', km: 0 },
    transfer: 'The station is in the village: the SJ night train from Stockholm arrives in the morning.',
  },
  {
    id: 'riksgransen', name: 'Riksgränsen', country: 'SE', region: 'Lappland',
    lat: 68.427, lon: 18.127, top: 909, base: 500, km: 20, tags: ['freeride', 'touring', 'late', 'snowsure'],
    season: 'Mid Feb – Midsummer',
    about: 'The freeride classic above the Arctic Circle: steep off-piste, heli and midnight-sun skiing in May–June.',
    web: 'https://riksgransen.se/en/', passUrl: 'https://riksgransen.se/en/',
    avalanche: LAVIN('Riksgränsen'),
    airports: [{ name: 'Kiruna', code: 'KRN', km: 130 }, { name: 'Harstad/Narvik Evenes', code: 'EVE', km: 120 }],
    station: { name: 'Riksgränsen station (Vy night train Stockholm–Narvik)', km: 0 },
    transfer: 'The night train from Stockholm stops at the resort (~18 h).',
  },
  {
    id: 'hemavan', name: 'Hemavan', country: 'SE', region: 'Lappland',
    lat: 65.815, lon: 15.09, top: 1132, base: 470, km: 40, tags: ['freeride', 'family', 'touring'],
    season: 'Late Nov – mid May',
    about: 'Long, open runs above the tree line and easy access to off-piste and touring in the Kungsleden area.',
    web: 'https://www.hemavanfjallcenter.se/', passUrl: 'https://www.hemavanfjallcenter.se/',
    avalanche: LAVIN('Södra Lappland'),
    airports: [{ name: 'Hemavan Tärnaby', code: 'HMV', km: 3 }, { name: 'Umeå', code: 'UME', km: 300 }],
    transfer: 'Flights from Arlanda to Hemavan Tärnaby; the airport is next to the lifts.',
  },
  {
    id: 'kittelfjall', name: 'Kittelfjäll', country: 'SE', region: 'Lappland',
    lat: 65.25, lon: 15.52, top: 900, base: 520, km: 15, tags: ['freeride', 'touring'],
    season: 'Dec – May',
    about: 'Small lift system, big terrain. Known for steep freeride and very few people.',
    web: 'https://www.kittelfjall.se/', passUrl: 'https://www.kittelfjall.se/',
    avalanche: LAVIN('Södra Lappland'),
    airports: [{ name: 'Vilhelmina', code: 'VHM', km: 120 }],
    transfer: 'By car ~10 h from Stockholm, or fly to Vilhelmina and drive.',
  },
  // ---------- Norway ----------
  {
    id: 'hemsedal', name: 'Hemsedal', area: 'SkiStar Hemsedal', country: 'NO', region: 'Buskerud',
    lat: 60.865, lon: 8.553, top: 1450, base: 625, km: 51, tags: ['freeride', 'park', 'family'],
    season: 'Late Nov – early May',
    about: 'The "Scandinavian Alps": steep inbounds terrain, tree skiing and a strong park.',
    web: 'https://www.skistar.com/en/ski-destinations/hemsedal/', passUrl: 'https://www.skistar.com/en/ski-destinations/hemsedal/ski-pass/',
    avalanche: { kind: 'nve' },
    airports: [{ name: 'Oslo Gardermoen', code: 'OSL', km: 230 }],
    transfer: 'Fly to Oslo, then the Hemsedal ski bus or a rental car (~3 h).',
  },
  {
    id: 'trysil', name: 'Trysil', area: 'SkiStar Trysil', country: 'NO', region: 'Innlandet',
    lat: 61.31, lon: 12.27, top: 1132, base: 415, km: 80, tags: ['family', 'park', 'big'],
    season: 'Late Nov – late Apr',
    about: 'Norway\'s biggest resort: lots of cruising and family terrain, several parks.',
    web: 'https://www.skistar.com/en/ski-destinations/trysil/', passUrl: 'https://www.skistar.com/en/ski-destinations/trysil/ski-pass/',
    avalanche: { kind: 'nve' },
    airports: [{ name: 'Scandinavian Mountains (Sälen)', code: 'SCR', km: 45 }, { name: 'Oslo Gardermoen', code: 'OSL', km: 190 }],
    transfer: 'By car ~6 h from Stockholm via Sälen.',
  },
  {
    id: 'narvik', name: 'Narvikfjellet', country: 'NO', region: 'Nordland',
    lat: 68.43, lon: 17.43, top: 1000, base: 150, km: 20, tags: ['freeride', 'touring', 'late'],
    season: 'Dec – May',
    about: 'Skiing straight above the fjord. Big off-piste lines and an easy pairing with Riksgränsen.',
    web: 'https://narvikfjellet.no/', passUrl: 'https://narvikfjellet.no/',
    avalanche: { kind: 'nve' },
    airports: [{ name: 'Harstad/Narvik Evenes', code: 'EVE', km: 80 }],
    station: { name: 'Narvik station (Vy night train from Stockholm)', km: 2 },
  },
  // ---------- France ----------
  {
    id: 'alpedhuez', name: 'Alpe d\'Huez', area: 'Alpe d\'Huez Grand Domaine', country: 'FR', region: 'Isère, Oisans',
    lat: 45.092, lon: 6.069, top: 3330, base: 1100, km: 250, lifts: 70, tags: ['freeride', 'park', 'family', 'big', 'snowsure', 'glacier'],
    season: '5 Dec 2026 – 25 Apr 2027',
    about: 'Sunny south-facing area with 2 200 m of vertical from the Pic Blanc. Home of the Sarenne, one of the longest black runs in the Alps (16 km), plus serious off-piste and a big park.',
    web: 'https://www.alpedhuez.com/en/', passUrl: 'https://skipass.alpedhuez.com/hiver/en/long-stay-holidays/',
    pass: { text: 'Adult day ~68 €, 6 days ~336.50 € (main season 2026/27)', source: 'guide-ski.fr', asOf: '2026-11' },
    avalanche: BERA('Grandes Rousses'),
    airports: [
      { name: 'Grenoble Alpes Isère', code: 'GNB', km: 100, note: 'Mostly UK charter flights; nothing direct from Stockholm' },
      { name: 'Lyon Saint-Exupéry', code: 'LYS', km: 150, note: 'Norwegian flies non-stop from Arlanda on Mon and Fri from late Jan 2027' },
      { name: 'Geneva', code: 'GVA', km: 220, note: 'SAS and SWISS fly non-stop from Arlanda' },
    ],
    station: { name: 'Grenoble (TGV from Paris Gare de Lyon, ~3 h)', km: 63 },
    transfer: 'Transaltitude bus from Grenoble bus station, ~1 h 30, about 5 a day, ~17–20 €. The last 14 km are the 21 hairpins from Bourg-d\'Oisans.',
  },
  {
    id: 'laclusaz', name: 'La Clusaz', country: 'FR', region: 'Haute-Savoie, Aravis',
    lat: 45.904, lon: 6.424, top: 2477, base: 1100, km: 125, tags: ['freeride', 'family'],
    season: 'Mid Dec – mid Apr',
    about: 'Authentic village resort an hour from Geneva, with five linked mountains and excellent freeride on the Balme sector.',
    web: 'https://www.laclusaz.com/en/', passUrl: 'https://www.laclusaz.com/en/',
    avalanche: BERA('Aravis'),
    airports: [{ name: 'Geneva', code: 'GVA', km: 50, note: 'SAS and SWISS fly non-stop from Arlanda' }],
    station: { name: 'Annecy', km: 32 },
    transfer: 'Bus or shuttle from Geneva airport (~1 h 15) or from Annecy station (~50 min).',
  },
  {
    id: 'chamonix', name: 'Chamonix', country: 'FR', region: 'Haute-Savoie, Mont-Blanc',
    lat: 45.924, lon: 6.869, top: 3842, base: 1035, km: 150, tags: ['freeride', 'touring', 'glacier'],
    season: 'Mid Dec – early May',
    about: 'The freeride capital: Grands Montets, the Vallée Blanche from the Aiguille du Midi, and endless touring.',
    web: 'https://www.chamonix.com/', passUrl: 'https://www.montblancnaturalresort.com/',
    avalanche: BERA('Mont-Blanc'),
    airports: [{ name: 'Geneva', code: 'GVA', km: 88, note: 'SAS and SWISS fly non-stop from Arlanda' }],
    transfer: 'Shared shuttles from Geneva airport, ~1 h 15.',
  },
  {
    id: 'lagrave', name: 'La Grave', country: 'FR', region: 'Hautes-Alpes, Oisans',
    lat: 45.045, lon: 6.306, top: 3550, base: 1450, km: 2, tags: ['freeride', 'touring', 'glacier'],
    season: 'Dec – Apr (lift operations vary)',
    about: 'Almost no pistes: one lift, 2 100 m of unmarked, unpatrolled high-alpine terrain. Guide strongly recommended.',
    web: 'https://www.la-grave.com/', passUrl: 'https://www.la-grave.com/',
    avalanche: BERA('Oisans'),
    airports: [{ name: 'Lyon Saint-Exupéry', code: 'LYS', km: 170 }, { name: 'Geneva', code: 'GVA', km: 230 }],
    station: { name: 'Grenoble', km: 80 },
    transfer: 'Next valley over from Alpe d\'Huez (~1 h by car via Bourg-d\'Oisans).',
  },
  {
    id: 'valthorens', name: 'Val Thorens', area: 'Les 3 Vallées', country: 'FR', region: 'Savoie, Vanoise',
    lat: 45.297, lon: 6.58, top: 3230, base: 1300, km: 600, tags: ['park', 'family', 'big', 'snowsure'],
    season: 'Late Nov – early May',
    about: 'Highest resort in the 3 Vallées, the world\'s largest linked area. Very snow-sure, big parks.',
    web: 'https://www.valthorens.com/en/', passUrl: 'https://www.valthorens.com/en/',
    avalanche: BERA('Vanoise'),
    airports: [{ name: 'Geneva', code: 'GVA', km: 180 }, { name: 'Lyon Saint-Exupéry', code: 'LYS', km: 190 }],
    station: { name: 'Moûtiers (TGV and Eurostar Snow)', km: 37 },
    transfer: 'Bus from Moûtiers station, ~1 h.',
  },
  {
    id: 'tignes', name: 'Tignes', area: 'Tignes – Val d\'Isère', country: 'FR', region: 'Savoie, Haute-Tarentaise',
    lat: 45.468, lon: 6.906, top: 3456, base: 1550, km: 300, tags: ['freeride', 'park', 'glacier', 'big', 'snowsure'],
    season: 'Late Nov – early May',
    about: 'High, snow-sure and huge, with the Grande Motte glacier and some of the best lift-served off-piste in France.',
    web: 'https://en.tignes.net/', passUrl: 'https://en.tignes.net/',
    avalanche: BERA('Haute-Tarentaise'),
    airports: [{ name: 'Geneva', code: 'GVA', km: 160 }, { name: 'Lyon Saint-Exupéry', code: 'LYS', km: 220 }],
    station: { name: 'Bourg-Saint-Maurice', km: 30 },
    transfer: 'Bus from Bourg-Saint-Maurice station, ~45 min.',
  },
  // ---------- Switzerland ----------
  {
    id: 'zermatt', name: 'Zermatt', area: 'Matterhorn Ski Paradise', country: 'CH', region: 'Valais',
    lat: 46.02, lon: 7.749, top: 3883, base: 1620, km: 360, tags: ['freeride', 'touring', 'glacier', 'snowsure', 'big'],
    season: 'All year on the glacier; full area late Nov – early May',
    about: 'Car-free village under the Matterhorn, linked to Cervinia in Italy. Highest lift-served skiing in the Alps.',
    web: 'https://www.zermatt.ch/en', passUrl: 'https://www.matterhornparadise.ch/en/information/tickets-prices/ski-passes',
    pass: { text: 'Day pass from 89 CHF (dynamic; more in high season)', source: 'matterhornparadise.ch', asOf: '2026-11' },
    avalanche: { kind: 'slf', region: 'CH-4222' },
    airports: [{ name: 'Geneva', code: 'GVA', km: 230 }, { name: 'Zürich', code: 'ZRH', km: 240 }],
    station: { name: 'Zermatt (train via Visp)', km: 0 },
    transfer: 'Train from Geneva or Zürich airport to Visp, then the Matterhorn Gotthard Bahn (~3.5 h in total).',
  },
  {
    id: 'verbier', name: 'Verbier', area: '4 Vallées', country: 'CH', region: 'Valais',
    lat: 46.096, lon: 7.228, top: 3330, base: 820, km: 410, tags: ['freeride', 'touring', 'big'],
    season: 'Early Dec – late Apr',
    about: 'Home of the Freeride World Tour finale on the Bec des Rosses. Steep, lift-served off-piste.',
    web: 'https://www.verbier.ch/en/', passUrl: 'https://www.verbier4vallees.ch/en/',
    avalanche: { kind: 'slf', region: 'CH-4115' },
    airports: [{ name: 'Geneva', code: 'GVA', km: 160 }],
    station: { name: 'Le Châble (gondola to Verbier)', km: 0 },
    transfer: 'Train from Geneva airport to Le Châble (~2 h), then the gondola.',
  },
  {
    id: 'engelberg', name: 'Engelberg', area: 'Titlis', country: 'CH', region: 'Central Switzerland',
    lat: 46.82, lon: 8.4, top: 3020, base: 1050, km: 82, tags: ['freeride', 'touring', 'glacier'],
    season: 'Oct (glacier) – May',
    about: 'Famous for the Laub and long freeride lines off the Titlis glacier. Easy train access from Zürich.',
    web: 'https://www.engelberg.ch/en/', passUrl: 'https://www.titlis.ch/en/',
    avalanche: { kind: 'slf', region: 'CH-2122' },
    airports: [{ name: 'Zürich', code: 'ZRH', km: 100 }],
    station: { name: 'Engelberg (train from Lucerne)', km: 0 },
    transfer: 'Train from Zürich airport via Lucerne, ~1 h 45.',
  },
  {
    id: 'laax', name: 'Laax', area: 'Flims Laax Falera', country: 'CH', region: 'Graubünden',
    lat: 46.81, lon: 9.26, top: 3018, base: 1100, km: 224, tags: ['park', 'freeride', 'family', 'big'],
    season: 'Late Oct – mid Apr',
    about: 'Europe\'s park reference: several parks and a superpipe, plus wide freeride terrain.',
    web: 'https://www.flimslaax.com/en/', passUrl: 'https://www.flimslaax.com/en/',
    avalanche: { kind: 'slf', region: 'CH-5124' },
    airports: [{ name: 'Zürich', code: 'ZRH', km: 150 }],
    station: { name: 'Chur', km: 25 },
    transfer: 'Train to Chur, then PostBus to Laax (~30 min).',
  },
  // ---------- Austria ----------
  {
    id: 'solden', name: 'Sölden', country: 'AT', region: 'Tyrol, Ötztal',
    lat: 46.966, lon: 11.007, top: 3340, base: 1350, km: 144, tags: ['glacier', 'park', 'freeride', 'snowsure'],
    season: 'Oct (glaciers) – early May',
    about: 'Two glaciers, three 3 000 m peaks and the season-opening World Cup. A top early-season pick.',
    web: 'https://www.soelden.com/en/', passUrl: 'https://www.soelden.com/en/search-book/ski-mountain-lift-tickets/ticket-overview/1-day-solden.lt-208481',
    pass: { text: 'Adult day 86.50 € in high season, from 81 € online', source: 'bergfex.com, soelden.com', asOf: '2026-11' },
    avalanche: { kind: 'euregio', region: 'AT-07-20' },
    airports: [{ name: 'Innsbruck', code: 'INN', km: 85 }, { name: 'Munich', code: 'MUC', km: 250 }],
    station: { name: 'Ötztal station (bus up the valley)', km: 37 },
    transfer: 'Train to Ötztal Bahnhof, then the Ötztal bus (~1 h).',
  },
  {
    id: 'stanton', name: 'St. Anton am Arlberg', area: 'Ski Arlberg', country: 'AT', region: 'Tyrol',
    lat: 47.129, lon: 10.268, top: 2811, base: 1304, km: 305, tags: ['freeride', 'touring', 'big'],
    season: 'Early Dec – late Apr',
    about: 'Legendary steep skiing and off-piste, linked to Lech and Zürs.',
    web: 'https://www.stantonamarlberg.com/en/', passUrl: 'https://www.skiarlberg.at/en/',
    avalanche: { kind: 'euregio', region: 'AT-07-07' },
    airports: [{ name: 'Innsbruck', code: 'INN', km: 100 }, { name: 'Zürich', code: 'ZRH', km: 200 }],
    station: { name: 'St. Anton (Railjet stop)', km: 0 },
    transfer: 'Direct trains from Zürich airport and Innsbruck stop in the village.',
  },
  {
    id: 'mayrhofen', name: 'Mayrhofen', area: 'Mayrhofen – Hippach', country: 'AT', region: 'Tyrol, Zillertal',
    lat: 47.167, lon: 11.865, top: 2500, base: 630, km: 136, tags: ['park', 'family'],
    season: 'Early Dec – mid Apr',
    about: 'Penken Park is one of Europe\'s best-known parks. Also has the steepest groomed run in Austria (Harakiri).',
    web: 'https://www.mayrhofen.at/en/', passUrl: 'https://www.mayrhofner-bergbahnen.com/en/',
    avalanche: { kind: 'euregio', region: 'AT-07-23-02' },
    airports: [{ name: 'Innsbruck', code: 'INN', km: 70 }, { name: 'Munich', code: 'MUC', km: 180 }],
    station: { name: 'Mayrhofen (Zillertalbahn from Jenbach)', km: 0 },
  },
  {
    id: 'hintertux', name: 'Hintertux Glacier', country: 'AT', region: 'Tyrol, Zillertal',
    lat: 47.07, lon: 11.67, top: 3250, base: 1500, km: 60, tags: ['glacier', 'park', 'snowsure'],
    season: 'All year',
    about: 'Austria\'s only year-round ski area. Good early-season park and training spot.',
    web: 'https://www.hintertuxergletscher.at/en/', passUrl: 'https://www.hintertuxergletscher.at/en/',
    avalanche: { kind: 'euregio', region: 'AT-07-23-02' },
    airports: [{ name: 'Innsbruck', code: 'INN', km: 90 }],
    station: { name: 'Mayrhofen', km: 20 },
    transfer: 'Free ski bus from Mayrhofen (~40 min).',
  },
]


const LAWIS = (label: string, url: string): Avalanche => ({ kind: 'link', label, url })
const AINEVA: Avalanche = LAWIS('AINEVA avalanche bulletins (Italy)', 'https://bollettini.aineva.it/')
const NONE: Avalanche = LAWIS('Low avalanche terrain: no regional forecast', 'https://lavinprognoser.se/')
type R = [id: string, name: string, country: Country, region: string, lat: number, lon: number, base: number, top: number, km: number, tags: Tag[], season: string, about: string, web: string, avalanche: Avalanche, airports: Hub[], station?: Hub, transfer?: string, area?: string]
const r = (x: R): Resort => ({
  id: x[0], name: x[1], country: x[2], region: x[3], lat: x[4], lon: x[5], base: x[6], top: x[7], km: x[8], tags: x[9],
  season: x[10], about: x[11], web: x[12], passUrl: x[12], avalanche: x[13], airports: x[14], station: x[15], transfer: x[16], area: x[17],
})
const ARN: Hub = { name: 'Stockholm Arlanda', code: 'ARN', km: 40 }
const GVA = (km: number): Hub => ({ name: 'Geneva', code: 'GVA', km, note: 'SAS and SWISS fly non-stop from Arlanda' })
const LYS = (km: number): Hub => ({ name: 'Lyon Saint-Exupéry', code: 'LYS', km })
const MRS = (km: number): Hub => ({ name: 'Marseille Provence', code: 'MRS', km })
const ZRH = (km: number): Hub => ({ name: 'Zürich', code: 'ZRH', km })
const INN = (km: number): Hub => ({ name: 'Innsbruck', code: 'INN', km })
const MUC = (km: number): Hub => ({ name: 'Munich', code: 'MUC', km })
const SZG = (km: number): Hub => ({ name: 'Salzburg', code: 'SZG', km })
const MXP = (km: number): Hub => ({ name: 'Milan Malpensa', code: 'MXP', km })
const TRN = (km: number): Hub => ({ name: 'Turin', code: 'TRN', km })
const VCE = (km: number): Hub => ({ name: 'Venice', code: 'VCE', km })
const VRN = (km: number): Hub => ({ name: 'Verona', code: 'VRN', km })
const OSL = (km: number): Hub => ({ name: 'Oslo Gardermoen', code: 'OSL', km })
const BGO = (km: number): Hub => ({ name: 'Bergen', code: 'BGO', km })
const SCR = (km: number): Hub => ({ name: 'Scandinavian Mountains (Sälen)', code: 'SCR', km })
const SALZ = LAWIS('Lawinenwarndienst Salzburg', 'https://lawine.salzburg.at/')
const VBG = LAWIS('Lawinenwarndienst Vorarlberg', 'https://www.vorarlberg.at/lawine')

export const MORE_RESORTS: Resort[] = ([
  // ---------- Stockholm hills ----------
  ['hammarbybacken', 'Hammarbybacken', 'SE', 'Stockholm', 59.300, 18.104, 0, 93, 2, ['local', 'park', 'night', 'family'], 'Dec – Mar (snow-making)', 'The city hill in Södermalm\'s backyard, with a park and night skiing. A quick session after work.', 'https://www.hammarbybacken.se/', NONE, [ARN], { name: 'Gullmarsplan (tunnelbana)', km: 1 }],
  ['ekebyhovsbacken', 'Ekebyhovsbacken', 'SE', 'Ekerö, Stockholm', 59.290, 17.802, 10, 80, 1.5, ['local', 'family', 'night'], 'Dec – Mar (snow-making)', 'Small family hill on Ekerö with lit slopes in the evenings.', 'https://www.ekebyhovsbacken.se/', NONE, [ARN], { name: 'Brommaplan, then bus to Ekerö', km: 12 }],
  ['vasjobacken', 'Väsjöbacken', 'SE', 'Sollentuna, Stockholm', 59.452, 17.905, 20, 85, 1.5, ['local', 'family', 'night', 'park'], 'Dec – Mar (snow-making)', 'Sollentuna\'s hill by lake Väsjön: short runs, a small park and floodlights.', 'https://www.vasjobacken.se/', NONE, [ARN], { name: 'Sollentuna station', km: 3 }],
  ['bruket', 'Bruket', 'SE', 'Järfälla, Stockholm', 59.430, 17.830, 15, 70, 1, ['local', 'family', 'night'], 'Dec – Mar (when cold enough)', 'Small local hill in Järfälla (position approximate).', 'https://www.jarfalla.se/', NONE, [ARN], { name: 'Jakobsberg station', km: 3 }],
  ['flottsbro', 'Flottsbro', 'SE', 'Huddinge, Stockholm', 59.234, 17.884, 10, 90, 2, ['local', 'family', 'night', 'park'], 'Dec – Mar (snow-making)', 'South Stockholm hill above lake Orlången, with a park and night skiing.', 'https://www.flottsbro.se/', NONE, [ARN], { name: 'Huddinge station, then bus', km: 5 }],
  // ---------- Sweden ----------
  ['kungsberget', 'Kungsberget', 'SE', 'Gästrikland', 60.773, 16.468, 140, 440, 22, ['family', 'park', 'night'], 'Late Nov – mid Apr', 'Closest big hill to Stockholm (~2.5 h by car): good family terrain, parks and night skiing.', 'https://www.kungsberget.se/', NONE, [ARN], { name: 'Sandviken', km: 25 }, 'By car ~2.5 h from Stockholm (210 km) via E4 and Sandviken.'],
  ['hundfjallet', 'Hundfjället', 'SE', 'Dalarna', 61.160, 12.950, 460, 860, 30, ['family', 'park'], 'Late Nov – late Apr', 'Sälen\'s high side: long runs from the top and easy links to Tandådalen.', 'https://www.skistar.com/en/ski-destinations/salen/', NONE, [SCR(15), ARN], undefined, 'By car ~5 h (420 km) via Mora, or a ski bus from Stockholm.', 'SkiStar Sälen'],
  ['lindvallen', 'Lindvallen', 'SE', 'Dalarna', 61.152, 13.183, 420, 790, 35, ['family', 'park'], 'Late Nov – late Apr', 'Sälen\'s busiest area: family-friendly runs, big park, linked to Högfjället.', 'https://www.skistar.com/en/ski-destinations/salen/', NONE, [SCR(10), ARN], undefined, 'By car ~4.5 h from Stockholm.', 'SkiStar Sälen'],
  ['tandadalen', 'Tandådalen', 'SE', 'Dalarna', 61.172, 12.990, 520, 860, 30, ['family', 'park'], 'Late Nov – late Apr', 'Linked with Hundfjället; open runs above the tree line.', 'https://www.skistar.com/en/ski-destinations/salen/', NONE, [SCR(15)], undefined, 'By car ~5 h from Stockholm.', 'SkiStar Sälen'],
  ['vemdalsskalet', 'Vemdalsskalet', 'SE', 'Härjedalen', 62.470, 13.970, 600, 920, 25, ['family', 'park', 'freeride'], 'Late Nov – early May', 'Vemdalen\'s steepest side, with a good park. Lift pass shared with Björnrike and Klövsjö.', 'https://www.skistar.com/en/ski-destinations/vemdalen/', LAVIN('Västra Härjedalen'), [{ name: 'Sveg', code: 'EVG', km: 70 }, { name: 'Åre Östersund', code: 'OSD', km: 110 }], undefined, 'By car ~6 h from Stockholm.', 'SkiStar Vemdalen'],
  ['bjornrike', 'Björnrike', 'SE', 'Härjedalen', 62.420, 13.920, 600, 920, 20, ['family'], 'Late Nov – late Apr', 'Calm, family-oriented part of Vemdalen with wide groomers.', 'https://www.skistar.com/en/ski-destinations/vemdalen/', NONE, [{ name: 'Åre Östersund', code: 'OSD', km: 110 }], undefined, 'By car ~6 h from Stockholm.', 'SkiStar Vemdalen'],
  ['funasdalen', 'Funäsfjällen', 'SE', 'Härjedalen', 62.540, 12.550, 580, 975, 70, ['family', 'touring', 'snowsure'], 'Early Nov – early May', 'Six linked villages (Funäsdalen, Tänndalen, Ramundberget…) on one pass, with cross-country and touring everywhere.', 'https://www.funasfjallen.se/', LAVIN('Västra Härjedalen'), [{ name: 'Sveg', code: 'EVG', km: 110 }, { name: 'Röros', code: 'RRS', km: 60 }], undefined, 'By car ~7 h from Stockholm.'],
  ['branas', 'Branäs', 'SE', 'Värmland', 60.660, 13.030, 180, 520, 25, ['family', 'park', 'night'], 'Late Nov – mid Apr', 'Big family resort in Värmland, popular for weekends from Stockholm and Gothenburg.', 'https://www.branas.se/', NONE, [{ name: 'Karlstad', code: 'KSD', km: 140 }], undefined, 'By car ~5 h from Stockholm.'],
  ['romme', 'Romme Alpin', 'SE', 'Dalarna', 60.390, 15.370, 170, 430, 20, ['family', 'park', 'night'], 'Late Nov – early Apr', 'Mid-Sweden\'s biggest day-trip hill near Borlänge, with a strong park.', 'https://www.rommealpin.se/', NONE, [{ name: 'Dala Airport (Borlänge)', code: 'BLE', km: 15 }], { name: 'Borlänge', km: 15 }, 'By car ~2.5 h from Stockholm; train to Borlänge, then bus.'],
  ['jarvso', 'Järvsö', 'SE', 'Hälsingland', 61.720, 16.130, 100, 395, 15, ['family', 'park', 'night'], 'Late Nov – mid Apr', 'Compact resort above the Ljusnan valley with a park and some steeper runs.', 'https://www.jarvsobacken.se/', NONE, [ARN], { name: 'Järvsö (train from Stockholm)', km: 2 }, 'Direct trains from Stockholm, ~3 h.'],
  ['bjorkliden', 'Björkliden', 'SE', 'Lappland', 68.405, 18.680, 400, 1260, 25, ['freeride', 'touring', 'late'], 'Feb – early May', 'Above lake Torneträsk: steep off-piste, couloirs and spring touring. Sister resort of Riksgränsen.', 'https://bjorkliden.com/', LAVIN('Abisko/Björkliden'), [{ name: 'Kiruna', code: 'KRN', km: 95 }], { name: 'Björkliden (night train Stockholm–Narvik)', km: 0 }],
  // ---------- Norway ----------
  ['geilo', 'Geilo', 'NO', 'Viken', 60.534, 8.206, 800, 1178, 39, ['family', 'park'], 'Late Nov – late Apr', 'Classic Norwegian family resort right on the Oslo–Bergen railway.', 'https://www.skigeilo.no/', { kind: 'nve' }, [OSL(250)], { name: 'Geilo (Bergen line)', km: 0 }, 'Train from Oslo, ~3.5 h.'],
  ['hafjell', 'Hafjell', 'NO', 'Innlandet', 61.230, 10.450, 195, 1030, 45, ['family', 'park'], 'Late Nov – late Apr', 'Olympic resort near Lillehammer with long groomers and a big park.', 'https://www.hafjell.no/', { kind: 'nve' }, [OSL(180)], { name: 'Lillehammer', km: 15 }],
  ['kvitfjell', 'Kvitfjell', 'NO', 'Innlandet', 61.470, 10.120, 185, 1040, 33, ['freeride'], 'Dec – Apr', 'World Cup downhill venue: steep, fast and often quiet.', 'https://www.kvitfjell.no/', { kind: 'nve' }, [OSL(220)], { name: 'Kvitfjell station', km: 1 }],
  ['oppdal', 'Oppdal', 'NO', 'Trøndelag', 62.594, 9.690, 545, 1300, 55, ['freeride', 'touring', 'family'], 'Late Nov – early May', 'Four linked mountains with lots of off-piste and touring around Dovrefjell.', 'https://www.oppdalskisenter.no/', { kind: 'nve' }, [{ name: 'Trondheim', code: 'TRD', km: 140 }], { name: 'Oppdal (Dovre line)', km: 2 }],
  ['norefjell', 'Norefjell', 'NO', 'Viken', 60.190, 9.490, 185, 1185, 30, ['family'], 'Late Nov – late Apr', 'Norway\'s biggest vertical close to Oslo (1 000 m).', 'https://www.norefjellskisenter.no/', { kind: 'nve' }, [OSL(130)]],
  ['voss', 'Voss Resort', 'NO', 'Vestland', 60.650, 6.380, 60, 960, 40, ['freeride', 'family'], 'Dec – Apr', 'Gondola from the town centre; deep west-coast snow and freeride.', 'https://www.vossresort.no/', { kind: 'nve' }, [BGO(100)], { name: 'Voss (Bergen line)', km: 0 }],
  ['myrkdalen', 'Myrkdalen', 'NO', 'Vestland', 60.830, 6.530, 300, 1100, 30, ['freeride', 'snowsure'], 'Late Nov – early May', 'One of Norway\'s snowiest resorts thanks to the coastal climate.', 'https://www.myrkdalen.no/', { kind: 'nve' }, [BGO(130)], { name: 'Voss', km: 30 }],
  ['strandafjellet', 'Strandafjellet', 'NO', 'Møre og Romsdal', 62.310, 6.980, 120, 1000, 12, ['freeride', 'touring'], 'Dec – Apr', 'Fjord views from every lift and big Sunnmøre freeride lines.', 'https://www.strandafjellet.no/', { kind: 'nve' }, [{ name: 'Ålesund', code: 'AES', km: 75 }]],
  ['beitostolen', 'Beitostølen', 'NO', 'Innlandet', 61.250, 8.910, 900, 1240, 25, ['family', 'park'], 'Nov – Apr', 'Mountain village at the gate of Jotunheimen, known for cross-country too.', 'https://www.beitostolen.no/', { kind: 'nve' }, [OSL(230)]],
  ['lyngen', 'Lyngen Alps', 'NO', 'Troms', 69.600, 20.200, 0, 1500, 0, ['freeride', 'touring', 'late'], 'Mar – May (touring)', 'No lifts: ski-touring from the fjord to 1 500 m peaks. Go with a guide or strong touring skills.', 'https://www.visitnorway.com/', { kind: 'nve' }, [{ name: 'Tromsø', code: 'TOS', km: 90 }]],
  // ---------- France ----------
  ['vars', 'Vars', 'FR', 'Hautes-Alpes', 44.570, 6.700, 1650, 2750, 185, ['freeride', 'park', 'family', 'snowsure'], 'Dec – mid Apr', 'Forêt Blanche with Risoul: sunny southern Alps, wooded runs, a big park and the speed-ski track.', 'https://www.vars.com/', BERA('Embrunais-Parpaillon'), [MRS(220), LYS(250)], { name: 'Montdauphin-Guillestre', km: 20 }, 'Bus from Montdauphin-Guillestre station, ~30 min.', 'La Forêt Blanche'],
  ['praloup', 'Pra Loup', 'FR', 'Alpes-de-Haute-Provence', 44.370, 6.600, 1500, 2600, 180, ['family', 'freeride'], 'Mid Dec – early Apr', 'Above Barcelonnette, linked with Val d\'Allos in the Espace Lumière.', 'https://www.praloup.com/', BERA('Ubaye'), [MRS(220), { name: 'Nice', code: 'NCE', km: 190 }], undefined, 'By car from Barcelonnette, 15 min.', 'Espace Lumière'],
  ['montclar', 'Montclar', 'FR', 'Alpes-de-Haute-Provence', 44.400, 6.330, 1350, 2500, 50, ['family'], 'Mid Dec – late Mar', 'Small, friendly resort above Saint-Vincent-les-Forts and Lac de Serre-Ponçon.', 'https://www.montclar.com/', BERA('Ubaye'), [MRS(190)], { name: 'Gap', km: 45 }, '10 min from Saint-Vincent-les-Forts.', 'Montclar Les 2 Vallées'],
  ['valdisere', 'Val d\'Isère', 'FR', 'Savoie, Haute-Tarentaise', 45.448, 6.980, 1785, 3456, 300, ['freeride', 'park', 'glacier', 'big', 'snowsure'], 'Late Nov – early May', 'Legendary off-piste and the Face de Bellevarde, linked with Tignes.', 'https://www.valdisere.com/', BERA('Haute-Tarentaise'), [GVA(170)], { name: 'Bourg-Saint-Maurice', km: 30 }, undefined, 'Tignes – Val d\'Isère'],
  ['courchevel', 'Courchevel', 'FR', 'Savoie, Vanoise', 45.415, 6.634, 1100, 2738, 600, ['family', 'big', 'park'], 'Early Dec – mid Apr', 'Polished grooming and the Grand Couloir, in the 3 Vallées.', 'https://www.courchevel.com/', BERA('Vanoise'), [GVA(150)], { name: 'Moûtiers', km: 25 }, undefined, 'Les 3 Vallées'],
  ['meribel', 'Méribel', 'FR', 'Savoie, Vanoise', 45.396, 6.566, 1400, 2952, 600, ['family', 'park', 'big'], 'Early Dec – mid Apr', 'Central valley of the 3 Vallées with a big park at Moonpark.', 'https://www.meribel.net/', BERA('Vanoise'), [GVA(150)], { name: 'Moûtiers', km: 18 }, undefined, 'Les 3 Vallées'],
  ['lesarcs', 'Les Arcs', 'FR', 'Savoie, Haute-Tarentaise', 45.572, 6.830, 1200, 3226, 425, ['freeride', 'park', 'big'], 'Mid Dec – late Apr', 'Funicular from Bourg-Saint-Maurice station; Aiguille Rouge descent of 2 000 m. Linked to La Plagne (Paradiski).', 'https://www.lesarcs.com/', BERA('Haute-Tarentaise'), [GVA(150)], { name: 'Bourg-Saint-Maurice (funicular)', km: 0 }, undefined, 'Paradiski'],
  ['laplagne', 'La Plagne', 'FR', 'Savoie, Vanoise', 45.507, 6.677, 1250, 3250, 425, ['family', 'big', 'glacier'], 'Mid Dec – late Apr', 'Huge, mostly intermediate area with the Bellecôte glacier and Paradiski link.', 'https://www.la-plagne.com/', BERA('Vanoise'), [GVA(150)], { name: 'Aime-La Plagne', km: 18 }, undefined, 'Paradiski'],
  ['les2alpes', 'Les 2 Alpes', 'FR', 'Isère, Oisans', 45.007, 6.122, 1300, 3600, 200, ['park', 'glacier', 'snowsure', 'freeride'], 'Late Nov – early May', 'Glacier to 3 600 m and a famous park; next valley over from Alpe d\'Huez and La Grave.', 'https://www.les2alpes.com/', BERA('Oisans'), [LYS(160), GVA(230)], { name: 'Grenoble', km: 75 }, 'Transaltitude bus from Grenoble, ~1 h 40.'],
  ['serrechevalier', 'Serre Chevalier', 'FR', 'Hautes-Alpes, Briançonnais', 44.940, 6.550, 1200, 2800, 250, ['freeride', 'family', 'big'], 'Mid Dec – late Apr', 'Larch forests, great tree skiing on storm days, and Briançon\'s old town.', 'https://www.serre-chevalier.com/', BERA('Briançonnais'), [{ name: 'Turin', code: 'TRN', km: 110 }, LYS(220)], { name: 'Briançon (night train from Paris)', km: 5 }],
  ['avoriaz', 'Avoriaz', 'FR', 'Haute-Savoie, Chablais', 46.190, 6.770, 1100, 2466, 600, ['park', 'family', 'big'], 'Mid Dec – late Apr', 'Car-free, ski-in village and the first snowpark in Europe; Portes du Soleil.', 'https://www.avoriaz.com/', BERA('Chablais'), [GVA(80)], { name: 'Cluses or Thonon', km: 40 }, undefined, 'Portes du Soleil'],
  // ---------- Switzerland ----------
  ['stmoritz', 'St. Moritz', 'CH', 'Graubünden', 46.497, 9.838, 1730, 3303, 350, ['family', 'freeride', 'snowsure'], 'Late Nov – early Apr', 'Engadin sunshine, Corviglia, Diavolezza and the Lagalb freeride.', 'https://www.stmoritz.com/', { kind: 'slf', region: 'CH-7114' }, [ZRH(200)], { name: 'St. Moritz (Rhaetian Railway)', km: 0 }],
  ['davos', 'Davos Klosters', 'CH', 'Graubünden', 46.800, 9.836, 810, 2844, 300, ['freeride', 'park', 'big'], 'Late Nov – late Apr', 'Parsenn classics and long freeride runs down to Klosters.', 'https://www.davos.ch/', { kind: 'slf', region: 'CH-5123' }, [ZRH(150)], { name: 'Davos Platz', km: 0 }],
  ['saasfee', 'Saas-Fee', 'CH', 'Valais', 46.108, 7.929, 1800, 3600, 100, ['glacier', 'park', 'snowsure'], 'Mid Oct – early May', 'Glacier village with early-season park training.', 'https://www.saas-fee.ch/', { kind: 'slf', region: 'CH-4223' }, [GVA(230), ZRH(240)], { name: 'Visp, then PostBus', km: 25 }],
  ['andermatt', 'Andermatt', 'CH', 'Uri', 46.633, 8.594, 1440, 2961, 180, ['freeride', 'snowsure'], 'Late Nov – late Apr', 'Gemsstock is a freeride classic; linked to Sedrun and Disentis.', 'https://www.andermatt-sedrun-disentis.ch/', { kind: 'slf', region: 'CH-2223' }, [ZRH(110)], { name: 'Andermatt', km: 0 }],
  ['cransmontana', 'Crans-Montana', 'CH', 'Valais', 46.310, 7.480, 1500, 3000, 140, ['family', 'glacier'], 'Early Dec – mid Apr', 'South-facing balcony above the Rhône valley with long sunny runs.', 'https://www.crans-montana.ch/', { kind: 'slf', region: 'CH-4121' }, [GVA(180)], { name: 'Sierre (funicular)', km: 0 }],
  ['grindelwald', 'Grindelwald', 'CH', 'Bern, Jungfrau', 46.624, 8.041, 945, 2971, 210, ['family', 'freeride'], 'Mid Dec – mid Apr', 'Under the Eiger: First, Kleine Scheidegg and Männlichen.', 'https://www.jungfrau.ch/', { kind: 'slf', region: 'CH-1242' }, [ZRH(150)], { name: 'Grindelwald', km: 0 }, undefined, 'Jungfrau Ski Region'],
  ['arosa', 'Arosa Lenzerheide', 'CH', 'Graubünden', 46.760, 9.560, 1230, 2865, 225, ['family', 'park'], 'Early Dec – mid Apr', 'Two valleys linked by the Urdenbahn, with plenty of family terrain.', 'https://arosalenzerheide.swiss/', { kind: 'slf', region: 'CH-5221' }, [ZRH(150)], { name: 'Chur', km: 30 }],
  // ---------- Austria ----------
  ['ischgl', 'Ischgl', 'AT', 'Tyrol, Paznaun', 47.012, 10.293, 1400, 2872, 239, ['park', 'big', 'snowsure'], 'Late Nov – early May', 'Silvretta Arena linked with Samnaun (CH): high, snowy and lively.', 'https://www.ischgl.com/', { kind: 'euregio', region: 'AT-07-12' }, [INN(100), ZRH(220)], { name: 'Landeck-Zams', km: 30 }],
  ['kitzbuhel', 'Kitzbühel', 'AT', 'Tyrol', 47.446, 12.392, 800, 2000, 233, ['family', 'big'], 'Mid Oct (Resterkogel) – early May', 'Home of the Hahnenkamm downhill; huge, varied area.', 'https://www.kitzski.at/', { kind: 'euregio', region: 'AT-07-18' }, [SZG(80), MUC(160), INN(100)], { name: 'Kitzbühel', km: 0 }],
  ['saalbach', 'Saalbach', 'AT', 'Salzburg', 47.390, 12.640, 830, 2096, 270, ['park', 'family', 'big'], 'Early Dec – mid Apr', 'Skicircus linked with Hinterglemm, Leogang and Fieberbrunn.', 'https://www.saalbach.com/', SALZ, [SZG(90), MUC(190)], { name: 'Zell am See', km: 20 }, undefined, 'Skicircus'],
  ['obergurgl', 'Obergurgl-Hochgurgl', 'AT', 'Tyrol, Ötztal', 46.870, 11.027, 1800, 3080, 110, ['family', 'snowsure', 'touring'], 'Mid Nov – early May', 'High and snow-sure at the top of the Ötztal, quieter than Sölden.', 'https://www.obergurgl.com/', { kind: 'euregio', region: 'AT-07-21' }, [INN(100)], { name: 'Ötztal station', km: 60 }],
  ['lech', 'Lech Zürs', 'AT', 'Vorarlberg', 47.208, 10.142, 1450, 2811, 305, ['freeride', 'touring', 'snowsure'], 'Early Dec – late Apr', 'Ski Arlberg: deep snow, the Weisse Ring circuit, and lots of off-piste.', 'https://www.lechzuers.com/', VBG, [INN(120), ZRH(200)], { name: 'Langen am Arlberg', km: 15 }, undefined, 'Ski Arlberg'],
  ['stubai', 'Stubai Glacier', 'AT', 'Tyrol', 46.990, 11.115, 1700, 3210, 64, ['glacier', 'park', 'snowsure'], 'Oct – Jun', 'Austria\'s largest glacier area, 45 min from Innsbruck.', 'https://www.stubaier-gletscher.com/', { kind: 'euregio', region: 'AT-07-22' }, [INN(40)], { name: 'Innsbruck, then Stubai bus', km: 40 }],
  ['kaprun', 'Kaprun – Kitzsteinhorn', 'AT', 'Salzburg', 47.218, 12.690, 770, 3029, 41, ['glacier', 'park', 'freeride', 'snowsure'], 'Oct – late May', 'Glacier with freeride routes and parks, above Zell am See.', 'https://www.kitzsteinhorn.at/', SALZ, [SZG(100)], { name: 'Zell am See', km: 10 }],
  ['obertauern', 'Obertauern', 'AT', 'Salzburg', 47.250, 13.560, 1630, 2313, 100, ['snowsure', 'family'], 'Mid Nov – early May', 'Snow bowl ringed by lifts: reliably snowy and compact.', 'https://www.obertauern.com/', SALZ, [SZG(90)]],
  // ---------- Italy ----------
  ['cervinia', 'Cervinia', 'IT', 'Aosta Valley', 45.934, 7.630, 2050, 3480, 360, ['family', 'glacier', 'snowsure', 'big'], 'Late Oct – early May', 'Long, sunny cruisers linked to Zermatt under the Matterhorn.', 'https://www.cervinia.it/', AINEVA, [MXP(140), TRN(110), GVA(190)], { name: 'Châtillon', km: 27 }, undefined, 'Matterhorn Ski Paradise'],
  ['courmayeur', 'Courmayeur', 'IT', 'Aosta Valley', 45.790, 6.970, 1210, 2755, 100, ['freeride', 'touring'], 'Early Dec – mid Apr', 'Italian side of Mont Blanc: Skyway and the Vallée Blanche from Punta Helbronner.', 'https://www.courmayeurmontblanc.it/', AINEVA, [GVA(105), TRN(150)]],
  ['livigno', 'Livigno', 'IT', 'Lombardy', 46.538, 10.136, 1816, 2798, 115, ['park', 'snowsure', 'family'], 'Late Nov – early May', 'Duty-free, high and snowy, with the Mottolino park.', 'https://www.livigno.eu/', AINEVA, [{ name: 'Bergamo', code: 'BGY', km: 200 }, ZRH(250)]],
  ['valgardena', 'Val Gardena', 'IT', 'South Tyrol, Dolomites', 46.557, 11.676, 1236, 2518, 175, ['family', 'big'], 'Early Dec – mid Apr', 'Dolomiti Superski gateway with the Sella Ronda.', 'https://www.valgardena.it/', { kind: 'euregio', region: 'IT-32-BZ-18-02' }, [INN(110), VRN(200)], { name: 'Bolzano / Ponte Gardena', km: 35 }, undefined, 'Dolomiti Superski'],
  ['altabadia', 'Alta Badia', 'IT', 'South Tyrol, Dolomites', 46.560, 11.880, 1324, 2778, 130, ['family', 'big'], 'Early Dec – early Apr', 'Gentle, sunny Dolomites skiing with excellent food; Sella Ronda.', 'https://www.altabadia.org/', LAWIS('avalanche.report (South Tyrol)', 'https://avalanche.report/'), [INN(120), VCE(200)], undefined, undefined, 'Dolomiti Superski'],
  ['cortina', 'Cortina d\'Ampezzo', 'IT', 'Veneto, Dolomites', 46.540, 12.135, 1224, 2930, 120, ['freeride', 'family'], 'Late Nov – early Apr', 'Olympic resort under the Tofane; scenic and steep in places.', 'https://www.dolomiti.org/', AINEVA, [VCE(160), INN(160)], undefined, undefined, 'Dolomiti Superski'],
  ['campiglio', 'Madonna di Campiglio', 'IT', 'Trentino', 46.230, 10.830, 850, 2504, 150, ['family', 'park'], 'Late Nov – mid Apr', 'Elegant Brenta Dolomites resort with Ursus snowpark.', 'https://www.campigliodolomiti.it/', AINEVA, [VRN(150)]],
  ['sestriere', 'Sestriere', 'IT', 'Piedmont', 44.957, 6.879, 1350, 2800, 400, ['family', 'big'], 'Early Dec – mid Apr', 'Via Lattea linked to Montgenèvre in France.', 'https://www.vialattea.it/', AINEVA, [TRN(100)], { name: 'Oulx', km: 22 }, undefined, 'Via Lattea'],
  ['monterosa', 'Monterosa (Alagna)', 'IT', 'Piedmont / Aosta', 45.850, 7.940, 1212, 3275, 180, ['freeride', 'touring'], 'Early Dec – mid Apr', 'Alagna is a freeride mecca: huge off-piste lines and heliskiing.', 'https://www.monterosaski.com/', AINEVA, [MXP(110), TRN(170)]],
  ['bormio', 'Bormio', 'IT', 'Lombardy', 46.467, 10.375, 1225, 3012, 50, ['freeride'], 'Late Nov – mid Apr', 'Stelvio World Cup downhill and 1 800 m of vertical.', 'https://www.bormioski.eu/', AINEVA, [{ name: 'Bergamo', code: 'BGY', km: 190 }]],
  // ---------- More glaciers ----------
  ['pitztal', 'Pitztal Glacier', 'AT', 'Tyrol, Pitztal', 46.925, 10.880, 2840, 3440, 43, ['glacier', 'snowsure', 'freeride'], 'Late Sep – early May', 'Tyrol\'s highest ski area, under the Wildspitze, with the Café 3440 at the top. Linked on one pass with Rifflsee.', 'https://www.pitztal.com/', { kind: 'euregio', region: 'AT-07-20' }, [INN(90)], { name: 'Imst-Pitztal', km: 45 }, 'Bus from Imst-Pitztal station, then the underground Pitzexpress funicular.'],
  ['kaunertal', 'Kaunertal Glacier', 'AT', 'Tyrol, Kaunertal', 46.865, 10.715, 2150, 3108, 38, ['glacier', 'snowsure', 'park'], 'Oct – early Jun', 'Quiet, high glacier with long seasons and an early-season park.', 'https://www.kaunertaler-gletscher.at/', { kind: 'euregio', region: 'AT-07-20' }, [INN(110)], { name: 'Landeck-Zams', km: 50 }],
  ['molltal', 'Mölltal Glacier', 'AT', 'Carinthia', 46.990, 13.000, 1300, 3122, 53, ['glacier', 'snowsure'], 'Late Sep – early May', 'Carinthia\'s glacier, reached by an underground funicular; long runs down to the valley in winter.', 'https://www.gletscher.co.at/', LAWIS('Lawinenwarndienst Kärnten', 'https://lawinenwarndienst.ktn.gv.at/'), [SZG(170)], { name: 'Mallnitz-Obervellach', km: 25 }],
  ['dachstein', 'Dachstein Glacier', 'AT', 'Styria, Ramsau', 47.470, 13.620, 2550, 2700, 4, ['glacier', 'touring'], 'Oct – Jun (lifts and conditions vary)', 'Small glacier area above Ramsau with cross-country trails and short runs; mostly for touring and training.', 'https://www.derdachstein.at/', LAWIS('Lawinenwarndienst Steiermark', 'https://www.lawine-steiermark.at/'), [SZG(90)], { name: 'Schladming', km: 20 }],
  ['glacier3000', 'Glacier 3000', 'CH', 'Vaud / Bern', 46.330, 7.210, 1350, 2971, 28, ['glacier', 'freeride', 'snowsure'], 'Early Nov – early May', 'Above Les Diablerets and Gstaad, with off-piste down the Martisberg and the Peak Walk bridge.', 'https://www.glacier3000.ch/', { kind: 'slf', region: 'CH-1222' }, [GVA(140)], { name: 'Gstaad', km: 18 }],
  ['diavolezza', 'Diavolezza', 'CH', 'Graubünden, Engadin', 46.410, 9.970, 2093, 2978, 25, ['glacier', 'freeride', 'touring'], 'Late Oct – May', 'Famous glacier descent over the Morteratsch glacier, with views of Piz Bernina.', 'https://www.diavolezza.ch/', { kind: 'slf', region: 'CH-7112' }, [ZRH(220)], { name: 'Bernina Diavolezza (Rhaetian Railway)', km: 0 }, undefined, 'Engadin St. Moritz'],
  ['valsenales', 'Val Senales Glacier', 'IT', 'South Tyrol', 46.780, 10.790, 2011, 3212, 35, ['glacier', 'snowsure'], 'Late Sep – early May', 'South Tyrol\'s glacier, where Ötzi was found; early-season training base.', 'https://www.schnalstal.com/', { kind: 'euregio', region: 'IT-32-BZ-03' }, [INN(110), VRN(200)], { name: 'Merano', km: 30 }],
  ['stelvio', 'Passo dello Stelvio', 'IT', 'Lombardy / South Tyrol', 46.530, 10.450, 2760, 3450, 20, ['glacier', 'park'], 'Late May – early Nov (summer only)', 'Summer glacier skiing on the Stelvio pass; the pass road is closed in winter.', 'https://www.stelviopass.com/', AINEVA, [{ name: 'Bergamo', code: 'BGY', km: 210 }], undefined, 'By car over the pass from Bormio (summer only).'],
  ['presena', 'Presena Glacier (Passo Tonale)', 'IT', 'Trentino / Lombardy', 46.220, 10.580, 1883, 3016, 100, ['glacier', 'family', 'snowsure'], 'Late Oct – May', 'Glacier above Passo Tonale, linked with Ponte di Legno.', 'https://www.pontedilegnotonale.com/', AINEVA, [VRN(170), { name: 'Bergamo', code: 'BGY', km: 150 }], undefined, undefined, 'Pontedilegno-Tonale'],
  ['zugspitze', 'Zugspitze', 'DE', 'Bavaria', 47.420, 10.990, 2000, 2720, 20, ['glacier', 'snowsure'], 'Nov – early May', 'Germany\'s only glacier ski area, on the Schneeferner below the country\'s highest peak.', 'https://zugspitze.de/', LAWIS('Lawinenwarndienst Bayern', 'https://www.lawinenwarndienst-bayern.de/'), [MUC(130), INN(60)], { name: 'Garmisch-Partenkirchen (Zugspitzbahn)', km: 0 }, 'Cog railway from Garmisch, then the glacier cable car.'],
  ['fonna', 'Fonna Glacier Ski Resort', 'NO', 'Vestland, Folgefonna', 60.050, 6.330, 1200, 1440, 3, ['glacier', 'park', 'late'], 'Late Apr – Aug (summer only)', 'Summer skiing and a park on the Folgefonna glacier.', 'https://www.fonna.no/', { kind: 'nve' }, [BGO(130)]],
  ['galdhopiggen', 'Galdhøpiggen Sommerskisenter', 'NO', 'Innlandet, Jotunheimen', 61.630, 8.380, 1850, 2150, 3, ['glacier', 'touring', 'late'], 'Late May – Oct (summer only)', 'Summer skiing on the Vesljuvbreen glacier below Norway\'s highest peak.', 'https://www.galdhopiggensommerskisenter.no/', { kind: 'nve' }, [OSL(330)]],
  ['stryn', 'Stryn Sommerski', 'NO', 'Vestland', 61.900, 7.180, 1050, 1580, 10, ['glacier', 'park', 'late'], 'Late May – July (summer only)', 'Classic Norwegian summer ski centre on the Tystigbreen glacier, popular with park and race camps.', 'https://www.strynsommerski.no/', { kind: 'nve' }, [{ name: 'Ålesund', code: 'AES', km: 160 }]],
] as R[]).map(r)

RESORTS.push(...MORE_RESORTS)
export const BUILTIN_COUNT = RESORTS.length

/** Your own resorts are appended to RESORTS so every screen can find them. */
export function setCustomResorts(list: CustomResort[]) {
  RESORTS.splice(BUILTIN_COUNT)
  for (const c of list) {
    if (c.deleted) continue
    RESORTS.push({
      id: c.id, name: c.name || 'Unnamed resort', country: c.country, region: c.region || '',
      lat: c.lat ?? NaN, lon: c.lon ?? NaN, base: c.base ?? 0, top: c.top ?? 0, km: c.km ?? 0,
      tags: c.tags.filter((t): t is Tag => t in TAGS), season: '', about: c.notes, web: c.web, passUrl: c.web,
      avalanche: { kind: 'link', label: 'Look up the regional avalanche bulletin', url: 'https://www.avalanches.org/' },
      airports: [], custom: true,
    })
  }
}

export const resortById = (id: string | null | undefined) => RESORTS.find((x) => x.id === id)

export const COUNTRY_NAMES: Record<Country, string> = { SE: 'Sweden', NO: 'Norway', FR: 'France', CH: 'Switzerland', AT: 'Austria', IT: 'Italy', DE: 'Germany' }
export const FLAG: Record<Country, string> = { SE: '🇸🇪', NO: '🇳🇴', FR: '🇫🇷', CH: '🇨🇭', AT: '🇦🇹', IT: '🇮🇹', DE: '🇩🇪' }

/** Great-circle distance in km. */
export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const R = 6371
  const rad = Math.PI / 180
  const dLat = (bLat - aLat) * rad
  const dLon = (bLon - aLon) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export const STOCKHOLM = { lat: 59.33, lon: 18.07 }
