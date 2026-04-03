import ResultClient from '../[id]/ResultClient'
import { AnalysisResult } from '@/lib/types'

export default function MockResultPage() {
  const mockResult: AnalysisResult = {
    id: 'mock-macau-full-vlog',
    videoId: '4FPa5Kgz04o',
    videoTitle: '마카오의 모든 것: 럭셔리 호텔부터 역사지구 맛집 탐방까지 🇲🇴',
    createdAt: new Date().toISOString(),
    items: [
      {
        id: '1',
        timestamp: 1,
        place: '인천국제공항',
        address: '272 Gonghang-ro, Jung-gu, Incheon, South Korea',
        city: '인천',
        country: '대한민국',
        countryCode: 'KR',
        description: '설레는 여행의 시작, 인천국제공항.',
        lat: 37.460,
        lng: 126.440,
        hasCoords: true
      },
      {
        id: '2',
        timestamp: 134,
        place: '마카오 국제공항',
        address: 'Macau International Airport, Macau',
        city: 'Macau',
        country: 'China',
        countryCode: 'MO',
        description: '드디어 도착한 화려한 도시 마카오.',
        lat: 22.150,
        lng: 113.585,
        hasCoords: true
      },
      {
        id: '3',
        timestamp: 321,
        place: '스튜디오 시티',
        address: 'Studio City, Estr. do Istmo, Macau',
        city: 'Macau',
        country: 'China',
        countryCode: 'MO',
        description: '8자 모양 관람차가 상징인 엔터테인먼트 호텔.',
        lat: 22.140,
        lng: 113.561,
        hasCoords: true
      },
      {
        id: '4',
        timestamp: 596,
        place: '리츠칼튼 라이힌 (Lai Heen)',
        address: '51/F, Galaxy Macau, Estrada da Baia de Nossa Senhora da Esperanca, Macau',
        city: 'Macau',
        country: 'China',
        countryCode: 'MO',
        description: '미슐랭 스타를 받은 마카오 최고의 전망을 자랑하는 중식당.',
        lat: 22.148,
        lng: 113.551,
        hasCoords: true
      },
      {
        id: '5',
        timestamp: 1472,
        place: '마카오 역사지구',
        address: 'Historic Centre of Macau, Macau',
        city: 'Macau',
        country: 'China',
        countryCode: 'MO',
        description: '동서양의 문화가 공존하는 유네스코 세계문화유산.',
        lat: 22.191,
        lng: 113.538,
        hasCoords: true
      },
      {
        id: '6',
        timestamp: 1584,
        place: '세나도 광장',
        address: 'Largo do Senado, Macau',
        city: 'Macau',
        country: 'China',
        countryCode: 'MO',
        description: '물결무늬 타일 바닥이 인상적인 마카오 관광의 중심.',
        lat: 22.193,
        lng: 113.540,
        hasCoords: true
      },
      {
        id: '7',
        timestamp: 1607,
        place: '성 도미니크 성당',
        address: 'Largo de Sao Domingos, Macau',
        city: 'Macau',
        country: 'China',
        countryCode: 'MO',
        description: '노란 외벽이 아름다운 마카오에서 가장 오래된 성당 중 하나.',
        lat: 22.195,
        lng: 113.540,
        hasCoords: true
      },
      {
        id: '8',
        timestamp: 2000,
        place: '바무 베이커리 (Bamu Bakery)',
        address: 'Rua de S. Domingos, Macau',
        city: 'Macau',
        country: 'China',
        countryCode: 'MO',
        description: '마카오의 전통적인 베이커리.',
        lat: 22.1945,
        lng: 113.541,
        hasCoords: true
      },
      {
        id: '9',
        timestamp: 2139,
        place: "마가렛 카페 이나타 (Margaret's Café e Nata)",
        address: '17B Rua Comandante Mata e Oliveira, Macau',
        city: 'Macau',
        country: 'China',
        countryCode: 'MO',
        description: '바삭한 페이스트리의 에그타르트가 유명한 곳.',
        lat: 22.192,
        lng: 113.542,
        hasCoords: true
      },
      {
        id: '10',
        timestamp: 2242,
        place: "로드 스토우즈 베이커리 (Lord Stow's Bakery)",
        address: '1 Rua do Tassara, Coloane, Macau',
        city: 'Macau',
        country: 'China',
        countryCode: 'MO',
        description: '마카오 에그타르트의 원조라고 불리는 베이커리.',
        lat: 22.117,
        lng: 113.551,
        hasCoords: true
      },
      {
        id: '11',
        timestamp: 2917,
        place: '런더너 마카오 (The Londoner Macao)',
        address: 's/n Estrada do Istmo, Cotai, Macau',
        city: 'Macau',
        country: 'China',
        countryCode: 'MO',
        description: '영국 런던을 테마로 한 화려한 최신 리조트.',
        lat: 22.143,
        lng: 113.563,
        hasCoords: true
      }
    ]
  }

  return <ResultClient initialResult={mockResult} />
}


