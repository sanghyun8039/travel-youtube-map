# Travel YouTube Map

YouTube 여행 영상을 분석하여 방문 장소를 자동으로 추출하고, 인터랙티브 지도와 타임라인으로 시각화하는 Next.js 앱입니다.

## 주요 기능

- **자동 장소 추출** — YouTube URL 입력 → Claude AI가 자막/음성에서 방문 장소 파싱
- **인터랙티브 지도** — 방문 순서 번호 마커, 경로 폴리라인, 마커 클릭으로 영상 해당 시점으로 이동
- **타임라인 편집** — 장소 추가/수정/삭제, 주소 검색으로 지오코딩 자동 완성
- **리사이즈 패널** — 타임라인과 지도 영역 너비 드래그 조절
- **블로그 생성** — 분석된 여행 정보를 네이버 블로그 형식으로 자동 작성 (Claude Streaming)

## 기술 스택

- **Frontend:** Next.js 14 App Router + TypeScript + Tailwind CSS
- **지도:** Google Maps JavaScript API (`@vis.gl/react-google-maps`)
- **AI:** Claude API (`claude-3-5-sonnet`) — 장소 추출 + 블로그 생성
- **STT:** YouTube 자막 우선, fallback으로 OpenAI Whisper
- **미디어:** yt-dlp + ffmpeg (키프레임/오디오 추출)
- **지오코딩:** Google Geocoding API

## 시작하기

### 환경 변수 설정

`.env.local` 파일을 생성하고 아래 값을 입력하세요:

```env
ANTHROPIC_API_KEY=your-anthropic-api-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
OPENAI_API_KEY=your-openai-api-key
```

### 의존성 설치 및 실행

```bash
npm install
npm run dev
```

`http://localhost:3000`에서 앱을 확인하세요.

### 시스템 의존성

```bash
# macOS
brew install yt-dlp ffmpeg
```

## 테스트

```bash
npx jest
```

## 프로젝트 구조

```
app/
  api/analyze/    SSE 스트리밍 분석 파이프라인
  api/blog/       블로그 생성 SSE 엔드포인트
  result/[id]/    분석 결과 페이지 (지도 + 타임라인)
components/
  MapView.tsx     Google Maps 인터랙티브 지도
  TimelineList    타임라인 목록 + 편집 폼
lib/
  geocoder.ts     Google Geocoding API 래퍼
  keyframes.ts    ffmpeg 키프레임 추출
  whisper.ts      OpenAI Whisper STT
```
