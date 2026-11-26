// Lists every line to pre-record for a voice role, as JSON for the generators.
// Usage: npx tsx scripts/voice-lines.ts <boy|girl|korri|...> > lines.json
import { BUDDIES, FRIENDS, PLACES, WEARABLES } from '../src/data/content'
import { PEPETTE_HOME, PEPETTE_SPLASH, buddyLines, friendLines } from '../src/data/lines'
import { spoken, stripName, voiceKey } from '../src/lib/pronounce'

const role = process.argv[2] ?? 'korri'
// The family words currently used in the app (Parents' corner defaults).
const family = { parent: 'Papa', mamie: 'Chacha', papi: 'Papy' }

const raw: string[] = []
for (const p of PLACES) if (FRIENDS[p.friend].voice.id === role) raw.push(...friendLines(p, family))
if (role === 'pepette') raw.push(PEPETTE_HOME, PEPETTE_SPLASH)
for (const b of Object.values(BUDDIES)) {
  if (b.voice.id !== role) continue
  const girl = role === 'girl'
  raw.push(...buddyLines(girl, PLACES, WEARABLES, family.parent, [`Je suis ${b.name}, ${b.title} !`]))
}

const out: { key: string; text: string }[] = []
const seen = new Set<string>()
for (const line of raw) {
  const text = spoken(stripName(line, ['{name}']))
  const key = voiceKey(role, text)
  if (text && !seen.has(key)) {
    seen.add(key)
    out.push({ key, text })
  }
}
console.log(JSON.stringify(out, null, 1))
