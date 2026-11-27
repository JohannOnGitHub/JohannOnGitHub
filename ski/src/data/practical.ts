// Practical info per country: emergency numbers, useful apps and local rules.
import type { Country } from './resorts'

export type Phone = { number: string; what: string }
export type App = { name: string; what: string; url: string }
export type Practical = { phones: Phone[]; apps: App[]; rules: string[]; currency: string }

export const GENERAL_APPS: App[] = [
  { name: 'Yr', what: 'Mountain weather forecasts for Scandinavia and the Alps', url: 'https://www.yr.no/en' },
  { name: 'Slopes', what: 'Tracks runs, vertical and speed. Good for filling in your log', url: 'https://getslopes.com/' },
  { name: 'PeakVisor', what: 'Names the peaks around you, 3D maps for touring', url: 'https://peakvisor.com/' },
]

export const GENERAL_RULES = [
  'Carry your EU health insurance card (EU-kort from Försäkringskassan). It does not cover mountain rescue or the trip home.',
  'Check that your travel insurance covers off-piste and touring, and helicopter rescue.',
  'Save the resort\'s ski patrol number in your phone: it is printed on the piste map and often on the pass.',
]

export const PRACTICAL: Record<Country, Practical> = {
  SE: {
    currency: 'SEK',
    phones: [
      { number: '112', what: 'Emergency, including mountain rescue (fjällräddning)' },
      { number: '1177', what: 'Healthcare advice' },
      { number: '114 14', what: 'Police, non-emergency' },
    ],
    apps: [
      { name: 'Lavinprognoser', what: 'Swedish avalanche forecasts (Naturvårdsverket)', url: 'https://lavinprognoser.se/' },
      { name: 'SkiStar', what: 'Lift pass, lift queues and piste map in Sälen, Åre, Vemdalen', url: 'https://www.skistar.com/' },
    ],
    rules: ['Most Swedish resorts have little avalanche terrain, but Riksgränsen, Åre and the Lappland fells do: check lavinprognoser.se.'],
  },
  NO: {
    currency: 'NOK',
    phones: [
      { number: '113', what: 'Medical emergency (use for ski accidents)' },
      { number: '112', what: 'Police and mountain rescue' },
      { number: '110', what: 'Fire' },
    ],
    apps: [
      { name: 'Varsom', what: 'Norwegian avalanche forecasts', url: 'https://www.varsom.no/en/' },
      { name: 'Regobs', what: 'Field observations of snow and avalanches', url: 'https://www.regobs.no/' },
      { name: 'Hjelp 113', what: 'Shows your position to read out to the emergency operator', url: 'https://www.hjelp113.no/' },
    ],
    rules: ['Norway is outside the EU: the EU health card still works (EEA), but check roaming costs.'],
  },
  FR: {
    currency: 'EUR',
    phones: [
      { number: '112', what: 'Emergency (works from any mobile)' },
      { number: '15', what: 'SAMU, medical emergency' },
      { number: '18', what: 'Fire brigade' },
    ],
    apps: [
      { name: 'Météo-France', what: 'Mountain forecasts and the daily avalanche bulletin (BERA)', url: 'https://meteofrance.com/meteo-montagne' },
      { name: 'Echo112', what: 'Sends your exact position when you call emergency services', url: 'https://www.echo112.com/' },
    ],
    rules: [
      'Rescue on the pistes is not free in France: the "Carré Neige" insurance sold with the pass (~3 € a day) covers it.',
      'Loi Montagne: from 1 Nov to 31 Mar, cars must have winter tyres or carry chains or socks in mountain areas, including the road to Alpe d\'Huez.',
      'Saturdays in the February school holidays are "samedis noirs": expect long queues on the roads up to the resorts.',
    ],
  },
  CH: {
    currency: 'CHF',
    phones: [
      { number: '1414', what: 'Rega air rescue' },
      { number: '144', what: 'Ambulance' },
      { number: '117', what: 'Police' },
      { number: '112', what: 'European emergency number' },
    ],
    apps: [
      { name: 'White Risk', what: 'SLF avalanche bulletin and planning tools', url: 'https://www.whiterisk.ch/' },
      { name: 'Rega', what: 'Sends your position to Rega with one tap', url: 'https://www.rega.ch/en/' },
      { name: 'MeteoSwiss', what: 'Official Swiss weather', url: 'https://www.meteoswiss.admin.ch/' },
    ],
    rules: [
      'Switzerland is outside the EU: check data roaming.',
      'Motorways need a vignette (40 CHF for the year).',
      'Rega patronage (~40 CHF a year) can cover helicopter rescue costs.',
    ],
  },
  AT: {
    currency: 'EUR',
    phones: [
      { number: '140', what: 'Mountain rescue (Bergrettung)' },
      { number: '144', what: 'Ambulance' },
      { number: '112', what: 'European emergency number' },
    ],
    apps: [
      { name: 'avalanche.report', what: 'Avalanche bulletin for Tyrol, South Tyrol and Trentino', url: 'https://avalanche.report/' },
      { name: 'SOS EU ALP', what: 'Tyrol emergency app that sends your position', url: 'https://www.sos-eu-alp.info/' },
    ],
    rules: ['Motorways need a vignette (digital vignette, buy before you drive).'],
  },
  IT: {
    currency: 'EUR',
    phones: [
      { number: '112', what: 'European emergency number (single number in most regions)' },
      { number: '118', what: 'Medical emergency and mountain rescue' },
    ],
    apps: [
      { name: 'AINEVA', what: 'Italian regional avalanche bulletins', url: 'https://bollettini.aineva.it/' },
      { name: 'Dolomiti Superski', what: 'Pass, lifts and piste map for the Dolomites', url: 'https://www.dolomitisuperski.com/' },
    ],
    rules: [
      'Third-party liability insurance is required to ski on Italian pistes: buy it with the pass if your own insurance does not cover it.',
      'Helmets are required for under-18s, and off-piste skiers must carry a transceiver, shovel and probe when there is avalanche risk.',
    ],
  },
}
