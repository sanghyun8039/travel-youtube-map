import { notFound } from 'next/navigation'
import { loadSession } from '@/lib/session'
import ResultClient from './ResultClient'

interface Props {
  params: { id: string }
}

export default async function ResultPage({ params }: Props) {
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
