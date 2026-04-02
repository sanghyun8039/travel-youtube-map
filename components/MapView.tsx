'use client'

import { useEffect, useState, useMemo } from 'react'
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
  MapControl,
  ControlPosition
} from '@vis.gl/react-google-maps'
import type { TimelineItem } from '@/lib/types'

interface Props {
  items: TimelineItem[]
  focusedItemId?: string | null
}

function MapUpdater({ items, focusedItemId }: Props) {
  const map = useMap()

  useEffect(() => {
    if (!map || items.length === 0) return

    if (focusedItemId) {
      const focusedItem = items.find(i => i.id === focusedItemId)
      if (focusedItem && focusedItem.hasCoords) {
        map.panTo({ lat: focusedItem.lat, lng: focusedItem.lng })
        map.setZoom(15)
        return
      }
    }

    // 모든 마커가 보이도록 범위 조정
    const bounds = new google.maps.LatLngBounds()
    let hasValidCoords = false
    items.forEach(item => {
      if (item.hasCoords) {
        bounds.extend({ lat: item.lat, lng: item.lng })
        hasValidCoords = true
      }
    })

    if (hasValidCoords) {
      map.fitBounds(bounds, { padding: 50 })
    }
  }, [map, items, focusedItemId])

  // Polyline 그리기
  useEffect(() => {
    if (!map || items.length < 2) return

    const path = items
      .filter(i => i.hasCoords)
      .map(i => ({ lat: i.lat, lng: i.lng }))

    const polyline = new google.maps.Polyline({
      path,
      geodesic: true,
      strokeColor: '#ef4444',
      strokeOpacity: 0.7,
      strokeWeight: 2,
      icons: [{
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          scale: 3
        },
        offset: '0',
        repeat: '10px'
      }]
    })

    polyline.setMap(map)
    return () => polyline.setMap(null)
  }, [map, items])

  return null
}

export default function MapView({ items, focusedItemId }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''

  if (!apiKey) {
    return (
      <div className="w-full h-full bg-[#0a0a0a] flex items-center justify-center text-gray-500 text-xs">
        GOOGLE_MAPS_API_KEY가 설정되지 않았습니다.
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: 37.5665, lng: 126.9780 }}
          defaultZoom={12}
          mapId="TRAVEL_MAP_ID" // AdvancedMarker 사용 시 필요
          disableDefaultUI={true}
          zoomControl={true}
          style={{ width: '100%', height: '100%' }}
          gestureHandling={'greedy'}
          mapTypeId={'roadmap'}
        >
          {items.filter(i => i.hasCoords).map((item) => (
            <AdvancedMarker
              key={item.id}
              position={{ lat: item.lat, lng: item.lng }}
              title={item.place}
            >
              <Pin 
                background={focusedItemId === item.id ? '#ef4444' : '#1a1a1a'} 
                borderColor={focusedItemId === item.id ? '#ffffff' : '#ef4444'} 
                glyphColor={'#ffffff'}
                scale={focusedItemId === item.id ? 1.2 : 1}
              />
            </AdvancedMarker>
          ))}
          <MapUpdater items={items} focusedItemId={focusedItemId} />
        </Map>
      </APIProvider>
    </div>
  )
}
