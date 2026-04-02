'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { extractVideoId } from '@/lib/youtube'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const id = extractVideoId(url.trim())
    if (!id) {
      setError('유효한 YouTube URL을 입력해주세요. (youtube.com/watch?v=... 또는 youtu.be/...)')
      return
    }
    router.push(`/analyze?url=${encodeURIComponent(url.trim())}`)
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg">
        <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
          Travel<span className="text-[#ef4444]">Map</span>
        </h1>
        <p className="text-gray-400 mb-8 text-sm">
          YouTube 여행 영상 URL을 입력하면 방문 장소를 AI가 분석해 지도에 표시합니다
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ef4444] transition-colors text-sm"
              required
            />
            {error && <p className="text-[#ef4444] text-xs px-1">{error}</p>}
          </div>
          <button
            type="submit"
            className="w-full bg-[#ef4444] hover:bg-[#dc2626] text-white font-semibold py-4 rounded-lg transition-all active:scale-[0.98]"
          >
            영상 분석 시작
          </button>
        </form>

        <div className="mt-12 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 rounded-xl bg-[#111111] border border-[#1a1a1a]">
            <div className="text-xl mb-1">📍</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">장소 추출</div>
          </div>
          <div className="p-4 rounded-xl bg-[#111111] border border-[#1a1a1a]">
            <div className="text-xl mb-1">🗺️</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">지도 표시</div>
          </div>
          <div className="p-4 rounded-xl bg-[#111111] border border-[#1a1a1a]">
            <div className="text-xl mb-1">✍️</div>
            <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">블로그 생성</div>
          </div>
        </div>
      </div>
    </main>
  )
}
