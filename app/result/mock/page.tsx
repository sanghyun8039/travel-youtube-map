import ResultClient from '../[id]/ResultClient'
import { AnalysisResult } from '@/lib/types'

export default function MockResultPage() {
  const mockResult: AnalysisResult = {
    id: 'mock-busan-vlog',
    videoId: 'a4X27vgp1_E',
    videoTitle: '부산 여행 브이로그',
    createdAt: new Date().toISOString(),
    items: [
      { id: '1', timestamp: 3, place: '울산 태화강역', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '2', timestamp: 54, place: '해운대 블루라인파크', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '3', timestamp: 83, place: '미포정거장', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '4', timestamp: 121, place: '베이커스 박스 (Baker\'s Box)', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '5', timestamp: 129, place: '리플타운 커피 (Rippletown Coffee)', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '6', timestamp: 183, place: '스카이캡슐', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '7', timestamp: 299, place: '금수복국 센텀점', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '8', timestamp: 465, place: '그로서리 스터프 (Grocery Stuff)', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '9', timestamp: 591, place: '페이버커피 (Favor Coffee)', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '10', timestamp: 715, place: '젬스테이 (Stay Jems)', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '11', timestamp: 1118, place: '양산국밥 해운대 본점', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '12', timestamp: 1220, place: '해리단길', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '13', timestamp: 1228, place: '장인더 해리단길점', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '14', timestamp: 1350, place: '루프트 맨션 (Luft Mansion)', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '15', timestamp: 1444, place: '팟샵 (Potshop)', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '16', timestamp: 1505, place: '오묘한상점', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '17', timestamp: 1578, place: '빨간떡볶이', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '18', timestamp: 1738, place: '광안리 해수욕장', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false },
      { id: '19', timestamp: 1835, place: '이재모피자 서면별관', address: '', city: '부산', country: '대한민국', countryCode: 'KR', description: '', lat: 0, lng: 0, hasCoords: false }
    ]
  }

  return <ResultClient initialResult={mockResult} />
}


