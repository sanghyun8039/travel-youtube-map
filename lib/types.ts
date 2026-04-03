export interface TimelineItem {
  id: string           // uuid v4
  timestamp: number    // seconds (e.g. 468 → "07:48")
  place: string        // place name (e.g. "명동 거리")
  address?: string     // 상세 주소 (추가)
  city: string         // city (e.g. "서울")
  country: string      // country (e.g. "대한민국")
  countryCode: string  // ISO 2-letter code (e.g. "KR")
  description: string  // one-line description
  lat: number
  lng: number
  hasCoords: boolean   // false = geocoding failed → no map marker shown
  googlePlaceId?: string  // Places API에서 취득한 고유 ID
}

export interface AnalysisResult {
  id: string
  videoId: string
  videoTitle: string
  items: TimelineItem[]
  createdAt: string    // ISO 8601
}

export type SSEStep = 'transcript' | 'whisper' | 'keyframes' | 'llm' | 'geocoding' | 'done' | 'error'

export interface SSEEvent {
  step: SSEStep
  status: string       // 'fetching' | 'done' | 'failed' | 'analyzing' | ...
  message?: string
  count?: number       // e.g. number of keyframes
  result?: AnalysisResult
}
