import { YoutubeTranscript } from 'youtube-transcript'

export function extractVideoId(url: string): string | null {
  if (!url) return null
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1) || null
    }
    if (parsed.hostname.includes('youtube.com')) {
      if (parsed.pathname.startsWith('/embed/')) {
        return parsed.pathname.split('/')[2] || null
      }
      return parsed.searchParams.get('v')
    }
    return null
  } catch {
    return null
  }
}

export async function fetchTranscript(videoId: string): Promise<string> {
  const items = await YoutubeTranscript.fetchTranscript(videoId)
  return items.map((item) => item.text).join(' ')
}

export async function fetchVideoTitle(videoId: string): Promise<string> {
  const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
  if (!res.ok) throw new Error(`Failed to fetch video title: ${res.status}`)
  const data = await res.json()
  return data.title as string
}

export interface ChannelInfo {
  channelId: string   // URL 마지막 세그먼트 (@handle 또는 UCxxxx)
  channelName: string
  channelUrl: string
}

export async function fetchChannelInfo(videoId: string): Promise<ChannelInfo> {
  const res = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  )
  if (!res.ok) throw new Error(`oEmbed failed: ${res.status}`)
  const data = await res.json()
  const channelUrl = data.author_url as string
  const parts = channelUrl.replace(/\/$/, '').split('/')
  const channelId = parts[parts.length - 1]
  return {
    channelId,
    channelName: data.author_name as string,
    channelUrl,
  }
}
