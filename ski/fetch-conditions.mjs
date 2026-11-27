// Fetches forecast, snow history and avalanche snapshots for every resort and writes
// one JSON file per database document ({ value }) for publishing to the artifact.
import { createServer } from 'vite'
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
const out = process.argv[2] ?? 'conditions-out'
const only = process.argv[3] // optional: "fc", "hist" or "ava"
mkdirSync(out, { recursive: true })
const server = await createServer({ mode: 'development', server: { middlewareMode: true }, logLevel: 'error' })
const { RESORTS } = await server.ssrLoadModule('/src/data/resorts.ts')
const c = await server.ssrLoadModule('/src/lib/conditions.ts')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const done = [], failed = []
for (const r of RESORTS) {
  for (const [kind, fn] of [['fc', c.forecast], ['hist', c.history], ['ava', c.avalanche]]) {
    if (only && only !== kind) continue
    const file = `${out}/${kind}-${r.id}.json`
    if (existsSync(file)) continue
    try {
      const v = await fn(r)
      if (v) { writeFileSync(file, JSON.stringify({ value: v })); done.push(`${kind}-${r.id}`) }
    } catch (e) { failed.push(`${kind}-${r.id}: ${e.message}`) }
    await sleep(kind === 'hist' ? 2500 : 400)
  }
}
console.log('ok', done.length, done.join(' '))
console.log('failed', failed.length, failed.join('\n'))
await server.close()
