import ResultClient from '../[id]/ResultClient'
import { AnalysisResult } from '@/lib/types'

export default function MockResultPage() {
  const mockResult: AnalysisResult = {
    id: 'mock-kaohsiung-vlog',
    videoId: 'TbC4dbv3GBs',
    videoTitle: '가오슝 여행 브이로그',
    createdAt: new Date().toISOString(),
    items: [
      {
        id: '1',
        timestamp: 157,
        place: '진코우루샤오관 (Jin Kou Lu Xiao Guan, 金口祿小館)',
        address: 'No. 83, Jiankang Rd, Lingya District, Kaohsiung City, 대만 802',
        city: '가오슝',
        country: '대만',
        countryCode: 'TW',
        description: '현지인들이 즐겨찾는 대만 가정식 맛집',
        lat: 22.6200,
        lng: 120.3000,
        hasCoords: true
      },
      {
        id: '2',
        timestamp: 258,
        place: '하이즈빙 (Hai Zhi Bing, 海之冰)',
        address: 'No. 76, Binhai 1st Rd, Gushan District, Kaohsiung City, 대만 804',
        city: '가오슝',
        country: '대만',
        countryCode: 'TW',
        description: '더위를 식혀주는 초대형 빙수 전문점',
        lat: 22.6190,
        lng: 120.2690,
        hasCoords: true
      },
      {
        id: '3',
        timestamp: 343,
        place: '보월예술특구 (The Pier-2 Art Center)',
        address: 'No. 1, Dayong Rd, Yancheng District, Kaohsiung City, 대만 803',
        city: '가오슝',
        country: '대만',
        countryCode: 'TW',
        description: '과거 창고를 개조한 힙한 복합 문화 예술 공간',
        lat: 22.6200,
        lng: 120.2810,
        hasCoords: true
      },
      {
        id: '4',
        timestamp: 593,
        place: '루이펑 야시장 (Ruifeng Night Market)',
        address: 'Yucheng Rd, Zuoying District, Kaohsiung City, 대만 804',
        city: '가오슝',
        country: '대만',
        countryCode: 'TW',
        description: '현지인들이 가장 사랑하는 활기찬 야시장',
        lat: 22.6660,
        lng: 120.3000,
        hasCoords: true
      },
      {
        id: '5',
        timestamp: 808,
        place: '항원우육면 (Gang Yuan Beef Noodle)',
        address: 'No. 55, Dacheng St, Yancheng District, Kaohsiung City, 대만 803',
        city: '가오슝',
        country: '대만',
        countryCode: 'TW',
        description: '진한 육수와 두툼한 고기가 일품인 가오슝 필수 우육면',
        lat: 22.6240,
        lng: 120.2860,
        hasCoords: true
      },
      {
        id: '6',
        timestamp: 885,
        place: '카이판 (Kaifun, 開飯川食堂)',
        address: 'No. 777, Bocheng Rd, Zuoying District, Kaohsiung City, 대만 813',
        city: '가오슝',
        country: '대만',
        countryCode: 'TW',
        description: '매콤하고 자극적인 맛이 매력적인 사천요리 전문점',
        lat: 22.6350,
        lng: 120.3000,
        hasCoords: true
      }
    ]
  }

  return <ResultClient initialResult={mockResult} />
}


