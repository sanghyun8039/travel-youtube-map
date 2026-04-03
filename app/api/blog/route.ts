import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { TimelineItem } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  // API key 검증 — stream 시작 전에 수행해야 HTTP 상태 코드로 오류 반환 가능
  if (
    !process.env.ANTHROPIC_API_KEY ||
    process.env.ANTHROPIC_API_KEY.includes("your-key")
  ) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY가 설정되지 않았습니다. .env.local 파일을 확인해주세요." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const { items, videoTitle } = await req.json();
  const encoder = new TextEncoder();

  const locationsStr = items
    .map((i: TimelineItem, index: number) => {
      // 타임스탬프 포맷팅 (MM:SS 또는 HH:MM:SS)
      const date = new Date(i.timestamp * 1000);
      const timeStr =
        i.timestamp >= 3600
          ? date.toISOString().substr(11, 8)
          : date.toISOString().substr(14, 5);

      return `장소 ${index + 1}:
- 명칭: ${i.place}
- 주소: ${i.address || "주소 정보 없음"}
- 타임라인: ${timeStr}
- 설명: ${i.description}`;
    })
    .join("\n\n");

  const prompt = `당신은 전문 여행 블로거입니다. 
다음 여행 영상 정보를 바탕으로 제공된 이미지와 동일한 형식의 "네이버 블로그" 포스팅을 작성해주세요.

영상 제목: "${videoTitle}"
방문 장소 리스트:
${locationsStr}

[출력 형식 가이드 - 각 장소마다 반드시 이 형식을 따를 것]
(순서)[타임라인]장소명(영문명이 있다면 병기)
상세주소

[📸 영상의 타임라인 부근 대표 사진 2장 삽입]

(해당 장소에 대한 생생한 설명과 방문 소감을 2~3문장으로 작성하세요. 말투는 '~해요', '~네요'와 같은 친근한 어조를 사용하고 적절한 이모지를 섞어주세요.)

---

[작성 지침]
1. 헤더의 (순서)는 반드시 포함하세요.
2. 타임라인은 [MM:SS] 또는 [HH:MM:SS] 형식으로 작성하세요.
3. 주소는 헤더 바로 아랫줄에 위치시켜주세요.
4. 마지막에는 전체 여행 코스를 요약하며 마무리하세요.
5. 언어: 한국어`;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.create({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 4000,
          messages: [{ role: "user", content: prompt }],
          stream: true,
        });

        for await (const chunk of anthropicStream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`,
              ),
            );
          }
        }
        controller.enqueue(encoder.encode('data: {"done": true}\n\n'));
      } catch (err) {
        console.error("Blog generation error:", err);
        const errorMsg = err instanceof Error ? err.message : "블로그 생성 중 오류가 발생했습니다.";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: errorMsg })}\n\n`),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
