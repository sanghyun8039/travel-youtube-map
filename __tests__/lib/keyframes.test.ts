import { extractKeyframes } from '@/lib/keyframes'
import { exec, execSync } from 'child_process'
import { promises as fs } from 'fs'

jest.mock('child_process', () => ({ 
  exec: jest.fn((cmd, options, cb) => {
    if (typeof options === 'function') {
      options(null, { stdout: '', stderr: '' })
    } else if (cb) {
      cb(null, { stdout: '', stderr: '' })
    }
  }),
  execSync: jest.fn() 
}))

jest.mock('fs', () => ({
  promises: {
    mkdtemp: jest.fn().mockResolvedValue('/tmp/keyframes-test'),
    mkdir: jest.fn().mockResolvedValue(undefined),
    readdir: jest.fn().mockResolvedValue(['frame_0001.jpg', 'frame_0002.jpg']),
    readFile: jest.fn().mockResolvedValue(Buffer.from('fake-image-data')),
    rm: jest.fn().mockResolvedValue(undefined),
  },
}))

const mockExec = exec as unknown as jest.Mock

describe('extractKeyframes', () => {
  beforeEach(() => {
    mockExec.mockClear()
  })

  it('calls yt-dlp and ffmpeg via exec', async () => {
    const frames = await extractKeyframes('testVideoId')
    
    // extractKeyframes calls exec multiple times (yt-dlp -g, then ffmpeg)
    expect(mockExec).toHaveBeenCalled()
    expect(mockExec.mock.calls[0][0]).toContain('yt-dlp')
    expect(frames).toHaveLength(2)
  })
})
