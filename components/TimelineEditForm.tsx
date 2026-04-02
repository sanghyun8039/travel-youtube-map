'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { formatTimestamp } from '@/lib/format'
import type { TimelineItem } from '@/lib/types'

function parseTimestamp(value: string): number {
  const parts = value.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return 0
}

interface Props {
  mode: 'edit' | 'add'
  item?: TimelineItem
  onSave: (item: TimelineItem) => void
  onCancel: () => void
}

export default function TimelineEditForm({ mode, item, onSave, onCancel }: Props) {
  const [timestampStr, setTimestampStr] = useState(
    item ? formatTimestamp(item.timestamp) : ''
  )
  const [place, setPlace] = useState(item?.place ?? '')
  const [city, setCity] = useState(item?.city ?? '')
  const [country, setCountry] = useState(item?.country ?? '')
  const [countryCode, setCountryCode] = useState(item?.countryCode ?? '')
  const [description, setDescription] = useState(item?.description ?? '')

  function handleSave() {
    onSave({
      id: item?.id ?? uuidv4(),
      timestamp: parseTimestamp(timestampStr),
      place,
      city,
      country,
      countryCode: countryCode.toUpperCase().slice(0, 2),
      description,
      lat: item?.lat ?? 0,
      lng: item?.lng ?? 0,
      hasCoords: item?.hasCoords ?? false,
    })
  }

  const labelCls = 'text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 block'
  const inputCls = 'w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-md px-3 py-2 text-white text-xs focus:outline-none focus:border-[#ef4444] transition-colors placeholder-gray-700'

  return (
    <div className={`mx-4 my-2 rounded-xl p-4 border shadow-xl ${
      mode === 'add' ? 'bg-[#111111] border-[#22c55e]/30' : 'bg-[#111111] border-[#3b82f6]/30'
    }`}>
      <div className={`text-[11px] font-bold mb-4 flex items-center gap-2 ${mode === 'add' ? 'text-[#22c55e]' : 'text-[#3b82f6]'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-current" />
        {mode === 'add' ? '새로운 장소 기록' : '장소 정보 수정'}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelCls}>타임스탬프</label>
          <input 
            className={`${inputCls} font-mono`} 
            value={timestampStr} 
            onChange={(e) => setTimestampStr(e.target.value)} 
            placeholder="00:00" 
          />
        </div>
        <div>
          <label className={labelCls}>국가 코드 (ISO)</label>
          <input 
            className={`${inputCls} font-mono`} 
            value={countryCode} 
            onChange={(e) => setCountryCode(e.target.value)} 
            placeholder="KR" 
            maxLength={2} 
          />
        </div>
      </div>

      <div className="mb-4">
        <label className={labelCls}>장소 이름</label>
        <input 
          className={inputCls} 
          value={place} 
          onChange={(e) => setPlace(e.target.value)} 
          placeholder="예: 경복궁, 에펠탑" 
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className={labelCls}>도시</label>
          <input 
            className={inputCls} 
            value={city} 
            onChange={(e) => setCity(e.target.value)} 
            placeholder="서울" 
          />
        </div>
        <div>
          <label className={labelCls}>국가명</label>
          <input 
            className={inputCls} 
            value={country} 
            onChange={(e) => setCountry(e.target.value)} 
            placeholder="대한민국" 
          />
        </div>
      </div>

      <div className="mb-6">
        <label className={labelCls}>설명</label>
        <textarea 
          className={`${inputCls} resize-none h-16`} 
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="이 장소에 대한 짧은 설명을 적어주세요" 
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold text-white transition-all active:scale-[0.97] ${
            mode === 'add' ? 'bg-[#22c55e] hover:bg-[#16a34a]' : 'bg-[#3b82f6] hover:bg-[#2563eb]'
          }`}
        >
          {mode === 'add' ? '장소 추가하기' : '변경사항 저장'}
        </button>
        <button 
          onClick={onCancel} 
          className="px-4 py-2.5 rounded-lg text-xs bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#252525] transition-colors"
        >
          취소
        </button>
      </div>
    </div>
  )
}
