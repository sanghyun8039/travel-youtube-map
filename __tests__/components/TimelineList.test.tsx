/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import TimelineList from '@/components/TimelineList'
import type { TimelineItem } from '@/lib/types'

const items: TimelineItem[] = [
  { id: '1', timestamp: 32, place: '인천공항', city: '인천', country: '대한민국', countryCode: 'KR', description: '도착', lat: 37.4, lng: 126.4, hasCoords: true },
  { id: '2', timestamp: 468, place: '명동 거리', city: '서울', country: '대한민국', countryCode: 'KR', description: '쇼핑', lat: 37.5, lng: 126.9, hasCoords: true },
]

describe('TimelineList', () => {
  it('renders all items', () => {
    render(<TimelineList items={items} activeTimestamp={0} onItemClick={jest.fn()} onItemsChange={jest.fn()} onMarkerFocus={jest.fn()} />)
    expect(screen.getByText('인천공항')).toBeInTheDocument()
    expect(screen.getByText('명동 거리')).toBeInTheDocument()
  })

  it('calls onItemClick with timestamp when item clicked', () => {
    const onItemClick = jest.fn()
    render(<TimelineList items={items} activeTimestamp={0} onItemClick={onItemClick} onItemsChange={jest.fn()} onMarkerFocus={jest.fn()} />)
    fireEvent.click(screen.getByText('인천공항'))
    expect(onItemClick).toHaveBeenCalledWith(32)
  })

  it('shows add form when + button clicked', () => {
    render(<TimelineList items={items} activeTimestamp={0} onItemClick={jest.fn()} onItemsChange={jest.fn()} onMarkerFocus={jest.fn()} />)
    fireEvent.click(screen.getByTitle('장소 추가'))
    expect(screen.getByText('새로운 장소 기록')).toBeInTheDocument()
  })

  it('shows empty state when items is empty', () => {
    render(<TimelineList items={[]} activeTimestamp={0} onItemClick={jest.fn()} onItemsChange={jest.fn()} onMarkerFocus={jest.fn()} />)
    expect(screen.getByText('장소를 찾지 못했어요')).toBeInTheDocument()
    expect(screen.getByText('첫 번째 장소 추가하기')).toBeInTheDocument()
  })
})
