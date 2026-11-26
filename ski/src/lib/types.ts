// Shared types for Ski Base.

export type Discipline = 'park' | 'allmountain' | 'touring'
export type SkiType = 'piste' | 'freeride' | 'park' | 'touring' | 'backcountry'
export type SnowType = 'powder' | 'packed' | 'crud' | 'ice' | 'corn' | 'slush' | 'artificial'
export type Visibility = 'bluebird' | 'mixed' | 'flat' | 'storm'

/** have: owned and fine. missing: needed, not owned. upgrade: owned but should be replaced. na: not needed. unknown: not checked yet. */
export type Status = 'have' | 'missing' | 'upgrade' | 'na' | 'unknown'

/** Every stored record carries an id, a change time and an optional tombstone, so two devices can merge. */
export type Rec = { id: string; updatedAt: number; deleted?: boolean }

export type GearItem = Rec & {
  discipline: Discipline | 'shared'
  slot: string // what it is: "Skis", "Avalanche transceiver"
  model: string // what you own or want: "Atomic Bent 110"
  status: Status
  essential: boolean
  note: string
}

export type CondId = 'cold' | 'normal' | 'spring' | 'storm' | 'uphill'
export type ClothingItem = Rec & {
  layer: 'base' | 'mid' | 'outer' | 'hands' | 'head' | 'feet' | 'extra'
  name: string
  model: string
  status: Status
  conditions: CondId[]
  note: string
}

export type SkiDay = Rec & {
  date: string // YYYY-MM-DD
  resortId: string | null
  place: string
  types: SkiType[]
  snow: SnowType
  visibility: Visibility
  newSnow: number | null // cm in last 24 h
  temp: number | null // °C
  rating: number | null // 1–5
  highlight: string
  notes: string
}

export type Trip = Rec & {
  name: string
  resortId: string | null
  place: string
  start: string
  end: string
  types: SkiType[]
  travelChoice: string // chosen travel option id, or ''
  plan: string // free text: bookings, times, who
  checklist: Record<string, boolean>
}

export type State = {
  v: 1
  home: string
  gear: GearItem[]
  clothing: ClothingItem[]
  days: SkiDay[]
  trips: Trip[]
}
