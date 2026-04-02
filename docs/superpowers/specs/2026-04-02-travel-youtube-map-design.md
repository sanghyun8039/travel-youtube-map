# Travel YouTube Map — Design Spec

**Date:** 2026-04-02
**Status:** Approved

---

## Overview

YouTube 여행 영상 URL을 입력하면 AI가 영상을 분석해 방문 장소와 타임스탬프를 추출하고, 지도 위에 마커로 표시하는 웹 애플리케이션. 분석 결과를 바탕으로 여행 블로그 포스트도 자동 생성한다.

---

## Pages

| 경로 | 역할 |
|------|------|
| `/` | YouTube URL 입력 홈 |
| `/analyze` | 분석 진행 상황 (SSE 스트리밍) |
| `/result/[id]` | 결과 화면 (지도 + 타임라인 + 블로그) |

---

## Layout (결과 화면)

레이아웃 B: **좌측 패널 (400px) + 우측 지도 (나머지)**

### 좌측 패널 (위→아래)
1. **YouTube 영상 플레이어** — iframe embed, 16:9 비율 고정
2. **타임라인 리스트** — 시간순 스크롤 가능 목록, 현재 재생 위치 하이라이트
3. **블로그 생성 버튼** — 하단 고정

### 우측 지도
- Google Maps embed
- 방문 장소별 번호 마커 (빨간 핀)
- 방문 순서대로 점선 경로 표시
- 마커 클릭 시 팝업 (타임스탬프, 장소명, 설명)

---

## Analysis Pipeline

**엔드포인트:** `POST /api/analyze` — Server-Sent Events 스트림

```
Step 1: YouTube 영상 ID 추출
Step 2: youtube-transcript-api로 자막 시도 (무료, 우선)
        └ 실패 시 → yt-dlp로 오디오 다운로드 → OpenAI Whisper API STT
Step 3: ffmpeg으로 30초마다 키프레임 1장 샘플링 (시각적 장소 단서)
Step 4: Claude API — transcript 텍스트 + 키프레임 이미지 전송
        → [{timestamp, place, city, country, description}] 추출
Step 5: 결과를 서버 세션 파일(JSON)에 저장
Step 6: 클라이언트에 SSE로 실시간 진행 상황 및 결과 스트리밍
```

### 토큰 최적화 전략
- 자막이 있으면 Whisper 미사용 (비용 절감)
- 키프레임은 30초에 1장으로 제한 (전체 프레임 분석 X)
- transcript + 소수 이미지만 Claude에 전달

---

## Data Model

```ts
interface TimelineItem {
  id: string           // uuid
  timestamp: number    // seconds (e.g. 468 → "07:48")
  place: string        // 장소명 (e.g. "명동 거리")
  city: string         // 도시 (e.g. "서울")
  country: string      // 국가 (e.g. "대한민국")
  countryCode: string  // ISO 코드 (e.g. "KR") — 국기 이모지용
  description: string  // 한 줄 설명
  lat: number          // Google Geocoding API로 좌표 변환
  lng: number
}

interface AnalysisResult {
  id: string
  videoId: string
  videoTitle: string
  items: TimelineItem[]
  createdAt: string
}
```

---

## Components

### `VideoPlayer`
- YouTube IFrame API 사용
- `seekTo(seconds)` 메서드를 외부에서 호출 가능하도록 ref 노출
- 재생 위치 변화 감지 → 타임라인 현재 항목 자동 하이라이트

### `TimelineList`
- `TimelineItem[]` 렌더링, 시간순 정렬
- 아이템 클릭 → `VideoPlayer.seekTo()` + 지도 해당 마커 포커스
- **인라인 편집 폼**: 수정 버튼 클릭 시 해당 아이템 아래에 폼 열림
- **삭제 확인**: 삭제 버튼 클릭 시 인라인 확인 UI (즉시 삭제 X)
- **추가**: 리스트 하단 "+ 새 장소 추가" 버튼 → 빈 폼 → 저장 시 타임스탬프 순 자동 정렬
- 편집/삭제/추가는 클라이언트 state만 업데이트 (서버 저장 불필요)

### `MapView`
- Google Maps JavaScript API
- 번호 마커 (방문 순서)
- 마커 간 점선 Polyline (경로 시각화)
- 마커 클릭 → InfoWindow 팝업 (timestamp, place, description)
- 타임라인 아이템 선택 시 해당 마커 확대 포커스

### `BlogGenerator`
- 타임라인 JSON을 `POST /api/blog`로 전송
- 결과를 SSE로 스트리밍 수신해 화면에 실시간 출력
- 생성된 블로그는 복사 버튼 제공

---

## API Routes

### `POST /api/analyze`
- Body: `{ url: string }`
- Response: SSE stream
  ```
  data: {"step": "transcript", "status": "fetching"}
  data: {"step": "transcript", "status": "done"}
  data: {"step": "keyframes", "status": "sampling", "count": 12}
  data: {"step": "llm", "status": "analyzing"}
  data: {"step": "done", "result": AnalysisResult}
  ```

### `POST /api/blog`
- Body: `{ items: TimelineItem[], videoTitle: string }`
- Response: SSE stream (마크다운 블로그 텍스트 청크 스트리밍)

---

## Tech Stack

| 레이어 | 선택 |
|--------|------|
| Framework | Next.js 14 (App Router) |
| 지도 | Google Maps JavaScript API |
| 영상 분석 | youtube-transcript-api → Whisper API (fallback) |
| 키프레임 | yt-dlp + ffmpeg |
| LLM | Claude API (claude-sonnet-4-6) |
| 좌표 변환 | Google Geocoding API |
| Styling | Tailwind CSS |
| State | React useState (클라이언트 전용) |

---

## Error Handling

| 상황 | 처리 |
|------|------|
| 자막 없음 | Whisper fallback 자동 전환, UI에 "음성 분석 중" 표시 |
| 비공개/삭제 영상 | 에러 메시지 표시, URL 재입력 유도 |
| 장소 좌표 변환 실패 | 해당 아이템은 지도 마커 미표시, 리스트엔 표시 |
| LLM 장소 추출 오류 | 수동 편집 기능으로 보정 가능 |
| API 키 미설정 | 서버 시작 시 환경변수 검증, 명확한 에러 메시지 |

---

## Out of Scope (MVP)

- 사용자 인증 / 로그인
- 분석 결과 DB 저장 (세션 파일만 사용)
- 여러 영상 누적 비교
- 채널 단위 관리
