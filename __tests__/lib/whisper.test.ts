import { downloadAudio, transcribeWithWhisper, cleanupAudio } from '@/lib/whisper'
import { execSync } from 'child_process'
import { promises as fs } from 'fs'
import { createReadStream } from 'fs'

jest.mock('child_process', () => ({ execSync: jest.fn() }))
jest.mock('fs', () => ({
  promises: {
    unlink: jest.fn(),
  },
  createReadStream: jest.fn(),
}))
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: jest.fn().mockResolvedValue('transcribed text'),
      },
    },
  }))
})

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>
const mockUnlink = fs.unlink as jest.MockedFunction<typeof fs.unlink>

describe('downloadAudio', () => {
  it('calls yt-dlp with correct arguments', async () => {
    mockExecSync.mockReturnValue(Buffer.from(''))
    const result = await downloadAudio('testVideoId', '/tmp')
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('yt-dlp'),
      expect.any(Object)
    )
    expect(mockExecSync).toHaveBeenCalledWith(
      expect.stringContaining('testVideoId'),
      expect.any(Object)
    )
    expect(result).toContain('testVideoId')
  })
})

describe('transcribeWithWhisper', () => {
  it('returns transcription text', async () => {
    const result = await transcribeWithWhisper('/tmp/audio.mp3')
    expect(result).toBe('transcribed text')
  })
})

describe('cleanupAudio', () => {
  it('deletes the audio file', async () => {
    mockUnlink.mockResolvedValue(undefined)
    await cleanupAudio('/tmp/audio.mp3')
    expect(mockUnlink).toHaveBeenCalledWith('/tmp/audio.mp3')
  })

  it('does not throw if file does not exist', async () => {
    mockUnlink.mockRejectedValue(new Error('ENOENT'))
    await expect(cleanupAudio('/tmp/missing.mp3')).resolves.not.toThrow()
  })
})
