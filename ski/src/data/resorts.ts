// Resort reference data. Figures are rounded from resort and guide sources as of
// autumn 2026 and are meant for comparing resorts, not for planning to the metre:
// check the resort's own site before a trip. Live snow, history and avalanche data
// are fetched in the app instead of being typed in here.

export type Country = 'SE' | 'NO' | 'FR' | 'CH' | 'AT'
export type Tag = 'freeride' | 'park' | 'family' | 'touring' | 'glacier' | 'snowsure' | 'late' | 'big'

export const TAGS: Record<Tag, string> = {
  freeride: 'Freeride',
  park: 'Park',
  family: 'Family',
  touring: 'Touring',
  glacier: 'Glacier',
  snowsure: 'Snow-sure',
  late: 'Late season',
  big: 'Big area',
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

export const resortById = (id: string | null | undefined) => RESORTS.find((r) => r.id === id)

export const COUNTRY_NAMES: Record<Country, string> = { SE: 'Sweden', NO: 'Norway', FR: 'France', CH: 'Switzerland', AT: 'Austria' }
export const FLAG: Record<Country, string> = { SE: '🇸🇪', NO: '🇳🇴', FR: '🇫🇷', CH: '🇨🇭', AT: '🇦🇹' }

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
