import { extractVideoId } from '@/lib/youtube'

const mockFetch = jest.fn()
global.fetch = mockFetch
beforeEach(() => { mockFetch.mockReset() })

describe('extractVideoId', () => {
  it('extracts id from standard watch URL', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts id from shortened URL', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts id from embed URL', () => {
    expect(extractVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('returns null for non-YouTube URL', () => {
    expect(extractVideoId('https://example.com')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(extractVideoId('')).toBeNull()
  })

  it('handles URL with extra query params', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s')).toBe('dQw4w9WgXcQ')
  })
})

describe('fetchChannelInfo', () => {
  it('returns channelId, channelName, channelUrl for @handle format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        title: '마카오 브이로그',
        author_name: '여행채널',
        author_url: 'https://www.youtube.com/@travel-channel',
      }),
    })

    const { fetchChannelInfo } = await import('@/lib/youtube')
    const result = await fetchChannelInfo('test-video-id')

    expect(result).toEqual({
      channelId: '@travel-channel',
      channelName: '여행채널',
      channelUrl: 'https://www.youtube.com/@travel-channel',
    })
  })

  it('extracts channelId from /channel/UCxxxx URL format', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        title: 'title',
        author_name: '채널명',
        author_url: 'https://www.youtube.com/channel/UCxxxxtest',
      }),
    })

    const { fetchChannelInfo } = await import('@/lib/youtube')
    const result = await fetchChannelInfo('vid')
    expect(result.channelId).toBe('UCxxxxtest')
  })

  it('throws on non-ok oEmbed response', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

    const { fetchChannelInfo } = await import('@/lib/youtube')
    await expect(fetchChannelInfo('bad-id')).rejects.toThrow('oEmbed failed: 404')
  })
})
