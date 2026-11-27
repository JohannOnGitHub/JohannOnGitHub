// Artifact mode: the page is published as a claude.ai Artifact. Records live in the
// artifact's database (shared across your devices), and live conditions are written
// there as snapshots, because an artifact page cannot call outside APIs itself.

export const ARTIFACT = import.meta.env.MODE === 'artifact'

type Snap = { id: string; data(): Record<string, unknown> | undefined }
type QuerySnap = { docs: Snap[]; metadata: { fromCache: boolean } }
type DocRef = { set(d: Record<string, unknown>): Promise<void>; delete(): Promise<void>; get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }> }
type ColRef = { doc(id: string): DocRef; onSnapshot(next: (s: QuerySnap) => void, err?: (e: { code?: string; message?: string }) => void): () => void }
export type DB = { collection(path: string): ColRef }

declare global {
  interface Window {
    claude?: { use(name: string): Promise<unknown> }
  }
}

let dbPromise: Promise<DB | null> | null = null
export function getDb(): Promise<DB | null> {
  if (!dbPromise) {
    dbPromise = window.claude?.use
      ? (window.claude.use('db') as Promise<DB | null>).catch(() => null)
      : Promise.resolve(null)
  }
  return dbPromise
}

/** Read one conditions snapshot written by Claude (collection "conditions"). */
export async function readSnapshot<T>(id: string): Promise<T> {
  const db = await getDb()
  if (!db) throw new Error('Open this page on claude.ai to see conditions')
  const s = await db.collection('conditions').doc(id).get()
  const d = s.data() as { value?: T } | undefined
  if (!s.exists || !d?.value) throw new Error('No snapshot yet: ask Claude to refresh conditions')
  return d.value
}
