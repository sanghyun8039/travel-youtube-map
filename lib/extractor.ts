import Anthropic from '@anthropic-ai/sdk'

interface RawLocation {
  timestamp: number
  place: string
  city: string
  country: string
  countryCode: string
  description: string
}

export async function extractLocations(
  transcript: string,
  keyframes: string[]
): Promise<RawLocation[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const content: Anthropic.MessageParam['content'] = []

  // Add keyframe images if available
  for (const frame of keyframes.slice(0, 10)) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: frame },
    })
  }

  content.push({
    type: 'text',
    text: `다음은 YouTube 여행 영상의 자막(transcript)입니다. 영상에서 방문한 장소들을 타임스탬프와 함께 추출해주세요.

자막:
${transcript.slice(0, 8000)}

다음 JSON 배열 형식으로만 응답해주세요 (다른 텍스트 없이):
[
  {
    "timestamp": <초 단위 정수>,
    "place": "<장소명 (한국어 또는 현지어)>",
    "city": "<도시명>",
    "country": "<국가명 (한국어)>",
    "countryCode": "<ISO 2-letter code>",
    "description": "<한 줄 설명>"
  }
]

규칙:
- 구체적인 장소만 포함 (음식점, 관광지, 거리, 도시 등)
- 타임스탬프는 해당 장소가 처음 등장하는 시점
- 장소가 없으면 빈 배열 [] 반환
- JSON만 응답, 마크다운 코드블록 없이`,
  })

  try {
    const response = await client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 4096,
      messages: [{ role: 'user', content }],
    })

    const text = response.content
      .filter((c) => c.type === 'text')
      .map((c) => (c as { type: 'text'; text: string }).text)
      .join('')

    // Strip markdown code blocks if present
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as RawLocation[]
  } catch {
    return []
  }
}
