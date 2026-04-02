import { promises as fs } from 'fs'
import path from 'path'
import type { AnalysisResult } from '@/lib/types'

const SESSIONS_DIR = '/tmp/travel-map-sessions'

export async function saveSession(result: AnalysisResult): Promise<string> {
  await fs.mkdir(SESSIONS_DIR, { recursive: true })
  const filePath = path.join(SESSIONS_DIR, `${result.id}.json`)
  await fs.writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8')
  return result.id
}

export async function loadSession(id: string): Promise<AnalysisResult | null> {
  const filePath = path.join(SESSIONS_DIR, `${id}.json`)
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content) as AnalysisResult
  } catch {
    return null
  }
}
