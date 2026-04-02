'use client'

import { formatTimestamp, getFlagEmoji } from '@/lib/format'
import type { TimelineItem } from '@/lib/types'
import TimelineEditForm from './TimelineEditForm'

interface Props {
  item: TimelineItem
  isActive: boolean
  isEditing: boolean
  isConfirmingDelete: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  onSave: (item: TimelineItem) => void
  onCancelEdit: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}

export default function TimelineItemRow({
  item, isActive, isEditing, isConfirmingDelete,
  onClick, onEdit, onDelete, onSave, onCancelEdit,
  onConfirmDelete, onCancelDelete,
}: Props) {
  return (
    <>
      <div
        onClick={onClick}
        className={`flex items-start gap-3 px-4 py-3 cursor-pointer border-l-[3px] transition-all group ${
          isActive 
            ? 'bg-[#ef4444]/10 border-[#ef4444]' 
            : 'border-transparent hover:bg-[#111111]'
        }`}
      >
        <span className={`font-mono text-[10px] px-2 py-0.5 rounded-md flex-shrink-0 mt-0.5 font-bold tracking-tight ${
          isActive ? 'bg-[#ef4444] text-white shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-[#1a1a1a] text-gray-500'
        }`}>
          {formatTimestamp(item.timestamp)}
        </span>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-sm font-bold text-white truncate">{item.place}</span>
            <span className="text-[10px] text-gray-600 flex-shrink-0">
              {getFlagEmoji(item.countryCode)} {item.city}
            </span>
          </div>
          <p className="text-[11px] text-gray-500 truncate leading-relaxed">{item.description}</p>
        </div>

        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={onEdit} 
            className="w-7 h-7 bg-[#3b82f6]/20 text-[#3b82f6] hover:bg-[#3b82f6]/30 rounded-lg flex items-center justify-center transition-colors"
            title="수정"
          >
            <span className="text-[11px]">✏️</span>
          </button>
          <button 
            onClick={onDelete} 
            className="w-7 h-7 bg-[#ef4444]/20 text-[#ef4444] hover:bg-[#ef4444]/30 rounded-lg flex items-center justify-center transition-colors"
            title="삭제"
          >
            <span className="text-[11px]">🗑</span>
          </button>
        </div>
      </div>

      {isEditing && (
        <TimelineEditForm mode="edit" item={item} onSave={onSave} onCancel={onCancelEdit} />
      )}

      {isConfirmingDelete && (
        <div className="mx-4 my-2 bg-[#1c0f0f] border border-[#ef4444]/30 rounded-xl px-4 py-3 flex items-center justify-between shadow-lg">
          <div>
            <p className="text-[#ef4444] font-bold text-xs mb-0.5">{item.place}</p>
            <p className="text-red-300/60 text-[10px]">이 장소 정보를 삭제할까요?</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onConfirmDelete} 
              className="bg-[#ef4444] text-white text-[11px] px-3 py-1.5 rounded-lg font-bold hover:bg-[#dc2626] transition-colors"
            >
              삭제
            </button>
            <button 
              onClick={onCancelDelete} 
              className="bg-[#1a1a1a] text-gray-400 text-[11px] px-3 py-1.5 rounded-lg hover:text-white transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </>
  )
}
