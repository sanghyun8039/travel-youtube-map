'use client'

import { useState, useCallback, useRef } from 'react'
import type { TimelineItem } from '@/lib/types'
import TimelineItemRow from './TimelineItemRow'
import TimelineEditForm from './TimelineEditForm'

interface Props {
  items: TimelineItem[]
  activeTimestamp: number
  onItemClick: (timestamp: number) => void
  onItemsChange: (items: TimelineItem[]) => void
  onMarkerFocus: (itemId: string) => void
}

export default function TimelineList({ items, activeTimestamp, onItemClick, onItemsChange, onMarkerFocus }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // 현재 타임스탬프보다 작거나 같은 것 중 가장 늦은 시간의 아이템을 활성 아이템으로 간주
  const activeItem = items.reduce<TimelineItem | null>((best, item) => {
    if (item.timestamp > activeTimestamp) return best
    if (!best || item.timestamp > best.timestamp) return item
    return best
  }, null)

  const handleSave = useCallback((updated: TimelineItem) => {
    const next = items.map((i) => (i.id === updated.id ? updated : i))
    onItemsChange(next.sort((a, b) => a.timestamp - b.timestamp))
    setEditingId(null)
  }, [items, onItemsChange])

  const handleConfirmDelete = useCallback((id: string) => {
    onItemsChange(items.filter((i) => i.id !== id))
    setDeletingId(null)
  }, [items, onItemsChange])

  const handleAdd = useCallback((newItem: TimelineItem) => {
    const next = [...items, newItem].sort((a, b) => a.timestamp - b.timestamp)
    onItemsChange(next)
    setShowAddForm(false)
  }, [items, onItemsChange])

  return (
    <div className="flex flex-col h-full bg-[#111111] border-r border-[#1a1a1a]">
      <div className="px-6 py-5 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h3 className="text-sm font-bold text-white mb-0.5">방문 장소 타임라인</h3>
          <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">Total {items.length} locations</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="w-8 h-8 rounded-full bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#2a2a2a] flex items-center justify-center transition-all"
          title="장소 추가"
        >
          <span className="text-lg">+</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto" ref={listRef}>
        {showAddForm && (
          <TimelineEditForm mode="add" onSave={handleAdd} onCancel={() => setShowAddForm(false)} />
        )}

        {items.length === 0 && !showAddForm ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-8">
            <div className="w-12 h-12 bg-[#1a1a1a] rounded-full flex items-center justify-center mb-4">
              <span className="text-xl">📍</span>
            </div>
            <p className="text-white font-bold text-sm mb-1">장소를 찾지 못했어요</p>
            <p className="text-gray-500 text-xs leading-relaxed mb-6">영상 속 방문 장소를 직접 추가하거나 다시 분석해 보세요.</p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="bg-[#ef4444] text-white text-xs font-bold px-6 py-2.5 rounded-lg hover:bg-[#dc2626] transition-all"
            >
              첫 번째 장소 추가하기
            </button>
          </div>
        ) : (
          <div className="py-2">
            {items.map((item) => (
              <TimelineItemRow
                key={item.id}
                item={item}
                isActive={activeItem?.id === item.id}
                isEditing={editingId === item.id}
                isConfirmingDelete={deletingId === item.id}
                onClick={() => {
                  onItemClick(item.timestamp)
                  onMarkerFocus(item.id)
                }}
                onEdit={() => setEditingId(item.id)}
                onDelete={() => setDeletingId(item.id)}
                onSave={handleSave}
                onCancelEdit={() => setEditingId(null)}
                onConfirmDelete={() => handleConfirmDelete(item.id)}
                onCancelDelete={() => setDeletingId(null)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
