// Photos for log entries. In the artifact they go to the artifact's asset store;
// in the standalone app they are kept as small JPEGs inside the saved data.
import { ARTIFACT } from './artifactDb'

export type Photo = { id: string; url: string }
type Assets = { upload(b: Blob): Promise<{ id: string; url: string }> }

let assetsP: Promise<Assets | null> | null = null
function getAssets(): Promise<Assets | null> {
  if (!assetsP) assetsP = window.claude?.use ? (window.claude.use('assets') as Promise<Assets | null>).catch(() => null) : Promise.resolve(null)
  return assetsP
}

async function resize(file: File, max: number, quality: number): Promise<Blob> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale)
  c.height = Math.round(bmp.height * scale)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  bmp.close()
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error('Could not read the image'))), 'image/jpeg', quality))
}

export async function addPhoto(file: File): Promise<Photo> {
  if (ARTIFACT) {
    const assets = await getAssets()
    if (!assets) throw new Error('Photos can be added when the page is open on claude.ai')
    const blob = await resize(file, 1800, 0.85)
    const a = await assets.upload(blob)
    return { id: a.id, url: a.url }
  }
  const blob = await resize(file, 720, 0.7)
  const url = await new Promise<string>((res) => {
    const r = new FileReader()
    r.onload = () => res(String(r.result))
    r.readAsDataURL(blob)
  })
  return { id: `local-${Date.now().toString(36)}`, url }
}

/** Only show image sources we created ourselves. */
export const safeSrc = (u: string) => (u.startsWith('/_blob/') || u.startsWith('data:image/') || u.startsWith('https://') ? u : '')
