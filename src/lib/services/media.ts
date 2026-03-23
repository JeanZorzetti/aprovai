import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { getMediaBase64 } from '@/lib/evolution'

const UPLOADS_DIR = join(process.cwd(), 'uploads')

export async function downloadAndSaveMedia(
  instanceName: string,
  messageId: string,
  analysisId: string,
  docType: string,
  mimeType: string
): Promise<string> {
  const result = await getMediaBase64(instanceName, messageId)
  const base64 = result?.base64 || result?.data?.base64

  if (!base64) {
    throw new Error(`Failed to get media for message ${messageId}`)
  }

  const ext = mimeType.includes('pdf') ? 'pdf'
    : mimeType.includes('png') ? 'png'
    : 'jpg'

  const dir = join(UPLOADS_DIR, analysisId)
  await mkdir(dir, { recursive: true })

  const filename = `${docType}_${Date.now()}.${ext}`
  const filepath = join(dir, filename)

  const buffer = Buffer.from(base64, 'base64')
  await writeFile(filepath, buffer)

  return filepath
}

export async function fileToBase64(filepath: string): Promise<string> {
  const { readFile } = await import('fs/promises')
  const buffer = await readFile(filepath)
  return buffer.toString('base64')
}
