import { saveSession, loadSession } from '@/lib/session'
import { promises as fs } from 'fs'
import path from 'path'
import type { AnalysisResult } from '@/lib/types'

const SESSIONS_DIR = '/tmp/travel-map-sessions'

afterEach(async () => {
  // Clean up test sessions
  try {
    const files = await fs.readdir(SESSIONS_DIR)
    for (const f of files) {
      if (f.startsWith('test-')) await fs.unlink(path.join(SESSIONS_DIR, f))
    }
  } catch {}
})

const mockResult: AnalysisResult = {
  id: 'test-123',
  videoId: 'abc123',
  videoTitle: 'Test Video',
  items: [],
  createdAt: new Date().toISOString(),
}

describe('saveSession', () => {
  it('saves result to file and returns id', async () => {
    const id = await saveSession(mockResult)
    expect(id).toBe('test-123')
    const saved = await loadSession('test-123')
    expect(saved).toEqual(mockResult)
  })
})

describe('loadSession', () => {
  it('returns null for non-existent session', async () => {
    const result = await loadSession('non-existent-id')
    expect(result).toBeNull()
  })

  it('returns null for invalid JSON', async () => {
    await fs.mkdir(SESSIONS_DIR, { recursive: true })
    await fs.writeFile(path.join(SESSIONS_DIR, 'test-bad.json'), 'not json')
    const result = await loadSession('test-bad')
    expect(result).toBeNull()
  })
})
