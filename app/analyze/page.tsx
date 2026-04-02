'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { SSEEvent } from '@/lib/types'

const STEP_LABELS: Record<string, string> = {
  transcript: '자막 데이터를 가져오고 있어요',
  whisper: '영상 음성을 텍스트로 변환 중이에요 (Whisper)',
  keyframes: '영상에서 시각적 단서를 찾는 중이에요',
  llm: 'AI가 방문 장소를 추출하고 있어요',
  geocoding: '지도의 정확한 좌표를 찾고 있어요',
  done: '분석이 모두 끝났습니다!',
  error: '문제가 발생했어요',
}

interface StepStatus {
  step: string
  status: string
  message?: string
  count?: number
}

function AnalyzeContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const url = searchParams.get('url') ?? ''
  const [steps, setSteps] = useState<StepStatus[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!url) {
      router.push('/')
      return
    }

    const controller = new AbortController()

    async function startAnalysis() {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      })

      if (!res.body) throw new Error('ReadableStream not supported')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '))

        for (const line of lines) {
          try {
            const event: SSEEvent = JSON.parse(line.slice(6))
            
            setSteps((prev) => {
              const existing = prev.findIndex((s) => s.step === event.step)
              const entry = { 
                step: event.step, 
                status: event.status, 
                message: event.message, 
                count: event.count 
              }
              if (existing >= 0) {
                const next = [...prev]
                next[existing] = entry
                return next
              }
              return [...prev, entry]
            })

            if (event.step === 'done' && event.result) {
              router.push(`/result/${event.result.id}`)
              return
            }
            if (event.step === 'error') {
              setError(event.message ?? '분석 중 오류가 발생했습니다.')
              return
            }
          } catch (e) {
            console.error('Failed to parse SSE event', e)
          }
        }
      }
    }

    startAnalysis().catch((err) => {
      if (err.name !== 'AbortError') {
        setError(err.message || '서버 연결 오류가 발생했습니다.')
      }
    })

    return () => controller.abort()
  }, [url, router])

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h2 className="text-white font-bold text-2xl mb-2">영상을 분석하고 있어요</h2>
        <p className="text-gray-500 text-sm">AI가 장소와 타임스탬프를 정밀하게 추출하고 있습니다. 잠시만 기다려주세요.</p>
      </div>

      <div className="space-y-4">
        {steps.map((s) => (
          <div key={s.step} className="flex items-center gap-4 group">
            <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all ${
              s.status === 'done' || s.status === 'complete' ? 'bg-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.3)]' :
              s.status === 'failed' ? 'bg-[#eab308]' : 'bg-[#ef4444] animate-pulse'
            }`} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${
                  s.status === 'done' || s.status === 'complete' ? 'text-gray-300' : 'text-white'
                }`}>
                  {STEP_LABELS[s.step] ?? s.step}
                </span>
                {s.count !== undefined && (
                  <span className="text-[10px] bg-[#1a1a1a] text-gray-500 px-1.5 py-0.5 rounded font-mono">
                    {s.count}
                  </span>
                )}
              </div>
              {s.message && s.status === 'failed' && (
                <p className="text-[#eab308] text-[11px] mt-0.5">{s.message}</p>
              )}
            </div>
          </div>
        ))}
        {steps.length === 0 && !error && (
          <div className="flex items-center gap-4">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-800" />
            <span className="text-sm text-gray-600">준비 중...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-10 p-5 rounded-xl bg-red-950/20 border border-red-900/50">
          <p className="text-[#ef4444] text-sm font-semibold mb-1">분석 중단</p>
          <p className="text-red-300/70 text-xs mb-4 leading-relaxed">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="text-xs text-white bg-red-900/40 hover:bg-red-900/60 px-4 py-2 rounded-lg transition-colors"
          >
            다른 영상으로 시도하기
          </button>
        </div>
      )}
    </div>
  )
}

export default function AnalyzePage() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6">
      <Suspense fallback={<div className="text-gray-500 text-sm">로딩 중...</div>}>
        <AnalyzeContent />
      </Suspense>
    </main>
  )
}
