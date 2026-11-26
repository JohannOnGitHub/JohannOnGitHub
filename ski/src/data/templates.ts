// Starting checklists for gear and clothing. Statuses that are already known
// from your profile are filled in; everything else starts as "not checked".
import type { ClothingItem, CondId, Discipline, GearItem, Status } from '../lib/types'

type G = [Discipline | 'shared', string, boolean, Status?, string?, string?]
// [discipline, slot, essential, status, model, note]
const GEAR: G[] = [
  // All mountain / freeride
  ['allmountain', 'Skis', true, 'have', 'Atomic Bent 110', 'Freeride and all-mountain, 110 mm waist'],
  ['allmountain', 'Bindings', true, 'unknown'],
  ['allmountain', 'Boots', true, 'missing', '', 'Wide feet (26 cm × 10 cm). Shortlist: Dalbello IL Moro Boss, Armada AR One 130 MV, K2 Revolve Pro. Tried Atomic Hawx Prime 130 S BOA: tight in the toes, would need a liner heat-mold.'],
  ['allmountain', 'Poles', true, 'unknown'],
  ['allmountain', 'Back protector', false, 'unknown'],
  ['allmountain', 'Avalanche transceiver', true, 'unknown', '', 'Needed for any off-piste'],
  ['allmountain', 'Probe', true, 'unknown'],
  ['allmountain', 'Shovel', true, 'unknown'],
  ['allmountain', 'Airbag backpack', false, 'unknown'],
  ['allmountain', 'Freeride backpack (25–30 L)', false, 'unknown'],
  // Park
  ['park', 'Park skis (twin tip, ~85–95 mm, softer flex)', true, 'unknown', '', 'The Bent 110 works for natural hits, but a narrower twin tip is easier on rails and boxes'],
  ['park', 'Park bindings (high DIN, easy step-in)', true, 'unknown'],
  ['park', 'Park boots (flex ~100–120, more forgiving)', false, 'unknown'],
  ['park', 'Impact shorts', false, 'unknown'],
  ['park', 'Wrist guards / padded gloves', false, 'unknown'],
  // Touring
  ['touring', 'Touring skis (or hybrid-binding setup on the Bent 110)', true, 'unknown'],
  ['touring', 'Touring bindings (pin or hybrid, e.g. Shift)', true, 'unknown'],
  ['touring', 'Touring boots (walk mode, pin inserts)', true, 'unknown'],
  ['touring', 'Climbing skins', true, 'unknown'],
  ['touring', 'Ski crampons', false, 'unknown'],
  ['touring', 'Adjustable / touring poles', false, 'unknown'],
  ['touring', 'Touring backpack (30–40 L)', true, 'unknown'],
  ['touring', 'Headlamp', true, 'unknown'],
  ['touring', 'First aid kit', true, 'unknown'],
  ['touring', 'Repair kit (skin wax, straps, multitool)', true, 'unknown'],
  ['touring', 'Emergency bivy / foil blanket', true, 'unknown'],
  ['touring', 'Map, compass or GPS app with offline maps', true, 'unknown'],
  ['touring', 'Crampons and ice axe (glacier tours)', false, 'unknown'],
  ['touring', 'Harness, crevasse rescue kit (glacier tours)', false, 'unknown'],
  // Shared
  ['shared', 'Helmet', true, 'unknown'],
  ['shared', 'Goggles', true, 'unknown'],
  ['shared', 'Low-light goggle lens', false, 'unknown'],
  ['shared', 'Storage wax', false, 'have', 'Swix CH7 / CH8'],
  ['shared', 'Scraper, brush and waxing iron', false, 'unknown'],
  ['shared', 'Edge tuner', false, 'unknown'],
  ['shared', 'Ski bag (for flights)', false, 'unknown'],
  ['shared', 'Boot bag', false, 'unknown'],
]

type C = [ClothingItem['layer'], string, CondId[]]
const CLOTHING: C[] = [
  ['base', 'Merino base layer top, heavy (250+ g)', ['cold', 'normal']],
  ['base', 'Merino base layer top, light (150 g)', ['spring', 'uphill', 'normal']],
  ['base', 'Base layer bottoms', ['cold', 'normal', 'storm']],
  ['mid', 'Fleece or grid fleece', ['cold', 'normal', 'storm', 'uphill']],
  ['mid', 'Insulated midlayer (down or synthetic)', ['cold', 'storm']],
  ['mid', 'Light vest', ['spring', 'uphill']],
  ['outer', 'Shell jacket (waterproof, e.g. Gore-Tex)', ['normal', 'storm', 'spring']],
  ['outer', 'Shell pants or bibs', ['normal', 'storm', 'spring']],
  ['outer', 'Insulated jacket', ['cold']],
  ['outer', 'Insulated pants', ['cold']],
  ['outer', 'Softshell jacket (breathable, for skinning)', ['uphill', 'spring']],
  ['outer', 'Belay / summit puffy (big, warm, over everything)', ['uphill', 'cold']],
  ['hands', 'Warm mittens', ['cold']],
  ['hands', 'Insulated gloves', ['normal', 'storm']],
  ['hands', 'Thin spring gloves', ['spring', 'uphill']],
  ['hands', 'Liner gloves', ['cold', 'uphill']],
  ['head', 'Balaclava', ['cold', 'storm']],
  ['head', 'Neck gaiter / buff', ['normal', 'spring', 'uphill', 'storm']],
  ['head', 'Thin beanie (fits under the helmet)', ['cold', 'uphill']],
  ['head', 'Cap and sunglasses', ['spring', 'uphill']],
  ['feet', 'Ski socks, thin', ['normal', 'spring', 'uphill']],
  ['feet', 'Ski socks, warm', ['cold']],
  ['extra', 'Hand and toe warmers', ['cold']],
  ['extra', 'Sunscreen and lip balm (SPF 50)', ['spring', 'uphill', 'normal']],
  ['extra', 'Spare goggle lens for flat light', ['storm']],
  ['extra', 'Après boots', ['cold', 'normal', 'spring', 'storm']],
]

export const CONDITIONS: Record<CondId, { name: string; hint: string }> = {
  cold: { name: 'Deep cold', hint: 'Below −15 °C, or wind chill. Typical in Sweden in January.' },
  normal: { name: 'Normal winter', hint: '−15 to −2 °C, dry.' },
  spring: { name: 'Spring and sun', hint: 'Above 0 °C, corn snow, strong sun.' },
  storm: { name: 'Storm and wet', hint: 'Snowing, raining or windy, flat light.' },
  uphill: { name: 'Touring uphill', hint: 'You sweat going up and freeze at the top.' },
}

let n = 0
const id = (p: string) => `${p}-${(++n).toString(36)}`

export function seedGear(): GearItem[] {
  return GEAR.map(([discipline, slot, essential, status = 'unknown', model = '', note = '']) => ({
    id: id('g'), updatedAt: 1, discipline, slot, essential, status, model, note,
  }))
}
export function seedClothing(): ClothingItem[] {
  return CLOTHING.map(([layer, name, conditions]) => ({
    id: id('c'), updatedAt: 1, layer, name, conditions, status: 'unknown', model: '', note: '',
  }))
}
