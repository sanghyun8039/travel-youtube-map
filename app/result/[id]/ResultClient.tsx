'use client'

import { useState, useRef, useCallback } from 'react'
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
  const videoPlayerRef = useRef<VideoPlayerHandle>(null)

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time)
  }, [])

  const handleItemClick = useCallback((timestamp: number) => {
    videoPlayerRef.current?.seekTo(timestamp)
  }, [])

  const handleItemsChange = useCallback((newItems: TimelineItem[]) => {
    setResult(prev => ({ ...prev, items: newItems }))
    // 실제 서비스라면 여기서 API를 통해 서버 세션도 업데이트해야 함
  }, [])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
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

      {/* 메인 컨텐츠 (2컬럼 레이아웃) */}
      <div className="flex flex-1 overflow-hidden">
        {/* 좌측 패널 (400px 고정) */}
        <aside className="w-[400px] flex flex-col border-r border-[#1a1a1a] bg-[#0a0a0a] flex-shrink-0 z-10">
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
          {/* 블로그 생성 버튼 영역 */}
          <div className="p-4 border-t border-[#1a1a1a] bg-[#0a0a0a]">
            <BlogGenerator items={result.items} videoTitle={result.videoTitle} />
          </div>
        </aside>

        {/* 우측 지도 영역 (flex-1) */}
        <main className="flex-1 relative bg-[#0a0a0a]">
          <MapView 
            items={result.items} 
            focusedItemId={focusedItemId} 
          />
          
          {/* 지도 위 안내 배너 (선택 사항) */}
          <div className="absolute top-4 left-4 z-10 pointer-events-none">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-md border border-[#1a1a1a] px-3 py-2 rounded-lg shadow-2xl">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Map View</p>
              <p className="text-xs text-white font-medium">타임라인의 장소를 클릭하면 해당 위치로 이동합니다.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
