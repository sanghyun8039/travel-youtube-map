import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { TimelineItem } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const maxDuration = 300

export async function POST(req: NextRequest) {
  const { items, videoTitle } = await req.json()
  const encoder = new TextEncoder()

  const locationsStr = items
    .map((i: TimelineItem) => `- ${i.place} (${i.city}, ${i.country}): ${i.description}`)
    .join('\n')

  const prompt = `영상 제목: "${videoTitle}"
방문 장소 리스트:
${locationsStr}

위 장소들을 바탕으로 생생한 여행 블로그 포스팅을 작성해줘. 
친근하고 정보가 넘치는 말투로 작성하고, 각 장소의 특징을 잘 살려줘. 
한국어로 작성하고 Markdown 형식을 사용해.`

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.create({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
          stream: true,
        })

        for await (const chunk of anthropicStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: {"done": true}\n\n'))
      } catch (err) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: '블로그 생성 중 오류가 발생했습니다.' })}\n\n`))
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
