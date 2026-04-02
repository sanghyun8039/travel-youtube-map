'use client'

import { useState } from 'react'
import type { TimelineItem } from '@/lib/types'

interface Props {
  items: TimelineItem[]
  videoTitle: string
}

export default function BlogGenerator({ items, videoTitle }: Props) {
  const [blogContent, setBlogContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [error, setError] = useState('')

  async function generateBlog() {
    if (items.length === 0) return

    setIsGenerating(true)
    setBlogContent('')
    setShowModal(true)
    setError('')

    try {
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, videoTitle }),
      })

      if (!res.body) throw new Error('No body')
      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '))

        for (const line of lines) {
          const data = JSON.parse(line.slice(6))
          if (data.text) {
            setBlogContent(prev => prev + data.text)
          }
          if (data.error) {
            setError(data.error)
          }
          if (data.done) {
            setIsGenerating(false)
          }
        }
      }
    } catch (err) {
      setError('블로그 생성 중 오류가 발생했습니다.')
      setIsGenerating(false)
    }
  }

  return (
    <>
      <button 
        onClick={generateBlog}
        disabled={items.length === 0}
        className="w-full bg-white text-black py-3 rounded-lg text-xs font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span>✍️</span> AI 여행 블로그 생성하기
      </button>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#0f0f0f] border border-[#1a1a1a] rounded-2xl flex flex-col max-h-[80vh] shadow-2xl overflow-hidden">
            <header className="px-6 py-4 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0a0a0a]">
              <div>
                <h3 className="text-sm font-bold text-white">AI 여행 블로그</h3>
                <p className="text-[10px] text-gray-500 font-medium">영상을 바탕으로 포스팅을 작성합니다.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-full bg-[#1a1a1a] text-gray-400 hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </header>

            <div className="flex-1 overflow-y-auto p-8 whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-300">
              {blogContent || (isGenerating && !error && (
                <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                  <div className="text-3xl mb-4">🖋️</div>
                  <p className="text-gray-500 text-xs font-medium">글을 작성하는 중입니다...</p>
                </div>
              ))}
              {error && (
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-900/50 text-[#ef4444] text-xs">
                  {error}
                </div>
              )}
            </div>

            <footer className="px-6 py-4 border-t border-[#1a1a1a] bg-[#0a0a0a] flex justify-end gap-3">
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(blogContent)
                  alert('클립보드에 복사되었습니다.')
                }}
                disabled={!blogContent || isGenerating}
                className="bg-[#1a1a1a] text-white text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-[#2a2a2a] transition-all disabled:opacity-30"
              >
                복사하기
              </button>
              <button 
                onClick={() => setShowModal(false)}
                className="bg-[#ef4444] text-white text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-[#dc2626] transition-all"
              >
                닫기
              </button>
            </footer>
          </div>
        </div>
      )}
    </>
  )
}
