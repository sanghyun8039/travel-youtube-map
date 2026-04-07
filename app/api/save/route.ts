export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { fetchChannelInfo } from '@/lib/youtube'
import type { AnalysisResult } from '@/lib/types'

const SERVER_URL = process.env.TRAVEL_SERVER_URL ?? 'http://120.142.101.230:3001'

export async function POST(req: NextRequest) {
  console.log('[API SAVE] Request received')
  let body: AnalysisResult
  try {
    body = await req.json()
    console.log('[API SAVE] Body parsed for videoId:', body.videoId)
  } catch (err) {
    console.error('[API SAVE] JSON parse error:', err)
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.videoId || !body.videoTitle || !Array.isArray(body.items)) {
    console.error('[API SAVE] Missing required fields')
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
  }

  try {
    console.log('[API SAVE] Fetching channel info...')
    const channelInfo = await fetchChannelInfo(body.videoId)
    console.log('[API SAVE] Channel info fetched:', channelInfo)

    const payload = {
      videoId: body.videoId,
      title: body.videoTitle,
      channel: {
        channelId: channelInfo.channelId,
        channelName: channelInfo.channelName,
        channelUrl: channelInfo.channelUrl,
      },
      places: body.items.map((item, i) => ({
        timestamp: item.timestamp,
        localName: item.place,
        description: item.description,
        orderIndex: i,
        googlePlaceId: item.hasCoords ? (item.googlePlaceId ?? undefined) : undefined,
        address: item.address,
        city: item.city,
        country: item.country,
        countryCode: item.countryCode,
        lat: item.hasCoords ? item.lat : undefined,
        lng: item.hasCoords ? item.lng : undefined,
      })),
    }

    console.log('[API SAVE] Sending to NestJS server...')
    const res = await fetch(`${SERVER_URL}/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('[API SAVE] Server error:', errText)
      return NextResponse.json({ success: false, error: errText }, { status: res.status })
    }

    console.log('[API SAVE] Saved successfully')
    return NextResponse.json({ success: true, savedCount: body.items.length })
  } catch (err) {
    console.error('[API SAVE] Error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
