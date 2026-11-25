// Lines spoken by the local friends. Shared by the game screens and by the
// script that pre-records voices (scripts/voice-lines.ts), so both always match.
import type { Activity, Place } from './content'

type Fam = { parent: string; mamie: string; papi: string }
export const fill = (s: string, f: Fam) => s.replace(/\{parent\}/g, f.parent).replace(/\{mamie\}/g, f.mamie).replace(/\{papi\}/g, f.papi)

export const placeWelcome = (p: Place, f: Fam) => fill(p.welcome, f) + ' Touche une image pour jouer !'

export function missLine(a: Activity, f: Fam, n: number, little: boolean) {
  if (n === 1) return little && a.hint ? `Presque ! ${fill(a.hint, f)}` : 'Presque ! Essaie encore !'
  return a.hint ? `Essaie encore ! ${fill(a.hint, f)}` : `Essaie encore ! ${f.parent} peut t’aider !`
}

export const effortLine = (a: Activity, f: Fam) => `Bravo d’avoir essayé ! ${fill(a.hint ?? a.ask, f)}`

/** Every line a place's friend can say (for pre-recording). */
export function friendLines(p: Place, f: Fam): string[] {
  const out = new Set<string>([placeWelcome(p, f)])
  for (const a of p.activities) {
    out.add(fill(a.fact, f))
    out.add(fill(a.ask, f))
    if (a.hint) out.add(fill(a.hint, f))
    out.add(fill(a.cheer, f))
    for (const little of [true, false]) for (const n of [1, 2]) out.add(missLine(a, f, n, little))
    out.add(effortLine(a, f))
  }
  return [...out]
}

// ---------- Lines spoken by the child's buddy (Rocco / Givrine) ----------
// Names are passed in; pre-recorded voices are made without the name
// (see stripName in lib/pronounce.ts), so no first name ends up in public files.

export const NUM_WORDS = ['un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix']

export const BUDDY = {
  mapFirst: (n: string) => `Coucou ${n} ! Voici la carte de France. Touche les montagnes pour commencer l’aventure !`,
  mapAgain: (n: string) => `Coucou ${n} ! Où est-ce qu’on va aujourd’hui ? Touche un endroit sur la carte !`,
  mapLocked: (short: string) => `C’est encore fermé ! Joue d’abord à ${short}.`,
  count: 'Touche-les pour compter avec moi !',
  choose: 'Touche les images pour entendre les mots !',
  mic: 'Appuie sur le gros micro, et réponds en français !',
  noMic: 'Dis ta réponse bien fort, en français !',
  bravo: (n: string) => `Bravo ${n} ! Tu as gagné un autocollant !`,
  effortWin: (n: string) => `Tu as gagné un autocollant, ${n} !`,
  badge: (badge: string) => `Et le badge ${badge} ! Waouh !`,
  nextMore: 'Touche « Encore » pour jouer encore, ou la maison pour revenir !',
  nextMap: 'Touche le bouton pour retourner sur la carte !',
  nothing: 'Je n’ai rien entendu. Appuie sur le micro, et parle bien fort !',
  micDenied: (parent: string) => `Le micro n’est pas autorisé. ${parent}, il faut autoriser le micro pour Safari dans les réglages.`,
  album: (n: string) => `Voici ton album, ${n} ! Touche un autocollant pour l’écouter !`,
  albumEmpty: 'Voici ton album ! Il est encore vide. Joue sur la carte pour gagner des autocollants !',
  trophies: 'Voici tes trophées ! Les trophées en couleur, tu les as gagnés !',
  bonus: 'Choisis un jeu ! Touche une image. Les jeux avec un cadenas s’ouvriront quand tu auras plus d’étoiles.',
  bonusClosed: 'Les jeux bonus sont encore fermés ! Gagne des étoiles sur la carte pour les ouvrir.',
  bonusLocked: 'Il te faut plus d’étoiles pour ouvrir ce jeu ! Joue sur la carte pour en gagner.',
  bulles: 'Touche les bulles de savon pour les éclater ! Pop ! Chaque bulle te dit un mot.',
  atelier: 'Bienvenue dans l’atelier ! Choisis un trésor et je le mets !',
  atelierLocked: (short: string) => `Pour l’avoir, finis tous les jeux de ${short} !`,
  wear: (item: string, girl: boolean) => `Je mets ${item} ! Je suis trop ${girl ? 'belle' : 'beau'} !`,
  unwear: (item: string) => `J’enlève ${item}.`,
  virages: 'Vingt et un virages pour monter à l’Alpe d’Huez ! Appuie sur le micro et crie : allez ! Ou touche le bouton vroum !',
  viragesNoMic: 'Vingt et un virages pour monter à l’Alpe d’Huez ! Touche le bouton vroum pour faire avancer le camion !',
  viragesLeft: (n: number) => `Encore ${n} !`,
  vroum: 'Vroum !',
  viragesWin: 'On est en haut ! Bravo, tu es un champion du Tour de France ! Plus trois étoiles !',
}

/** Every line a buddy can say (for pre-recording). `girl` = Givrine. */
export function buddyLines(girl: boolean, places: Place[], wearables: { name: string }[], parent: string, extra: string[]): string[] {
  const N = '{name}'
  const out = new Set<string>([
    BUDDY.mapFirst(N), BUDDY.mapAgain(N), BUDDY.count, BUDDY.choose, BUDDY.mic, BUDDY.noMic, BUDDY.bravo(N), BUDDY.effortWin(N),
    BUDDY.nextMore, BUDDY.nextMap, BUDDY.nothing, BUDDY.micDenied(parent), BUDDY.album(N), BUDDY.albumEmpty, BUDDY.trophies,
    BUDDY.bonus, BUDDY.bonusClosed, BUDDY.bonusLocked, BUDDY.bulles, BUDDY.atelier, BUDDY.virages, BUDDY.viragesNoMic,
    BUDDY.vroum, BUDDY.viragesWin, ...NUM_WORDS,
  ])
  for (let i = 1; i <= 10; i++) out.add(BUDDY.viragesLeft(i))
  for (const p of places) {
    out.add(BUDDY.mapLocked(p.short))
    out.add(BUDDY.badge(p.badge.name))
    out.add(BUDDY.atelierLocked(p.short))
    for (const a of p.activities) {
      out.add(a.sticker.name)
      for (const o of a.options ?? []) out.add(o.label)
    }
  }
  for (const w of wearables) {
    out.add(BUDDY.wear(w.name, girl))
    out.add(BUDDY.unwear(w.name))
  }
  for (const e of extra) out.add(e)
  return [...out]
}
