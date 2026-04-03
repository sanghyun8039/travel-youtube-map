import ResultClient from '../[id]/ResultClient'
import { AnalysisResult } from '@/lib/types'

export default function MockResultPage() {
  const mockResult: AnalysisResult = {
    id: 'mock-jamsil-vlog',
    videoId: '5Di_NdGvKG0',
    videoTitle: '[VLOG] 잠실의 모든 것: 롯데타워부터 방이시장, 한강공원까지 🏙️',
    createdAt: new Date().toISOString(),
    items: [
      {
        id: '1',
        timestamp: 16,
        place: '롯데백화점 잠실점',
        address: '서울특별시 송파구 올림픽로 240',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '잠실역 바로 앞에 위치한 쇼핑의 중심지.',
        lat: 37.5113,
        lng: 127.0980,
        hasCoords: true
      },
      {
        id: '2',
        timestamp: 20,
        place: '롯데월드몰',
        address: '서울특별시 송파구 올림픽로 300',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '다양한 브랜드와 맛집이 모여 있는 대형 복합 쇼핑몰.',
        lat: 37.5137,
        lng: 127.1044,
        hasCoords: true
      },
      {
        id: '3',
        timestamp: 30,
        place: '장미상가',
        address: '서울특별시 송파구 올림픽로35길 124',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '잠실의 노포 맛집들이 숨어 있는 유서 깊은 상가.',
        lat: 37.5173,
        lng: 127.1017,
        hasCoords: true
      },
      {
        id: '4',
        timestamp: 92,
        place: '리사르커피 잠실',
        address: '서울특별시 송파구 송파대로 567',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '에스프레소 바의 정석, 잠실에서 즐기는 이탈리안 커피.',
        lat: 37.5144,
        lng: 127.0933,
        hasCoords: true
      },
      {
        id: '5',
        timestamp: 162,
        place: '뽀빠이분식',
        address: '서울특별시 송파구 올림픽로35길 124 장미종합상가 B동 지하1층',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '장미상가 내 위치한 추억의 짜장 떡볶이 맛집.',
        lat: 37.5173,
        lng: 127.1017,
        hasCoords: true
      },
      {
        id: '6',
        timestamp: 383,
        place: '석촌호수',
        address: '서울특별시 송파구 잠실로 148',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '롯데타워를 바라보며 산책하기 좋은 잠실의 랜드마크.',
        lat: 37.5090,
        lng: 127.1010,
        hasCoords: true
      },
      {
        id: '7',
        timestamp: 426,
        place: '콘플릭트스토어 커피',
        address: '서울특별시 송파구 신천동 7-18',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '다양한 원두 라인업을 갖춘 전문적인 커피 바.',
        lat: 37.5113,
        lng: 127.1086,
        hasCoords: true
      },
      {
        id: '8',
        timestamp: 484,
        place: '태양곱창',
        address: '서울특별시 송파구 방이동 103-12',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '잠실 근처에서 소문난 곱창 전문점.',
        lat: 37.5126,
        lng: 127.1147,
        hasCoords: true
      },
      {
        id: '9',
        timestamp: 688,
        place: '송리단길',
        address: '서울특별시 송파구 송파1동 백제고분로45길',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '개성 넘치는 카페와 식당들이 가득한 핫플레이스.',
        lat: 37.5085,
        lng: 127.1080,
        hasCoords: true
      },
      {
        id: '10',
        timestamp: 695,
        place: '르빵',
        address: '서울특별시 송파구 백제고분로41길 12',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '밤식빵과 딸기 케이크가 유명한 베이커리 맛집.',
        lat: 37.5100,
        lng: 127.1100,
        hasCoords: true
      },
      {
        id: '11',
        timestamp: 856,
        place: 'GLAS',
        address: '서울특별시 송파구 송파동 15-7',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '감각적인 분위기의 와인 바 또는 카페.',
        lat: 37.5080,
        lng: 127.1070,
        hasCoords: true
      },
      {
        id: '12',
        timestamp: 935,
        place: '방이전통시장',
        address: '서울특별시 송파구 방이동 146',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '풍성한 먹거리와 활기가 넘치는 전통 시장.',
        lat: 37.5105,
        lng: 127.1150,
        hasCoords: true
      },
      {
        id: '13',
        timestamp: 1008,
        place: '아리꿀꿀 찹쌀꽈배기',
        address: '서울특별시 송파구 방이동 146-2',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '방이시장에서 꼭 먹어야 할 쫄깃한 꽈배기.',
        lat: 37.5106,
        lng: 127.1151,
        hasCoords: true
      },
      {
        id: '14',
        timestamp: 1270,
        place: '잠실한강공원',
        address: '서울특별시 송파구 한가람로 65',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '시원한 강바람을 맞으며 휴식할 수 있는 도심 속 쉼터.',
        lat: 37.5210,
        lng: 127.0860,
        hasCoords: true
      },
      {
        id: '15',
        timestamp: 1350,
        place: '잠실대교',
        address: '서울특별시 송파구 신천동 1 잠실대교',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '한강의 야경을 감상하며 걷기 좋은 다리.',
        lat: 37.5250,
        lng: 127.0950,
        hasCoords: true
      },
      {
        id: '16',
        timestamp: 1370,
        place: 'CU 한강르네상스 잠실1호점',
        address: '서울특별시 송파구 잠실동 1-1',
        city: '서울',
        country: '대한민국',
        countryCode: 'KR',
        description: '한강에서 즐기는 라면 한 그릇의 행복.',
        lat: 37.5212,
        lng: 127.0865,
        hasCoords: true
      }
    ]
  }

  return <ResultClient initialResult={mockResult} />
}
