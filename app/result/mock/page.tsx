import ResultClient from "../[id]/ResultClient";
import { AnalysisResult } from "@/lib/types";

export default function MockResultPage() {
  const mockResult: AnalysisResult = {
    id: "yeongdeungpo-mullae-mock",
    videoId: "q796HT58HRg",
    videoTitle: "나혼자 영등포🍲전국1등! 건물세운 된장찌개와 부일갈비(문래 잘알의 n차 혼술 코스)",
    destCity: "서울",
    destCountry: "대한민국",
    createdAt: new Date().toISOString(),
    items: [
      {
        id: "1",
        timestamp: 48, // 00:48
        place: "또순이네 (영등포 선유도)",
        address: "서울 영등포구 선유로47길 16",
        city: "Seoul",
        country: "South Korea",
        countryCode: "KR",
        description: "건물을 세울 정도로 유명한 전국 1등 된장찌개 맛집. 주문하기도 전에 찌개가 먼저 나올 정도로 회전율이 빠름",
        lat: 37.53584,
        lng: 126.8953699,
        hasCoords: true,
      },
      {
        id: "2",
        timestamp: 172, // 02:52
        place: "양화대교 & 선유도 공원",
        address: "서울 영등포구 선유로 343",
        city: "Seoul",
        country: "South Korea",
        countryCode: "KR",
        description: "다른 한강 공원보다 운치 있고 힙한 분위기의 산책로. 봄에 오면 특히 예쁜 곳",
        lat: 37.543569,
        lng: 126.8997156,
        hasCoords: true,
      },
      {
        id: "3",
        timestamp: 393, // 06:33
        place: "코끼리 베이글 (영등포점)",
        address: "서울 영등포구 선유로 176",
        city: "Seoul",
        country: "South Korea",
        countryCode: "KR",
        description: "서울 3대 베이글 중 하나로 손꼽히는 곳. 화덕에서 구워내는 쫄깃한 식감이 특징",
        lat: 37.5293601,
        lng: 126.8934943,
        hasCoords: true,
      },
      {
        id: "4",
        timestamp: 490, // 08:10
        place: "영등포 시장",
        address: "서울 영등포구 영등포동5가",
        city: "Seoul",
        country: "South Korea",
        countryCode: "KR",
        description: "규모가 매우 크고 깨끗하게 정리된 전통시장. 다양한 디자인의 옷과 먹거리를 구경하는 재미가 있음",
        lat: 37.5210958,
        lng: 126.9067076,
        hasCoords: true,
      },
      {
        id: "5",
        timestamp: 650, // 10:50
        place: "세라젬웰카페 영등포직영점",
        address: "대한민국 서울특별시 영등포구 영등포동 영등포로 210",
        city: "Seoul",
        country: "South Korea",
        countryCode: "KR",
        description: "음료 한 잔 가격으로 안마 의자 체험이 가능한 힐링 스팟. 부모님과 함께 오거나 잠시 쉬어가기 좋음",
        lat: 37.5195414,
        lng: 126.9045041,
        hasCoords: true,
      },
      {
        id: "6",
        timestamp: 715, // 11:55
        place: "부일갈비 (영등포)",
        address: "서울 영등포구",
        city: "Seoul",
        country: "South Korea",
        countryCode: "KR",
        description: "영등포에서 가장 유명한 갈비 노포 중 하나. 사장님이 매우 친절하며 고기를 직접 구워주심",
        lat: 37.5181476,
        lng: 126.9086483,
        hasCoords: true,
      },
      {
        id: "7",
        timestamp: 888, // 14:48
        place: "미아리호떡",
        address: "대한민국 서울특별시 영등포구 경인로 803-3",
        city: "Seoul",
        country: "South Korea",
        countryCode: "KR",
        description: "줄 서서 먹는 웨이팅 호떡집. 피가 얇고 바삭하여 배불러도 계속 들어가는 맛",
        lat: 37.5150774,
        lng: 126.9023365,
        hasCoords: true,
      },
      {
        id: "8",
        timestamp: 986, // 16:26
        place: "문래 창작촌 & 올드 문래",
        address: "서울 영등포구 문래동",
        city: "Seoul",
        country: "South Korea",
        countryCode: "KR",
        description: "철공소 골목 사이사이 힙한 가게들이 숨어 있는 문래동 핵심 거리. 분위기 좋은 카페와 펍이 많음",
        lat: 37.5149363,
        lng: 126.8947342,
        hasCoords: true,
      },
      {
        id: "9",
        timestamp: 1036, // 17:16
        place: "아도 티 하우스",
        address: "대한민국 서울특별시 영등포구 문래동2가 17-1 아도 티하우스 1층",
        city: "Seoul",
        country: "South Korea",
        countryCode: "KR",
        description: "",
        lat: 37.5131123,
        lng: 126.8948566,
        hasCoords: true,
      },
      {
        id: "10",
        timestamp: 1107, // 18:27
        place: "평화",
        address: "대한민국 서울특별시 영등포구 도림로131길 13 1층",
        city: "Seoul",
        country: "South Korea",
        countryCode: "KR",
        description: "",
        lat: 37.5137303,
        lng: 126.8943279,
        hasCoords: true,
      },
      {
        id: "11",
        timestamp: 1169, // 19:29
        place: "신흥상회",
        address: "대한민국 서울특별시 영등포구 문래동 54-34",
        city: "Seoul",
        country: "South Korea",
        countryCode: "KR",
        description: "늦은 밤에도 단골 손님들로 북적이는 분위기 좋은 술집. 라면과 소주 반 병 조합으로 가볍게 마무리하기 좋음",
        lat: 37.5138459,
        lng: 126.8962754,
        hasCoords: true,
      },
      {
        id: "12",
        timestamp: 1187, // 19:47
        place: "로라멘",
        address: "대한민국 서울특별시 영등포구 도림로131길 17",
        city: "Seoul",
        country: "South Korea",
        countryCode: "KR",
        description: "",
        lat: 37.5139814,
        lng: 126.8937663,
        hasCoords: true,
      },
    ],
  };

  return <ResultClient initialResult={mockResult} />;
}
