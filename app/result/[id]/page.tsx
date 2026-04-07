import { notFound } from 'next/navigation'
import ResultClient from './ResultClient'
import type { AnalysisResult } from '@/lib/types'

interface Props {
  params: { id: string }
}

export default async function ResultPage({ params }: Props) {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
  let result: AnalysisResult | null = null

  try {
    // 백엔드 분리로 인해 외부 API 서버에서 결과 데이터를 가져옵니다.
    // 기존 /tmp 의 session.json 을 읽어오던 방식을 변경합니다.
    const res = await fetch(`${baseUrl}/api/videos/${params.id}`, { cache: 'no-store' })
    if (res.ok) {
      result = await res.json()
    }
  } catch (err) {
    console.error('Failed to fetch result', err)
  }

  if (!result) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <ResultClient initialResult={result} />
    </main>
  )
}
