// How words should be *said* (the text on screen stays the same).
// Speech engines get some names wrong: « Mathis » is said « Matisse »,
// « Alpe d'Huez » is said « Alpe d'Huèze ».

const BUILTIN: [RegExp, string][] = [
  [/\bHuez\b/g, 'Huèze'],
  [/\bMathis\b/g, 'Matisse'],
  [/Gwenn ha Du/g, 'Gouenne a Du'],
  [/Degemer mat/gi, 'Dégémère matte'],
  [/Serre-Ponçon/g, 'Serre-Ponsson'],
]

let extra: [RegExp, string][] = []

/** Extra pronunciations from the parents' corner, e.g. { Mathis: 'Matisse' }. */
export function setPronunciations(map: Record<string, string>) {
  extra = Object.entries(map)
    .filter(([w, s]) => w.trim() && s.trim() && w.trim() !== s.trim())
    .map(([w, s]) => [new RegExp(`\\b${w.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g'), s.trim()])
}

/** Text as it should be sent to a voice. */
export function spoken(text: string): string {
  let t = text.replace(/[«»]/g, '').replace(/\s+/g, ' ').trim()
  for (const [re, s] of extra) t = t.replace(re, s)
  for (const [re, s] of BUILTIN) t = t.replace(re, s)
  return t
}

/** Small stable hash used to name pre-recorded voice files. */
export function voiceKey(role: string, text: string): string {
  let h = 0x811c9dc5
  const s = `${role}|${text}`
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}
