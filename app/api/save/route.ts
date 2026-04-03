export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchChannelInfo } from '@/lib/youtube'
import type { AnalysisResult } from '@/lib/types'

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

    console.log('[API SAVE] Starting DB transaction...')
    await db.$transaction(async (tx) => {
      // 1. Channel upsert
      console.log('[API SAVE] Transaction: Channel upsert')
      const channel = await tx.channel.upsert({
        where: { channelId: channelInfo.channelId },
        update: { channelName: channelInfo.channelName, channelUrl: channelInfo.channelUrl },
        create: {
          channelId: channelInfo.channelId,
          channelName: channelInfo.channelName,
          channelUrl: channelInfo.channelUrl,
        },
      })

      // 2. Video upsert
      console.log('[API SAVE] Transaction: Video upsert')
      const video = await tx.video.upsert({
        where: { videoId: body.videoId },
        update: { title: body.videoTitle },
        create: {
          videoId: body.videoId,
          title: body.videoTitle,
          channelId: channel.id,
        },
      })

      // 3. 기존 VideoPlace 전체 삭제
      console.log('[API SAVE] Transaction: Delete old VideoPlaces')
      await tx.videoPlace.deleteMany({ where: { videoId: video.id } })

      // 4. 현재 items 기준 재삽입
      console.log(`[API SAVE] Transaction: Inserting ${body.items.length} items`)
      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i]
        let placeDbId: string | null = null

        if (item.hasCoords && item.googlePlaceId) {
          const place = await tx.place.upsert({
            where: { googlePlaceId: item.googlePlaceId },
            update: {},
            create: {
              googlePlaceId: item.googlePlaceId,
              name: item.place,
              address: item.address ?? null,
              city: item.city,
              country: item.country,
              countryCode: item.countryCode,
              lat: item.lat,
              lng: item.lng,
            },
          })
          placeDbId = place.id
        }

        await tx.videoPlace.create({
          data: {
            videoId: video.id,
            placeId: placeDbId,
            timestamp: item.timestamp,
            localName: item.place,
            description: item.description,
            orderIndex: i,
          },
        })
      }
    })
    console.log('[API SAVE] Transaction completed successfully')

    return NextResponse.json({ success: true, savedCount: body.items.length })
  } catch (err) {
    console.error('[API SAVE] Error occurred during processing:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    // 에러 객체 자체를 로깅하여 더 많은 정보 확인
    if (err instanceof Error && 'code' in err) {
      console.error('[API SAVE] Error code:', (err as any).code)
    }
    return NextResponse.json({ 
      success: false, 
      error: message,
      details: err instanceof Error ? err.stack : undefined
    }, { status: 500 })
  }
}
