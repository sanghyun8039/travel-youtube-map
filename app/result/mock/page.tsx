import ResultClient from '../[id]/ResultClient'
import { AnalysisResult } from '@/lib/types'

export default function MockResultPage() {
  const mockResult: AnalysisResult = {
    id: 'mock-busan-vlog',
    videoId: 'a4X27vgp1_E',
    videoTitle: '부산 여행 브이로그',
    createdAt: new Date().toISOString(),
    items: [
      { id: '1', timestamp: 3, place: '울산 태화강역', address: '울산광역시 남구 삼산동', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.539408, lng: 129.353788, hasCoords: true, googlePlaceId: 'ChIJvztxeA7NZzURqdTv1lCdMx4' },
      { id: '2', timestamp: 54, place: '해운대 블루라인파크', address: '부산광역시 해운대구', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.161373, lng: 129.191876, hasCoords: true, googlePlaceId: 'ChIJswP7EdKNaDURw-a1ZgZ_-Uk' },
      { id: '3', timestamp: 83, place: '미포정거장', address: '부산광역시 해운대구 달맞이길62번길 13', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.158284, lng: 129.172767, hasCoords: true, googlePlaceId: 'ChIJfdIYWwuNaDURDx-eqtUjCkg' },
      { id: '4', timestamp: 121, place: '베이커스 박스 (Baker\'s Box)', address: '부산광역시 해운대구 달맞이길62번길 49', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.157985, lng: 129.172583, hasCoords: true, googlePlaceId: 'ChIJy43IRgCNaDURIp358zSl1dI' },
      { id: '5', timestamp: 129, place: '리플타운 커피 (Rippletown Coffee)', address: '부산광역시 해운대구', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.158063, lng: 129.172609, hasCoords: true, googlePlaceId: 'ChIJ6d2ybgCNaDUR-GIuD-HN4gQ' },
      { id: '6', timestamp: 183, place: '스카이캡슐', address: '부산광역시 해운대구', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.161373, lng: 129.191876, hasCoords: true, googlePlaceId: 'ChIJswP7EdKNaDURw-a1ZgZ_-Uk' },
      { id: '7', timestamp: 299, place: '금수복국 센텀점', address: '부산광역시 해운대구 센텀3로 26', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.167252, lng: 129.133337, hasCoords: true, googlePlaceId: 'ChIJ0VK8ZseSaDURsnsjsQsVRlc' },
      { id: '8', timestamp: 465, place: '그로서리 스터프 (Grocery Stuff)', address: '부산광역시 해운대구 센텀남대로 35', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.168922, lng: 129.129631, hasCoords: true, googlePlaceId: 'ChIJ420DBn2TaDUR7e4r2-BysHI' },
      { id: '9', timestamp: 591, place: '페이버커피 (Favor Coffee)', address: '부산광역시 부산진구 서전로68번길 52', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.155535, lng: 129.067162, hasCoords: true, googlePlaceId: 'ChIJCxhkTHWTaDURTQYCoIMyF1Q' },
      { id: '10', timestamp: 715, place: '젬스테이 (Stay Jems)', address: '부산광역시 부산진구 중앙대로 752', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.159391, lng: 129.060874, hasCoords: true, googlePlaceId: 'ChIJBS3gA2braDURPJDmCh3wpc8' },
      { id: '11', timestamp: 1118, place: '양산국밥 해운대 본점', address: '부산광역시 해운대구 좌동로10번길 75', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.167901, lng: 129.172726, hasCoords: true, googlePlaceId: 'ChIJOSfZhnKNaDURkr_5TxWfCKg' },
      { id: '12', timestamp: 1220, place: '해리단길', address: '부산광역시 해운대구 우동', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.164841, lng: 129.157627, hasCoords: true, googlePlaceId: 'ChIJy48lzEWNaDURRh-refpJyNw' },
      { id: '13', timestamp: 1228, place: '장인더 해리단길점', address: '부산광역시 해운대구', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.166013, lng: 129.157993, hasCoords: true, googlePlaceId: 'ChIJs3CXLwCNaDURbHrWRYujCnA' },
      { id: '14', timestamp: 1350, place: '루프트 맨션 (Luft Mansion)', address: '부산광역시 해운대구 우동1로38번가길 1', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.165094, lng: 129.158060, hasCoords: true, googlePlaceId: 'ChIJzbVGQzGNaDUR0dPT3aoFe3o' },
      { id: '15', timestamp: 1444, place: '팟샵 (Potshop)', address: '부산광역시 해운대구', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.165094, lng: 129.158060, hasCoords: true, googlePlaceId: 'ChIJpb3-XgCNaDURD9dE0qC4i4g' },
      { id: '16', timestamp: 1505, place: '오묘한상점', address: '부산광역시 해운대구 우동1로38번가길 5', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.165009, lng: 129.158047, hasCoords: true, googlePlaceId: 'ChIJkW4lEUyNaDUR9g9cAcox8V8' },
      { id: '17', timestamp: 1578, place: '빨간떡볶이', address: '부산광역시 해운대구 우동1로20번길 74', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.165506, lng: 129.160473, hasCoords: true, googlePlaceId: 'ChIJ3clm02CNaDURDVjU4F1_oaE' },
      { id: '18', timestamp: 1738, place: '광안리 해수욕장', address: '부산광역시 수영구 광안해변로 219', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.153170, lng: 129.118666, hasCoords: true, googlePlaceId: 'ChIJxw7HJy_taDUR-xaSTeHwbf8' },
      { id: '19', timestamp: 1835, place: '이재모피자 서면별관', address: '부산광역시 부산진구 동천로 61', city: 'Busan', country: 'South Korea', countryCode: 'KR', description: '', lat: 35.155337, lng: 129.064006, hasCoords: true, googlePlaceId: 'ChIJd8wKTI3raDURxsehYr2s2DQ' }
    ]
  }

  return <ResultClient initialResult={mockResult} />
}


