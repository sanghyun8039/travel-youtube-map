export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { fetchChannelInfo } from '@/lib/youtube'
import type { AnalysisResult } from '@/lib/types'

export async function POST(req: NextRequest) {
  let body: AnalysisResult
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.videoId || !body.videoTitle || !Array.isArray(body.items)) {
    return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // 채널 정보는 트랜잭션 밖에서 먼저 취득 (외부 API 호출은 트랜잭션 안에 두지 않음)
    const channelInfo = await fetchChannelInfo(body.videoId)

    await db.$transaction(async (tx) => {
      // 1. Channel upsert
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
      const video = await tx.video.upsert({
        where: { videoId: body.videoId },
        update: { title: body.videoTitle },
        create: {
          videoId: body.videoId,
          title: body.videoTitle,
          channelId: channel.id,
        },
      })

      // 3. 기존 VideoPlace 전체 삭제 (현재 items 상태로 재삽입)
      await tx.videoPlace.deleteMany({ where: { videoId: video.id } })

      // 4. 현재 items 기준 재삽입 (Places API 재호출 없음 — googlePlaceId는 분석 시점에 저장됨)
      for (let i = 0; i < body.items.length; i++) {
        const item = body.items[i]
        let placeDbId: string | null = null

        if (item.hasCoords && item.googlePlaceId) {
          const place = await tx.place.upsert({
            where: { googlePlaceId: item.googlePlaceId },
            update: {},  // Place 기본 정보는 최초 저장 후 덮어쓰지 않음
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

    return NextResponse.json({ success: true, savedCount: body.items.length })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
