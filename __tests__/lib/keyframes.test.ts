import { extractKeyframes } from '@/lib/keyframes'
import { execSync } from 'child_process'
import { promises as fs } from 'fs'

jest.mock('child_process', () => ({ execSync: jest.fn() }))

jest.mock('fs', () => ({
  promises: {
    mkdtemp: jest.fn().mockResolvedValue('/tmp/keyframes-test'),
    mkdir: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue(['frame_0001.jpg', 'frame_0002.jpg']),
    readFile: jest.fn().mockResolvedValue(Buffer.from('fake-image-data')),
    rm: jest.fn().mockResolvedValue(undefined),
  },
}))

const mockExecSync = execSync as jest.MockedFunction<typeof execSync>

describe('extractKeyframes', () => {
  beforeEach(() => {
    mockExecSync.mockReturnValue(Buffer.from(''))
  })

  it('calls yt-dlp and ffmpeg', async () => {
    const frames = await extractKeyframes('testVideoId')
    expect(mockExecSync).toHaveBeenCalledTimes(2)
    expect(mockExecSync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('yt-dlp'),
      expect.any(Object)
    )
    expect(mockExecSync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('ffmpeg'),
      expect.any(Object)
    )
  })

  it('returns base64 encoded frames', async () => {
    const frames = await extractKeyframes('testVideoId')
    expect(frames).toHaveLength(2)
    expect(frames[0]).toBe(Buffer.from('fake-image-data').toString('base64'))
  })

  it('cleans up temp directory', async () => {
    await extractKeyframes('testVideoId')
    expect(fs.rm).toHaveBeenCalledWith('/tmp/keyframes-test', {
      recursive: true,
      force: true,
    })
  })
})
