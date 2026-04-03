import { downloadAudio, transcribeWithWhisper, cleanupAudio } from '@/lib/whisper'
import { exec, execSync } from 'child_process'
import { promises as fs } from 'fs'
import { createReadStream } from 'fs'
import OpenAI from 'openai'

// Mock OpenAI simply
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: jest.fn().mockResolvedValue('transcribed text'),
      },
    },
  }))
})

jest.mock('child_process', () => ({ 
  exec: jest.fn((cmd, cb) => cb(null, { stdout: '', stderr: '' })),
  execSync: jest.fn() 
}))

jest.mock('fs', () => ({
  promises: {
    unlink: jest.fn(),
  },
  createReadStream: jest.fn(),
}))

const mockExec = exec as unknown as jest.Mock

describe('whisper service', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('downloadAudio', () => {
    it('calls yt-dlp with correct arguments', async () => {
      const result = await downloadAudio('testVideoId', '/tmp')
      
      expect(mockExec).toHaveBeenCalledWith(
        expect.stringContaining('yt-dlp'),
        expect.any(Function)
      )
      expect(result).toContain('testVideoId.mp3')
    })
  })

  describe('transcribeWithWhisper', () => {
    it('calls openai transcribe', async () => {
      // Mocked return value should come through
      const result = await transcribeWithWhisper('/tmp/test.mp3')
      expect(result).toBe('transcribed text')
    })
  })

  describe('cleanupAudio', () => {
    it('calls fs.unlink', async () => {
      await cleanupAudio('/tmp/test.mp3')
      expect(fs.unlink).toHaveBeenCalledWith('/tmp/test.mp3')
    })
  })
})
