import { notFound } from 'next/navigation'
import { loadSession } from '@/lib/session'
import { validateEnv } from '@/lib/env'
import ResultClient from './ResultClient'

interface Props {
  params: { id: string }
}

export default async function ResultPage({ params }: Props) {
  // 서버 사이드 환경변수 검증
  validateEnv()
  
  const result = await loadSession(params.id)

  if (!result) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <ResultClient initialResult={result} />
    </main>
  )
}
