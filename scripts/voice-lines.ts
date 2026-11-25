// Lists every line to pre-record, per voice role, as JSON for gen-voices.sh.
// Usage: npx tsx scripts/voice-lines.ts man > lines.json
import { FRIENDS, PLACES } from '../src/data/content'
import { friendLines } from '../src/data/lines'
import { spoken, voiceKey } from '../src/lib/pronounce'

const role = process.argv[2] ?? 'man'
// The family words currently used in the app (Parents' corner defaults).
const family = { parent: 'Papa', mamie: 'Chacha', papi: 'Papy' }

const out: { key: string; text: string }[] = []
const seen = new Set<string>()
for (const p of PLACES) {
  if (FRIENDS[p.friend].voice.id !== role) continue
  for (const line of friendLines(p, family)) {
    const text = spoken(line)
    const key = voiceKey(role, text)
    if (!seen.has(key)) {
      seen.add(key)
      out.push({ key, text })
    }
  }
}
console.log(JSON.stringify(out, null, 1))
