'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Link from 'next/link'
import type { AnalysisResult, TimelineItem } from '@/lib/types'
import VideoPlayer, { VideoPlayerHandle } from '@/components/VideoPlayer'
import TimelineList from '@/components/TimelineList'
import MapView from '@/components/MapView'
import BlogGenerator from '@/components/BlogGenerator'

interface Props {
  initialResult: AnalysisResult
}

export default function ResultClient({ initialResult }: Props) {
  const [result, setResult] = useState(initialResult)
  const [currentTime, setCurrentTime] = useState(0)
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null)
  const [leftWidth, setLeftWidth] = useState(400) // 기본 너비 400px
  const [isResizing, setIsResizing] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  
  const videoPlayerRef = useRef<VideoPlayerHandle>(null)

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  const handleItemClick = useCallback((timestamp: number) => {
    videoPlayerRef.current?.seekTo(timestamp)
  }, [])

  const handleItemsChange = useCallback((newItems: TimelineItem[]) => {
    setResult(prev => ({ ...prev, items: newItems }))
  }, [])

  const handleMarkerClick = useCallback((item: TimelineItem) => {
    setFocusedItemId(item.id)
    videoPlayerRef.current?.seekTo(item.timestamp)

    const element = document.getElementById(`timeline-item-${item.id}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [])

  const handleSave = useCallback(async () => {
    setSaveStatus('saving')
    try {
      const res = await fetch('/api/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      })
      const data = await res.json()
      setSaveStatus(data.success ? 'saved' : 'error')
    } catch {
      setSaveStatus('error')
    } finally {
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [result])

  // 드래그 핸들러
  const startResizing = useCallback(() => {
    setIsResizing(true)
  }, [])

  const stopResizing = useCallback(() => {
    setIsResizing(false)
  }, [])

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX
      if (newWidth >= 300 && newWidth <= 600) {
        setLeftWidth(newWidth)
      }
    }
  }, [isResizing])

  useEffect(() => {
    if (isResizing) {
      // window 밖에서 mouseup이 발생해도 리사이즈 종료되도록 document에 부착
      document.addEventListener('mousemove', resize)
      document.addEventListener('mouseup', stopResizing)
    }
    return () => {
      document.removeEventListener('mousemove', resize)
      document.removeEventListener('mouseup', stopResizing)
    }
  }, [isResizing, resize, stopResizing])

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isResizing ? 'select-none cursor-col-resize' : ''}`}>
      {/* 상단 헤더 */}
      <header className="h-14 border-b border-[#1a1a1a] flex items-center justify-between px-6 bg-[#0a0a0a] flex-shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-white tracking-tighter">
            Travel<span className="text-[#ef4444]">Map</span>
          </Link>
          <div className="h-4 w-[1px] bg-[#2a2a2a]" />
          <h2 className="text-xs font-medium text-gray-400 truncate max-w-[400px]">
            {result.videoTitle}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/" 
            className="text-[11px] font-bold text-gray-500 hover:text-white transition-colors"
          >
            새 영상 분석하기
          </Link>
          <button className="bg-[#ef4444] text-white text-[11px] font-bold px-4 py-2 rounded-lg hover:bg-[#dc2626] transition-all">
            공유하기
          </button>
        </div>
      </header>

      {/* 모바일 안내 배너 */}
      <div className="md:hidden bg-amber-900/20 border-b border-amber-900/50 px-6 py-3 flex items-center gap-3">
        <span className="text-lg">⚠️</span>
        <p className="text-xs text-amber-200 leading-tight">
          이 서비스는 지도와 타임라인 연동을 위해 데스크탑 환경에 최적화되어 있습니다. 원활한 이용을 위해 PC에서 접속해주세요.
        </p>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* 좌측 패널 */}
        <aside 
          style={{ width: `${leftWidth}px` }}
          className="flex flex-col border-r border-[#1a1a1a] bg-[#0a0a0a] flex-shrink-0 z-10"
        >
          <div className="p-4 border-b border-[#1a1a1a]">
            <VideoPlayer 
              ref={videoPlayerRef}
              videoId={result.videoId} 
              onTimeUpdate={handleTimeUpdate} 
            />
          </div>
          <div className="flex-1 overflow-hidden">
            <TimelineList 
              items={result.items} 
              activeTimestamp={currentTime}
              onItemClick={handleItemClick}
              onItemsChange={handleItemsChange}
              onMarkerFocus={setFocusedItemId}
            />
          </div>
          <div className="p-4 border-t border-[#1a1a1a] bg-[#0a0a0a] flex flex-col gap-2">
            <BlogGenerator items={result.items} videoTitle={result.videoTitle} />
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white text-[11px] font-bold px-4 py-2 rounded-lg hover:border-[#ef4444] transition-all disabled:opacity-50"
            >
              {saveStatus === 'idle' && 'DB에 저장'}
              {saveStatus === 'saving' && '저장 중...'}
              {saveStatus === 'saved' && '✓ 저장 완료'}
              {saveStatus === 'error' && '저장 실패 — 재시도'}
            </button>
          </div>
        </aside>

        {/* 리사이즈 핸들 */}
        <div 
          onMouseDown={startResizing}
          className={`w-1 h-full cursor-col-resize z-30 transition-colors hover:bg-[#ef4444] ${isResizing ? 'bg-[#ef4444]' : 'bg-transparent'}`}
        />

        {/* 우측 지도 영역 (flex-1) */}
        <main className="flex-1 relative bg-[#0a0a0a]">
          <MapView 
            items={result.items} 
            focusedItemId={focusedItemId} 
            onMarkerClick={handleMarkerClick}
          />
          
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-[#1a1a1a] px-3 py-2 rounded-lg shadow-2xl">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Map View</p>
              <p className="text-xs text-white font-medium">마커를 클릭하면 해당 시간대로 이동합니다.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
