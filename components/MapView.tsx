'use client'

import { useEffect } from 'react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap
} from '@vis.gl/react-google-maps'
import type { TimelineItem } from '@/lib/types'

interface Props {
  items: TimelineItem[]
  focusedItemId?: string | null
  onMarkerClick?: (item: TimelineItem) => void
}

function MapUpdater({ items, focusedItemId }: Props) {
  const map = useMap()

  useEffect(() => {
    if (!map || items.length === 0) return

    // 1. 특정 아이템 하이라이트 시 해당 위치로 강제 이동
    if (focusedItemId) {
      const focusedItem = items.find(i => String(i.id) === String(focusedItemId))
      if (focusedItem && focusedItem.hasCoords) {
        map.setCenter({ lat: focusedItem.lat, lng: focusedItem.lng })
        map.setZoom(17)
        return
      }
    }

    // 2. 전체 아이템 보기 (focusedItemId가 없을 때만 실행)
    const bounds = new google.maps.LatLngBounds()
    let hasValidCoords = false
    items.forEach(item => {
      if (item.hasCoords) {
        bounds.extend({ lat: item.lat, lng: item.lng })
        hasValidCoords = true
      }
    })

    if (hasValidCoords) {
      map.fitBounds(bounds, 80)
    }
  }, [map, items, focusedItemId])

  // Polyline 그리기 (경로 표시)
  useEffect(() => {
    if (!map || items.length < 2) return

    const path = items
      .filter(i => i.hasCoords)
      .map(i => ({ lat: i.lat, lng: i.lng }))

    if (path.length < 2) return

    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#ef4444',
      strokeOpacity: 0.4,
      strokeWeight: 2,
      icons: [{
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          scale: 2
        },
        offset: '0',
        repeat: '12px'
      }]
    })

    polyline.setMap(map)
    return () => polyline.setMap(null)
  }, [map, items]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}

export default function MapView({ items, focusedItemId, onMarkerClick }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center text-gray-500 text-xs">
        GOOGLE_MAPS_API_KEY가 설정되지 않았습니다.
      </div>
    )
  }

  // 순서대로 정렬된 아이템 (마커 번호 표시용)
  const sortedItems = [...items].sort((a, b) => a.timestamp - b.timestamp)

  return (
    <div className="w-full h-full relative">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: 35.658, lng: 139.702 }}
          defaultZoom={12}
          mapId="TRAVEL_MAP_ID"
          disableDefaultUI={true}
          zoomControl={true}
          style={{ width: '100%', height: '100%' }}
          gestureHandling={'greedy'}
          mapTypeId={'roadmap'}
        >
          {items.filter(i => i.hasCoords).map((item) => {
            const sequenceNumber = sortedItems.findIndex(i => i.id === item.id) + 1
            const isFocused = String(focusedItemId) === String(item.id)
            
            return (
              <AdvancedMarker
                key={item.id}
                position={{ lat: item.lat, lng: item.lng }}
                title={`${sequenceNumber}. ${item.place}`}
                onClick={() => onMarkerClick?.(item)}
              >
                <Pin 
                  background={isFocused ? '#ef4444' : '#1a1a1a'} 
                  borderColor={isFocused ? '#ffffff' : '#ef4444'} 
                  glyphColor={'#ffffff'}
                  scale={isFocused ? 1.4 : 1}
                  glyph={String(sequenceNumber)}
                />
              </AdvancedMarker>
            )
          })}
          <MapUpdater items={items} focusedItemId={focusedItemId} />
        </Map>
      </APIProvider>
    </div>
  )
}
