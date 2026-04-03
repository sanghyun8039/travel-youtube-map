import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { extractVideoId, fetchTranscript, fetchVideoTitle } from '@/lib/youtube'
import { downloadAudio, transcribeWithWhisper, cleanupAudio } from '@/lib/whisper'
import { extractKeyframes } from '@/lib/keyframes'
import { extractLocations } from '@/lib/extractor'
import { geocodePlace } from '@/lib/geocoder'
import { saveSession } from '@/lib/session'
import type { SSEEvent, AnalysisResult, TimelineItem } from '@/lib/types'

export const maxDuration = 300  // 5-minute timeout

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        // 1. Extract video ID
        const videoId = extractVideoId(url)
        if (!videoId) {
          send({ step: 'error', status: 'failed', message: '유효한 YouTube URL이 아닙니다.' })
          controller.close()
          return
        }

        const videoTitle = await fetchVideoTitle(videoId)

        // 2. Try transcript
        send({ step: 'transcript', status: 'fetching' })
        let transcript = ''
        try {
          transcript = await fetchTranscript(videoId)
        } catch {}
        send({ step: 'transcript', status: transcript ? 'done' : 'not_found' })

        // 3. Whisper fallback
        if (!transcript) {
          send({ step: 'whisper', status: 'downloading' })
          let audioPath: string | null = null
          try {
            audioPath = await downloadAudio(videoId, '/tmp')
            send({ step: 'whisper', status: 'transcribing' })
            transcript = await transcribeWithWhisper(audioPath)
            send({ step: 'whisper', status: 'done' })
          } finally {
            if (audioPath) await cleanupAudio(audioPath)
          }
        }

        if (!transcript) {
          send({ step: 'error', status: 'failed', message: '자막/음성을 가져올 수 없습니다.' })
          controller.close()
          return
        }

        // 4. Keyframe extraction
        send({ step: 'keyframes', status: 'sampling' })
        let keyframes: string[] = []
        try {
          keyframes = await extractKeyframes(videoId)
          send({ step: 'keyframes', status: 'done', count: keyframes.length })
        } catch {
          send({ step: 'keyframes', status: 'failed', message: '키프레임 없이 진행합니다.' })
        }

        // 5. Claude location extraction
        send({ step: 'llm', status: 'analyzing' })
        const rawLocations = await extractLocations(transcript, keyframes)
        send({ step: 'llm', status: 'done', count: rawLocations.length })

        // 6. Parallel geocoding
        send({ step: 'geocoding', status: 'fetching' })
        const items: TimelineItem[] = await Promise.all(
          rawLocations.map(async (loc) => {
            const coords = await geocodePlace(`${loc.place}, ${loc.city}, ${loc.country}`)
            return {
              id: uuidv4(),
              timestamp: loc.timestamp,
              place: loc.place,
              city: coords?.city ?? loc.city,
              country: coords?.country ?? loc.country,
              countryCode: coords?.countryCode ?? loc.countryCode,
              address: coords?.address,
              description: loc.description,
              lat: coords?.lat ?? 0,
              lng: coords?.lng ?? 0,
              googlePlaceId: coords?.googlePlaceId,
              hasCoords: !!coords,
            }
          })
        )
        send({ step: 'geocoding', status: 'done' })

        // 7. Save and complete
        const result: AnalysisResult = {
          id: uuidv4(),
          videoId,
          videoTitle,
          items: items.sort((a, b) => a.timestamp - b.timestamp),
          createdAt: new Date().toISOString(),
        }
        await saveSession(result)
        send({ step: 'done', status: 'complete', result })

      } catch (err) {
        send({
          step: 'error',
          status: 'failed',
          message: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
        })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
