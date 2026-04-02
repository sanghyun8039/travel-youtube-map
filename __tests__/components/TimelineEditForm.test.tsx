/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import TimelineEditForm from '@/components/TimelineEditForm'
import type { TimelineItem } from '@/lib/types'

const mockItem: TimelineItem = {
  id: 'abc',
  timestamp: 468,
  place: '명동 거리',
  city: '서울',
  country: '대한민국',
  countryCode: 'KR',
  description: '길거리 음식',
  lat: 37.5,
  lng: 126.9,
  hasCoords: true
}

describe('TimelineEditForm', () => {
  it('renders existing item values in edit mode', () => {
    render(
      <TimelineEditForm
        mode="edit"
        item={mockItem}
        onSave={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByDisplayValue('07:48')).toBeInTheDocument()
    expect(screen.getByDisplayValue('명동 거리')).toBeInTheDocument()
  })

  it('calls onSave with updated values', () => {
    const onSave = jest.fn()
    render(
      <TimelineEditForm
        mode="edit"
        item={mockItem}
        onSave={onSave}
        onCancel={jest.fn()}
      />
    )
    fireEvent.change(screen.getByDisplayValue('명동 거리'), {
      target: { value: '명동 쇼핑센터' },
    })
    fireEvent.click(screen.getByText('변경사항 저장'))
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ place: '명동 쇼핑센터' })
    )
  })

  it('calls onCancel when cancel clicked', () => {
    const onCancel = jest.fn()
    render(
      <TimelineEditForm
        mode="edit"
        item={mockItem}
        onSave={jest.fn()}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByText('취소'))
    expect(onCancel).toHaveBeenCalled()
  })

  it('renders empty form in add mode', () => {
    render(
      <TimelineEditForm mode="add" onSave={jest.fn()} onCancel={jest.fn()} />
    )
    expect(screen.getByText('새로운 장소 기록')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('00:00')).toBeInTheDocument()
  })
})
