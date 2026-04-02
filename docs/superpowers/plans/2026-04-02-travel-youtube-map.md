# Travel YouTube Map — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** YouTube 여행 영상 URL을 입력하면 방문 장소를 AI로 추출해 지도에 마커로 표시하고, 타임라인 클릭 시 영상이 해당 시점으로 이동하며, 여행 블로그를 자동 생성하는 Next.js 웹 앱을 만든다.

**Architecture:** Next.js 14 App Router 기반. 영상 분석은 `/api/analyze` SSE 엔드포인트에서 단계별 스트리밍 처리 (transcript → Whisper fallback → 키프레임 → Claude 추출 → Geocoding). 결과 화면은 좌측 패널(YouTube 플레이어 + 타임라인 리스트)과 우측 Google Maps로 구성. 세션은 `/tmp` 파일 시스템에 JSON으로 저장.

**Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, `youtube-transcript`, `openai` (Whisper), `@anthropic-ai/sdk`, `fluent-ffmpeg`, `@vis.gl/react-google-maps`, `uuid`, Jest, @testing-library/react

---

## 시스템 사전 요구사항

```bash
# macOS
brew install ffmpeg yt-dlp
```

필요한 환경변수 (`.env.local`):
- `ANTHROPIC_API_KEY` — Claude API
- `OPENAI_API_KEY` — Whisper STT fallback
- `GOOGLE_MAPS_API_KEY` — Maps JavaScript API + Geocoding API (Google Cloud Console에서 두 API 모두 활성화 필요)

---

## File Structure

```
travel-youtube-map/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                        # 홈 — URL 입력
│   ├── analyze/page.tsx                # 분석 진행 화면
│   ├── result/[id]/page.tsx            # 결과 화면 (서버 컴포넌트, 세션 로드)
│   ├── result/[id]/ResultClient.tsx   # 결과 화면 클라이언트 컴포넌트
│   └── api/
│       ├── analyze/route.ts            # POST — SSE 분석 엔드포인트
│       └── blog/route.ts               # POST — SSE 블로그 생성
├── components/
│   ├── VideoPlayer.tsx                 # YouTube IFrame API, seekTo ref
│   ├── TimelineList.tsx                # 리스트 + 편집 state 관리
│   ├── TimelineItemRow.tsx             # 개별 행 (수정/삭제 버튼)
│   ├── TimelineEditForm.tsx            # 인라인 수정/추가 폼
│   ├── MapView.tsx                     # Google Maps + 마커 + Polyline
│   └── BlogGenerator.tsx               # 블로그 생성 버튼 + 스트리밍 출력
├── lib/
│   ├── types.ts
│   ├── format.ts                       # formatTimestamp, getFlagEmoji
│   ├── session.ts                      # JSON 파일 기반 세션
│   ├── youtube.ts                      # extractVideoId, fetchTranscript
│   ├── whisper.ts                      # downloadAudio (yt-dlp), transcribeWithWhisper
│   ├── keyframes.ts                    # extractKeyframes (ffmpeg)
│   ├── extractor.ts                    # extractLocations (Claude API)
│   └── geocoder.ts                     # geocodePlace (Google Geocoding API)
└── __tests__/
    ├── lib/
    │   ├── format.test.ts
    │   ├── session.test.ts
    │   ├── youtube.test.ts
    │   ├── extractor.test.ts
    │   └── geocoder.test.ts
    └── components/
        ├── TimelineList.test.tsx
        └── TimelineEditForm.test.tsx
```

---

## 디자인 토큰 (Design System)

**/design-review에서 추가됨 — Tailwind `tailwind.config.ts`에 반영**

브레인스토밍에서 확정된 다크 테마 기준:

```ts
// tailwind.config.ts colors 확장
colors: {
  surface: {
    base:    '#0f0f0f',  // 최하단 배경
    panel:   '#141414',  // 좌측 패널
    card:    '#1a1a1a',  // 카드/섹션
    hover:   '#1e1e1e',  // 호버 상태
    input:   '#2a2a2a',  // 입력 필드
    border:  '#2a2a2a',  // 구분선
  },
  accent: {
    red:     '#ef4444',  // 주요 액션, 마커, 활성 타임라인
    orange:  '#f97316',  // 선택된 마커
    blue:    '#1d4ed8',  // 수정 버튼
  },
  text: {
    primary:   '#e5e5e5',
    secondary: '#9ca3af',
    muted:     '#6b7280',
  }
}
```

**폰트**: Inter (Next.js 기본 로드). 타임스탬프 배지는 `font-mono`.

**카드 금지**: `TimelineList`는 카드 그리드가 아닌 **행(row) 스타일**로 구현. 배경이 있는 카드 박스 사용 금지. 구분선은 `border-b border-[#1e1e1e]`로만 처리.

**간격**: Tailwind 기본 스케일 사용. 패널 내부 패딩 `px-4 py-3`.

**브레이크포인트**: MVP는 **데스크탑 전용** (`min-width: 900px`). 모바일 접속 시 `app/layout.tsx`에서 `<meta name="viewport">`에 `minimum-scale=1`을 유지하되, 결과 화면에 "이 서비스는 데스크탑에서 이용해주세요" 안내 배너를 `md:hidden` 블록으로 추가. 반응형 레이아웃은 v2 범위.

---

## UI 상태 스펙 (State Coverage)

**/design-review에서 추가됨 — 구현 시 반드시 반영**

### 타임라인 빈 상태 (0개 장소 추출됨)
`TimelineList` — items.length === 0 일 때:
```
📍 아이콘 (크게, 흐릿하게)
방문 장소를 찾지 못했어요
영상에 장소 설명이 부족하거나 자막이 없을 수 있어요
[직접 추가하기] (빨간 버튼)  [새 영상 분석] (회색 버튼)
```

### 분석 에러 상태 (`/analyze` 페이지)
- **비공개/삭제 영상**: 빨간 테두리 카드 + "이 영상은 접근할 수 없어요" + "다른 URL 시도하기" 버튼
- **자막+Whisper 모두 실패**: 노란 경고 카드 + "음성을 인식할 수 없었어요. 직접 장소를 입력할 수 있어요" + 결과 화면으로 이동(빈 타임라인) 버튼
- **API 키 없음**: 빨간 카드 + "서버 설정 오류 — .env.local 환경변수를 확인해주세요"

### 좌표 변환 실패한 아이템
지도 마커 없이 타임라인 리스트에만 표시. 아이템 행에 `🔍 지도 없음` 배지(회색) 표시. 마커 없는 아이템도 클릭 시 VideoPlayer.seekTo는 정상 동작.

### 블로그 생성 실패
"블로그 생성에 실패했어요" + 재시도 버튼. 빈 컨텐츠 영역 유지 (레이아웃 깨지지 않게).

### 키프레임 추출 실패 (분석 진행 중)
분석 진행 화면에서 `⚠️ 키프레임 없이 계속 진행합니다` 노란 인라인 경고 후 다음 단계 자동 진행. 사용자가 취소할 필요 없음.

---

## Task 1: 프로젝트 초기화

**Files:**
- Create: `package.json`, `next.config.ts`, `tailwind.config.ts`, `jest.config.ts`, `jest.setup.ts`, `.env.local.example`

- [ ] **Step 1: Next.js 프로젝트 생성**

```bash
cd /Users/research/travel-youtube-map
npx create-next-app@14 . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```

- [ ] **Step 2: 추가 의존성 설치**

```bash
npm install youtube-transcript openai @anthropic-ai/sdk fluent-ffmpeg @vis.gl/react-google-maps uuid
npm install --save-dev @types/fluent-ffmpeg @types/uuid @types/google.maps jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom ts-jest
```

- [ ] **Step 3: Jest 설정**

`jest.config.ts`:
```ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/$1' },
  testPathPattern: '__tests__',
}

export default createJestConfig(config)
```

`jest.setup.ts`:
```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: 환경변수 예시 파일 생성**

`.env.local.example`:
```
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...
GOOGLE_MAPS_API_KEY=AIza...
```

- [ ] **Step 5: `.env.local` 파일 생성 (실제 키 입력)**

```bash
cp .env.local.example .env.local
# 편집기로 .env.local 열어 실제 API 키 입력
```

- [ ] **Step 6: next.config.ts 업데이트 (외부 이미지 도메인 허용)**

`next.config.ts`:
```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ hostname: 'i.ytimg.com' }],
  },
}

export default nextConfig
```

- [ ] **Step 7: 빌드 확인**

```bash
npm run build
```
Expected: `✓ Compiled successfully`

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: initialize Next.js project with dependencies"
```

---

## Task 2: 공유 타입 정의

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: 타입 파일 작성**

`lib/types.ts`:
```ts
export interface TimelineItem {
  id: string           // uuid v4
  timestamp: number    // seconds (예: 468 → "07:48")
  place: string        // 장소명 (예: "명동 거리")
  city: string         // 도시 (예: "서울")
  country: string      // 국가 (예: "대한민국")
  countryCode: string  // ISO 2-letter code (예: "KR")
  description: string  // 한 줄 설명
  lat: number
  lng: number
  hasCoords: boolean   // false이면 geocoding 실패 → 지도 마커 미표시
}

export interface AnalysisResult {
  id: string
  videoId: string
  videoTitle: string
  items: TimelineItem[]
  createdAt: string    // ISO 8601
}

export type SSEStep = 'transcript' | 'whisper' | 'keyframes' | 'llm' | 'geocoding' | 'done' | 'error'

export interface SSEEvent {
  step: SSEStep
  status: string       // 'fetching' | 'done' | 'failed' | 'analyzing' | ...
  message?: string
  count?: number       // keyframes 수 등
  result?: AnalysisResult
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: 포맷 유틸리티

**Files:**
- Create: `lib/format.ts`, `__tests__/lib/format.test.ts`

- [ ] **Step 1: 테스트 작성**

`__tests__/lib/format.test.ts`:
```ts
import { formatTimestamp, getFlagEmoji } from '@/lib/format'

describe('formatTimestamp', () => {
  it('converts seconds to MM:SS', () => {
    expect(formatTimestamp(0)).toBe('00:00')
    expect(formatTimestamp(90)).toBe('01:30')
    expect(formatTimestamp(468)).toBe('07:48')
  })

  it('handles hours as HH:MM:SS', () => {
    expect(formatTimestamp(3661)).toBe('01:01:01')
    expect(formatTimestamp(7200)).toBe('02:00:00')
  })
})

describe('getFlagEmoji', () => {
  it('converts ISO country code to flag emoji', () => {
    expect(getFlagEmoji('KR')).toBe('🇰🇷')
    expect(getFlagEmoji('JP')).toBe('🇯🇵')
    expect(getFlagEmoji('US')).toBe('🇺🇸')
  })

  it('returns empty string for invalid code', () => {
    expect(getFlagEmoji('')).toBe('')
    expect(getFlagEmoji('XX')).toBe('🇽🇽')
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/lib/format.test.ts
```
Expected: FAIL (format 모듈 없음)

- [ ] **Step 3: 구현**

`lib/format.ts`:
```ts
export function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  if (h > 0) return `${String(h).padStart(2, '0')}:${mm}:${ss}`
  return `${mm}:${ss}`
}

export function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return ''
  const codePoints = [...countryCode.toUpperCase()].map(
    (c) => 0x1f1e6 - 65 + c.charCodeAt(0)
  )
  return String.fromCodePoint(...codePoints)
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/lib/format.test.ts
```
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/format.ts __tests__/lib/format.test.ts
git commit -m "feat: add formatTimestamp and getFlagEmoji utilities"
```

---

## Task 4: 세션 저장소

**Files:**
- Create: `lib/session.ts`, `__tests__/lib/session.test.ts`

- [ ] **Step 1: 테스트 작성**

`__tests__/lib/session.test.ts`:
```ts
import { saveSession, loadSession } from '@/lib/session'
import type { AnalysisResult } from '@/lib/types'
import fs from 'fs'

const mockResult: AnalysisResult = {
  id: 'test-id-123',
  videoId: 'abc123',
  videoTitle: '서울 여행 브이로그',
  items: [],
  createdAt: new Date().toISOString(),
}

afterEach(() => {
  const path = `/tmp/travel-map-sessions/test-id-123.json`
  if (fs.existsSync(path)) fs.unlinkSync(path)
})

describe('session', () => {
  it('saves and loads a result', async () => {
    await saveSession(mockResult)
    const loaded = await loadSession('test-id-123')
    expect(loaded).toEqual(mockResult)
  })

  it('returns null for missing session', async () => {
    const loaded = await loadSession('nonexistent')
    expect(loaded).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/lib/session.test.ts
```
Expected: FAIL

- [ ] **Step 3: 구현**

`lib/session.ts`:
```ts
import fs from 'fs/promises'
import path from 'path'
import type { AnalysisResult } from './types'

const SESSION_DIR = '/tmp/travel-map-sessions'

async function ensureDir() {
  await fs.mkdir(SESSION_DIR, { recursive: true })
}

export async function saveSession(result: AnalysisResult): Promise<void> {
  await ensureDir()
  const filePath = path.join(SESSION_DIR, `${result.id}.json`)
  await fs.writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8')
}

export async function loadSession(id: string): Promise<AnalysisResult | null> {
  const filePath = path.join(SESSION_DIR, `${id}.json`)
  try {
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data) as AnalysisResult
  } catch {
    return null
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/lib/session.test.ts
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/session.ts __tests__/lib/session.test.ts
git commit -m "feat: add file-based session storage"
```

---

## Task 5: YouTube 유틸리티

**Files:**
- Create: `lib/youtube.ts`, `__tests__/lib/youtube.test.ts`

- [ ] **Step 1: 테스트 작성**

`__tests__/lib/youtube.test.ts`:
```ts
import { extractVideoId, fetchTranscript } from '@/lib/youtube'
import { YoutubeTranscript } from 'youtube-transcript'

jest.mock('youtube-transcript')

describe('extractVideoId', () => {
  it('extracts ID from standard watch URL', () => {
    expect(extractVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from youtu.be short URL', () => {
    expect(extractVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('extracts ID from shorts URL', () => {
    expect(extractVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
  })

  it('returns null for invalid URL', () => {
    expect(extractVideoId('https://vimeo.com/123')).toBeNull()
  })
})

describe('fetchTranscript', () => {
  it('returns formatted transcript on success', async () => {
    ;(YoutubeTranscript.fetchTranscript as jest.Mock).mockResolvedValue([
      { text: '안녕하세요', offset: 5000, duration: 2000 },
      { text: '서울에 왔습니다', offset: 30000, duration: 3000 },
    ])
    const result = await fetchTranscript('abc123')
    expect(result).toContain('00:05')
    expect(result).toContain('안녕하세요')
    expect(result).toContain('00:30')
  })

  it('returns null on failure', async () => {
    ;(YoutubeTranscript.fetchTranscript as jest.Mock).mockRejectedValue(new Error('No transcript'))
    const result = await fetchTranscript('abc123')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/lib/youtube.test.ts
```
Expected: FAIL

- [ ] **Step 3: 구현**

`lib/youtube.ts`:
```ts
import { YoutubeTranscript } from 'youtube-transcript'
import { formatTimestamp } from './format'

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}

export async function fetchTranscript(videoId: string): Promise<string | null> {
  try {
    const items = await YoutubeTranscript.fetchTranscript(videoId)
    return items
      .map((t) => `[${formatTimestamp(Math.floor(t.offset / 1000))}] ${t.text}`)
      .join('\n')
  } catch {
    return null
  }
}

export async function fetchVideoTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://youtu.be/${videoId}&format=json`
    )
    const data = await res.json()
    return data.title as string
  } catch {
    return `YouTube Video ${videoId}`
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/lib/youtube.test.ts
```
Expected: PASS (6 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/youtube.ts __tests__/lib/youtube.test.ts
git commit -m "feat: add YouTube video ID extraction and transcript fetching"
```

---

## Task 6: Whisper STT Fallback

**Files:**
- Create: `lib/whisper.ts`

- [ ] **Step 1: 구현**

`lib/whisper.ts`:
```ts
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import OpenAI from 'openai'
import { formatTimestamp } from './format'

const execAsync = promisify(exec)
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function downloadAudio(videoId: string): Promise<string> {
  const outputPath = `/tmp/travel-map-audio-${videoId}.mp3`
  await execAsync(
    `yt-dlp -f 'bestaudio[ext=m4a]/bestaudio' --extract-audio --audio-format mp3 -o "${outputPath}" https://youtu.be/${videoId}`
  )
  return outputPath
}

export async function transcribeWithWhisper(audioPath: string): Promise<string> {
  const fileBuffer = await fs.readFile(audioPath)
  const blob = new Blob([fileBuffer], { type: 'audio/mpeg' })
  const file = new File([blob], path.basename(audioPath), { type: 'audio/mpeg' })

  const transcription = await openai.audio.transcriptions.create({
    file,
    model: 'whisper-1',
    response_format: 'verbose_json',
    timestamp_granularities: ['segment'],
  })

  return transcription.segments
    ?.map((s) => `[${formatTimestamp(Math.floor(s.start))}] ${s.text.trim()}`)
    .join('\n') ?? transcription.text
}

export async function cleanupAudio(audioPath: string): Promise<void> {
  try {
    await fs.unlink(audioPath)
  } catch {
    // 파일이 이미 없으면 무시
  }
}
```

- [ ] **Step 2: 빌드 타입 체크**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 3: Commit**

```bash
git add lib/whisper.ts
git commit -m "feat: add Whisper STT fallback for videos without transcripts"
```

---

## Task 7: 키프레임 추출

**Files:**
- Create: `lib/keyframes.ts`

- [ ] **Step 1: 구현**

`lib/keyframes.ts`:
```ts
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)
const MAX_FRAMES = 40  // 최대 40장 (약 20분 분량)

export async function extractKeyframes(videoId: string): Promise<string[]> {
  const outDir = `/tmp/travel-map-frames-${videoId}`
  await fs.mkdir(outDir, { recursive: true })

  // yt-dlp로 최저화질 스트림 URL 획득
  const { stdout } = await execAsync(
    `yt-dlp -f 'worst[ext=mp4]/worst' -g https://youtu.be/${videoId}`
  )
  const streamUrl = stdout.trim().split('\n')[0]

  // ffmpeg: 30초마다 1프레임, 최대 20분
  await execAsync(
    `ffmpeg -i "${streamUrl}" -t 1200 -vf "fps=1/30" -q:v 5 -frames:v ${MAX_FRAMES} "${outDir}/frame%03d.jpg" -y`
  )

  const files = await fs.readdir(outDir)
  const jpgFiles = files.filter((f) => f.endsWith('.jpg')).sort()

  const base64Frames: string[] = []
  for (const file of jpgFiles) {
    const buffer = await fs.readFile(path.join(outDir, file))
    base64Frames.push(buffer.toString('base64'))
  }

  // 임시 파일 정리
  await fs.rm(outDir, { recursive: true, force: true })

  return base64Frames
}
```

- [ ] **Step 2: 빌드 타입 체크**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 3: Commit**

```bash
git add lib/keyframes.ts
git commit -m "feat: add ffmpeg keyframe extraction (1 frame per 30s)"
```

---

## Task 7b: Whisper + Keyframes 유닛 테스트

**/plan-eng-review에서 추가됨 — 고위험 shell exec 모듈 커버리지**

**Files:**
- Create: `__tests__/lib/whisper.test.ts`, `__tests__/lib/keyframes.test.ts`

- [ ] **Step 1: whisper.ts 테스트 작성**

`__tests__/lib/whisper.test.ts`:
```ts
import { downloadAudio, transcribeWithWhisper, cleanupAudio } from '@/lib/whisper'
import * as child_process from 'child_process'
import * as fs from 'fs/promises'

jest.mock('child_process', () => ({ exec: jest.fn() }))
jest.mock('fs/promises')
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => ({
    audio: {
      transcriptions: {
        create: jest.fn().mockResolvedValue({
          segments: [
            { start: 5.0, text: '안녕하세요' },
            { start: 32.0, text: '서울입니다' },
          ],
          text: '안녕하세요 서울입니다',
        }),
      },
    },
  })),
}))

const { promisify } = jest.requireActual('util')

describe('downloadAudio', () => {
  it('calls yt-dlp and returns output path', async () => {
    const execMock = child_process.exec as jest.Mock
    execMock.mockImplementation((_cmd: string, cb: Function) => cb(null, '', ''))

    const path = await downloadAudio('abc123')
    expect(path).toBe('/tmp/travel-map-audio-abc123.mp3')
    expect(execMock).toHaveBeenCalledWith(
      expect.stringContaining('yt-dlp'),
      expect.any(Function)
    )
  })

  it('throws on exec failure', async () => {
    const execMock = child_process.exec as jest.Mock
    execMock.mockImplementation((_cmd: string, cb: Function) => cb(new Error('yt-dlp not found'), '', ''))
    await expect(downloadAudio('abc123')).rejects.toThrow('yt-dlp not found')
  })
})

describe('transcribeWithWhisper', () => {
  it('returns formatted transcript with timestamps', async () => {
    ;(fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('fake-audio'))
    const result = await transcribeWithWhisper('/tmp/test.mp3')
    expect(result).toContain('00:05')
    expect(result).toContain('안녕하세요')
    expect(result).toContain('00:32')
  })
})

describe('cleanupAudio', () => {
  it('deletes the file silently', async () => {
    ;(fs.unlink as jest.Mock).mockResolvedValue(undefined)
    await expect(cleanupAudio('/tmp/test.mp3')).resolves.not.toThrow()
  })

  it('ignores ENOENT if file is already gone', async () => {
    ;(fs.unlink as jest.Mock).mockRejectedValue(Object.assign(new Error(), { code: 'ENOENT' }))
    await expect(cleanupAudio('/tmp/test.mp3')).resolves.not.toThrow()
  })
})
```

- [ ] **Step 2: keyframes.ts 테스트 작성**

`__tests__/lib/keyframes.test.ts`:
```ts
import { extractKeyframes } from '@/lib/keyframes'
import * as child_process from 'child_process'
import * as fs from 'fs/promises'

jest.mock('child_process', () => ({ exec: jest.fn() }))
jest.mock('fs/promises')

describe('extractKeyframes', () => {
  it('returns base64 frames from extracted jpegs', async () => {
    const execMock = child_process.exec as jest.Mock
    // yt-dlp returns stream URL
    execMock.mockImplementationOnce((_cmd: string, cb: Function) => cb(null, 'https://stream.url/video.mp4\n', ''))
    // ffmpeg succeeds
    execMock.mockImplementationOnce((_cmd: string, cb: Function) => cb(null, '', ''))

    ;(fs.mkdir as jest.Mock).mockResolvedValue(undefined)
    ;(fs.readdir as jest.Mock).mockResolvedValue(['frame001.jpg', 'frame002.jpg'])
    ;(fs.readFile as jest.Mock).mockResolvedValue(Buffer.from('fake-image-data'))
    ;(fs.rm as jest.Mock).mockResolvedValue(undefined)

    const frames = await extractKeyframes('abc123')
    expect(frames).toHaveLength(2)
    expect(typeof frames[0]).toBe('string')  // base64
  })

  it('throws on yt-dlp failure', async () => {
    const execMock = child_process.exec as jest.Mock
    execMock.mockImplementationOnce((_cmd: string, cb: Function) => cb(new Error('yt-dlp failed'), '', ''))
    ;(fs.mkdir as jest.Mock).mockResolvedValue(undefined)
    await expect(extractKeyframes('abc123')).rejects.toThrow('yt-dlp failed')
  })
})
```

- [ ] **Step 3: 테스트 실행**

```bash
npx jest __tests__/lib/whisper.test.ts __tests__/lib/keyframes.test.ts
```
Expected: PASS (6 tests)

- [ ] **Step 4: Commit**

```bash
git add __tests__/lib/whisper.test.ts __tests__/lib/keyframes.test.ts
git commit -m "test: add unit tests for whisper and keyframe extraction"
```

---

## Task 8: Claude 장소 추출기

**Files:**
- Create: `lib/extractor.ts`, `__tests__/lib/extractor.test.ts`

- [ ] **Step 1: 테스트 작성**

`__tests__/lib/extractor.test.ts`:
```ts
import { extractLocations } from '@/lib/extractor'
import Anthropic from '@anthropic-ai/sdk'

jest.mock('@anthropic-ai/sdk')

describe('extractLocations', () => {
  it('parses Claude response into location array', async () => {
    const mockResponse = {
      content: [{
        type: 'text',
        text: JSON.stringify([
          { timestamp: 32, place: '인천국제공항', city: '인천', country: '대한민국', countryCode: 'KR', description: '제1터미널 도착' },
          { timestamp: 468, place: '명동 거리', city: '서울', country: '대한민국', countryCode: 'KR', description: '길거리 음식 탐방' },
        ])
      }]
    }
    const mockCreate = jest.fn().mockResolvedValue(mockResponse)
    ;(Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
      messages: { create: mockCreate },
    } as unknown as Anthropic))

    const result = await extractLocations('테스트 자막', [])
    expect(result).toHaveLength(2)
    expect(result[0].place).toBe('인천국제공항')
    expect(result[0].timestamp).toBe(32)
    expect(result[1].countryCode).toBe('KR')
  })

  it('returns empty array on JSON parse failure', async () => {
    const mockResponse = { content: [{ type: 'text', text: 'invalid json' }] }
    const mockCreate = jest.fn().mockResolvedValue(mockResponse)
    ;(Anthropic as jest.MockedClass<typeof Anthropic>).mockImplementation(() => ({
      messages: { create: mockCreate },
    } as unknown as Anthropic))

    const result = await extractLocations('테스트 자막', [])
    expect(result).toEqual([])
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/lib/extractor.test.ts
```
Expected: FAIL

- [ ] **Step 3: 구현**

`lib/extractor.ts`:
```ts
import Anthropic from '@anthropic-ai/sdk'

interface RawLocation {
  timestamp: number
  place: string
  city: string
  country: string
  countryCode: string
  description: string
}

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a travel video analyzer. Extract all visited locations from the transcript and visual frames provided.
Return ONLY a valid JSON array (no markdown, no explanation) in this format:
[{"timestamp": <seconds>, "place": "<place name>", "city": "<city>", "country": "<country in Korean>", "countryCode": "<ISO-2 code>", "description": "<one sentence in Korean>"}]
Rules:
- timestamp must be in seconds (integer)
- Only include locations clearly visited/shown in the video
- countryCode must be ISO 3166-1 alpha-2 (e.g. "KR", "JP", "US")
- description in Korean, max 30 characters
- Sort by timestamp ascending`

export async function extractLocations(
  transcript: string,
  keyframeBase64: string[]
): Promise<RawLocation[]> {
  const imageContent = keyframeBase64.slice(0, 20).map((data) => ({
    type: 'image' as const,
    source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data },
  }))

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: [
        ...imageContent,
        {
          type: 'text',
          text: `Transcript:\n${transcript.slice(0, 12000)}\n\nExtract all visited locations as JSON array.`,
        },
      ],
    }],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : ''
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) return []
    return JSON.parse(jsonMatch[0]) as RawLocation[]
  } catch {
    return []
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/lib/extractor.test.ts
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/extractor.ts __tests__/lib/extractor.test.ts
git commit -m "feat: add Claude-based location extractor"
```

---

## Task 9: Google Geocoder

**Files:**
- Create: `lib/geocoder.ts`, `__tests__/lib/geocoder.test.ts`

- [ ] **Step 1: 테스트 작성**

`__tests__/lib/geocoder.test.ts`:
```ts
import { geocodePlace } from '@/lib/geocoder'

global.fetch = jest.fn()

describe('geocodePlace', () => {
  it('returns lat/lng on success', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({
        status: 'OK',
        results: [{ geometry: { location: { lat: 37.5665, lng: 126.9780 } } }]
      })
    })
    const result = await geocodePlace('명동 거리, 서울, 대한민국')
    expect(result).toEqual({ lat: 37.5665, lng: 126.9780 })
  })

  it('returns null on geocoding failure', async () => {
    ;(fetch as jest.Mock).mockResolvedValue({
      json: () => Promise.resolve({ status: 'ZERO_RESULTS', results: [] })
    })
    const result = await geocodePlace('알 수 없는 장소 XYZ')
    expect(result).toBeNull()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/lib/geocoder.test.ts
```
Expected: FAIL

- [ ] **Step 3: 구현**

`lib/geocoder.ts`:
```ts
interface LatLng {
  lat: number
  lng: number
}

export async function geocodePlace(query: string): Promise<LatLng | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) throw new Error('GOOGLE_MAPS_API_KEY is not set')

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
  const res = await fetch(url)
  const data = await res.json()

  if (data.status !== 'OK' || !data.results?.[0]) return null
  const { lat, lng } = data.results[0].geometry.location
  return { lat, lng }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/lib/geocoder.test.ts
```
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add lib/geocoder.ts __tests__/lib/geocoder.test.ts
git commit -m "feat: add Google Geocoding API wrapper"
```

---

## Task 10: `/api/analyze` SSE 엔드포인트

**Files:**
- Create: `app/api/analyze/route.ts`

- [ ] **Step 1: 구현**

`app/api/analyze/route.ts`:
```ts
import { NextRequest } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { extractVideoId, fetchTranscript, fetchVideoTitle } from '@/lib/youtube'
import { downloadAudio, transcribeWithWhisper, cleanupAudio } from '@/lib/whisper'
import { extractKeyframes } from '@/lib/keyframes'
import { extractLocations } from '@/lib/extractor'
import { geocodePlace } from '@/lib/geocoder'
import { saveSession } from '@/lib/session'
import type { SSEEvent, AnalysisResult, TimelineItem } from '@/lib/types'

export const maxDuration = 300  // 5분 타임아웃

export async function POST(req: NextRequest) {
  const { url } = await req.json()
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }

      try {
        // 1. 영상 ID 추출
        const videoId = extractVideoId(url)
        if (!videoId) {
          send({ step: 'error', status: 'failed', message: '유효한 YouTube URL이 아닙니다.' })
          controller.close()
          return
        }

        const videoTitle = await fetchVideoTitle(videoId)

        // 2. 자막 시도
        send({ step: 'transcript', status: 'fetching' })
        let transcript = await fetchTranscript(videoId)
        send({ step: 'transcript', status: transcript ? 'done' : 'not_found' })

        // 3. Whisper fallback
        if (!transcript) {
          send({ step: 'whisper', status: 'downloading' })
          let audioPath: string | null = null
          try {
            audioPath = await downloadAudio(videoId)
            send({ step: 'whisper', status: 'transcribing' })
            transcript = await transcribeWithWhisper(audioPath)
            send({ step: 'whisper', status: 'done' })
          } finally {
            if (audioPath) await cleanupAudio(audioPath)
          }
        }

        if (!transcript) {
          send({ step: 'error', status: 'failed', message: '자막/음성을 가져올 수 없습니다.' })
          controller.close()
          return
        }

        // 4. 키프레임 추출
        send({ step: 'keyframes', status: 'sampling' })
        let keyframes: string[] = []
        try {
          keyframes = await extractKeyframes(videoId)
          send({ step: 'keyframes', status: 'done', count: keyframes.length })
        } catch {
          send({ step: 'keyframes', status: 'failed', message: '키프레임 없이 진행합니다.' })
        }

        // 5. Claude 장소 추출
        send({ step: 'llm', status: 'analyzing' })
        const rawLocations = await extractLocations(transcript, keyframes)
        send({ step: 'llm', status: 'done', count: rawLocations.length })

        // 6. 좌표 변환 (병렬 처리로 성능 최적화)
        send({ step: 'geocoding', status: 'fetching' })
        const items: TimelineItem[] = await Promise.all(
          rawLocations.map(async (loc) => {
            const coords = await geocodePlace(`${loc.place}, ${loc.city}, ${loc.country}`)
            return {
              id: uuidv4(),
              timestamp: loc.timestamp,
              place: loc.place,
              city: loc.city,
              country: loc.country,
              countryCode: loc.countryCode,
              description: loc.description,
              lat: coords?.lat ?? 0,
              lng: coords?.lng ?? 0,
              hasCoords: !!coords,
            }
          })
        )
        send({ step: 'geocoding', status: 'done' })

        // 7. 저장 및 완료
        const result: AnalysisResult = {
          id: uuidv4(),
          videoId,
          videoTitle,
          items: items.sort((a, b) => a.timestamp - b.timestamp),
          createdAt: new Date().toISOString(),
        }
        await saveSession(result)
        send({ step: 'done', status: 'complete', result })

      } catch (err) {
        send({
          step: 'error',
          status: 'failed',
          message: err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.',
        })
      } finally {
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
```

- [ ] **Step 2: 빌드 타입 체크**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 3: Commit**

```bash
git add app/api/analyze/route.ts
git commit -m "feat: add /api/analyze SSE endpoint with full analysis pipeline"
```

---

## Task 11: 홈 페이지 (URL 입력)

**Files:**
- Modify: `app/page.tsx`, `app/layout.tsx`

- [ ] **Step 1: 루트 레이아웃 설정**

`app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'TravelMap — YouTube 여행 영상 지도',
  description: 'YouTube 여행 영상을 분석해 지도에 표시합니다',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
```

- [ ] **Step 2: 홈 페이지 구현**

`app/page.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { extractVideoId } from '@/lib/youtube'

export default function HomePage() {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const id = extractVideoId(url.trim())
    if (!id) {
      setError('유효한 YouTube URL을 입력해주세요. (youtube.com/watch?v=... 또는 youtu.be/...)')
      return
    }
    router.push(`/analyze?url=${encodeURIComponent(url.trim())}`)
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-white mb-2">
          Travel<span className="text-red-500">Map</span>
        </h1>
        <p className="text-gray-400 mb-8 text-sm">
          YouTube 여행 영상 URL을 입력하면 방문 장소를 지도에 표시합니다
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 text-sm"
            required
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            영상 분석 시작
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: 개발 서버 실행 후 홈 화면 확인**

```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속 → URL 입력 폼 표시 확인

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/page.tsx
git commit -m "feat: add home page with YouTube URL input form"
```

---

## Task 12: 분석 진행 페이지

**Files:**
- Create: `app/analyze/page.tsx`

- [ ] **Step 1: 구현**

`app/analyze/page.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import type { SSEEvent } from '@/lib/types'

const STEP_LABELS: Record<string, string> = {
  transcript: '자막 추출 중',
  whisper: '음성 인식 중 (Whisper)',
  keyframes: '키프레임 샘플링 중',
  llm: 'AI 장소 분석 중',
  geocoding: '좌표 변환 중',
  done: '분석 완료',
  error: '오류 발생',
}

interface StepStatus {
  step: string
  status: string
  message?: string
  count?: number
}

export default function AnalyzePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const url = searchParams.get('url') ?? ''
  const [steps, setSteps] = useState<StepStatus[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (!url) { router.push('/'); return }

    const controller = new AbortController()

    async function startAnalysis() {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        signal: controller.signal,
      })

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n').filter((l) => l.startsWith('data: '))

        for (const line of lines) {
          const event: SSEEvent = JSON.parse(line.slice(6))
          setSteps((prev) => {
            const existing = prev.findIndex((s) => s.step === event.step)
            const entry = { step: event.step, status: event.status, message: event.message, count: event.count }
            if (existing >= 0) {
              const next = [...prev]
              next[existing] = entry
              return next
            }
            return [...prev, entry]
          })

          if (event.step === 'done' && event.result) {
            router.push(`/result/${event.result.id}`)
            return
          }
          if (event.step === 'error') {
            setError(event.message ?? '분석 중 오류가 발생했습니다.')
            return
          }
        }
      }
    }

    startAnalysis().catch((err) => {
      if (err.name !== 'AbortError') setError('서버 연결 오류가 발생했습니다.')
    })

    return () => controller.abort()
  }, [url, router])

  return (
    <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h2 className="text-white font-bold text-xl mb-6">영상 분석 중...</h2>

        <div className="space-y-3">
          {steps.map((s) => (
            <div key={s.step} className="flex items-center gap-3 text-sm">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                s.status === 'done' || s.status === 'complete' ? 'bg-green-500' :
                s.status === 'failed' ? 'bg-yellow-500' : 'bg-blue-500 animate-pulse'
              }`} />
              <span className="text-gray-300">{STEP_LABELS[s.step] ?? s.step}</span>
              {s.count !== undefined && (
                <span className="text-gray-500">({s.count}개)</span>
              )}
              {s.message && s.status === 'failed' && (
                <span className="text-yellow-400 text-xs">{s.message}</span>
              )}
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-6 bg-red-900/30 border border-red-500 rounded-lg p-4">
            <p className="text-red-400 text-sm">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-3 text-sm text-red-300 underline"
            >
              처음으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/analyze/page.tsx
git commit -m "feat: add analysis progress page with SSE streaming"
```

---

## Task 13: VideoPlayer 컴포넌트

**Files:**
- Create: `components/VideoPlayer.tsx`

- [ ] **Step 1: YouTube IFrame API 타입 선언 추가**

`components/VideoPlayer.tsx` 상단:
```tsx
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          videoId: string
          playerVars?: Record<string, number | string>
          events?: {
            onReady?: (e: { target: YTPlayer }) => void
            onStateChange?: (e: { data: number; target: YTPlayer }) => void
          }
        }
      ) => YTPlayer
      PlayerState: { PLAYING: number }
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface YTPlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void
  getCurrentTime(): number
  destroy(): void
}
```

- [ ] **Step 2: 컴포넌트 구현**

`components/VideoPlayer.tsx` (계속):
```tsx
'use client'

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react'

export interface VideoPlayerHandle {
  seekTo(seconds: number): void
}

interface Props {
  videoId: string
  onTimeUpdate?: (currentTime: number) => void
}

const VideoPlayer = forwardRef<VideoPlayerHandle, Props>(
  function VideoPlayer({ videoId, onTimeUpdate }, ref) {
    const playerRef = useRef<YTPlayer | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    useImperativeHandle(ref, () => ({
      seekTo(seconds: number) {
        playerRef.current?.seekTo(seconds, true)
      }
    }))

    useEffect(() => {
      function createPlayer() {
        playerRef.current = new window.YT.Player('yt-player', {
          videoId,
          playerVars: { rel: 0, modestbranding: 1 },
          events: {
            onReady: () => {
              if (onTimeUpdate) {
                intervalRef.current = setInterval(() => {
                  const time = playerRef.current?.getCurrentTime() ?? 0
                  onTimeUpdate(Math.floor(time))
                }, 1000)
              }
            },
          },
        })
      }

      if (window.YT?.Player) {
        // API already loaded (e.g. React Strict Mode second mount)
        createPlayer()
      } else if (document.querySelector('script[src*="iframe_api"]')) {
        // Script tag exists but not ready yet — just set callback
        window.onYouTubeIframeAPIReady = createPlayer
      } else {
        // First load
        const tag = document.createElement('script')
        tag.src = 'https://www.youtube.com/iframe_api'
        document.head.appendChild(tag)
        window.onYouTubeIframeAPIReady = createPlayer
      }

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current)
        playerRef.current?.destroy()
      }
    }, [videoId, onTimeUpdate])

    return (
      <div className="w-full aspect-video bg-black">
        <div id="yt-player" ref={containerRef} className="w-full h-full" />
      </div>
    )
  }
)

export default VideoPlayer
```

- [ ] **Step 3: 빌드 타입 체크**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 4: Commit**

```bash
git add components/VideoPlayer.tsx
git commit -m "feat: add YouTube IFrame API VideoPlayer with seekTo ref"
```

---

## Task 14: TimelineEditForm 컴포넌트

**Files:**
- Create: `components/TimelineEditForm.tsx`, `__tests__/components/TimelineEditForm.test.tsx`

- [ ] **Step 1: 테스트 작성**

`__tests__/components/TimelineEditForm.test.tsx`:
```tsx
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
    fireEvent.click(screen.getByText('저장'))
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
    expect(screen.getByText('새 장소 추가')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('00:00')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
npx jest __tests__/components/TimelineEditForm.test.tsx
```
Expected: FAIL

- [ ] **Step 3: 구현**

`components/TimelineEditForm.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { formatTimestamp } from '@/lib/format'
import type { TimelineItem } from '@/lib/types'

function parseTimestamp(value: string): number {
  const parts = value.split(':').map(Number)
  if (parts.length === 2) return parts[0] * 60 + parts[1]
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
  return 0
}

interface Props {
  mode: 'edit' | 'add'
  item?: TimelineItem
  onSave: (item: TimelineItem) => void
  onCancel: () => void
}

export default function TimelineEditForm({ mode, item, onSave, onCancel }: Props) {
  const [timestampStr, setTimestampStr] = useState(
    item ? formatTimestamp(item.timestamp) : ''
  )
  const [place, setPlace] = useState(item?.place ?? '')
  const [city, setCity] = useState(item?.city ?? '')
  const [country, setCountry] = useState(item?.country ?? '')
  const [countryCode, setCountryCode] = useState(item?.countryCode ?? '')
  const [description, setDescription] = useState(item?.description ?? '')

  function handleSave() {
    onSave({
      id: item?.id ?? uuidv4(),
      timestamp: parseTimestamp(timestampStr),
      place,
      city,
      country,
      countryCode: countryCode.toUpperCase().slice(0, 2),
      description,
      lat: item?.lat ?? 0,
      lng: item?.lng ?? 0,
      hasCoords: item?.hasCoords ?? false,  // 수동 추가 아이템은 좌표 없음
    })
  }

  const inputCls = 'bg-[#0f172a] border border-[#334155] rounded text-white text-xs px-2 py-1.5 w-full focus:outline-none focus:border-blue-500'

  return (
    <div className={`mx-3 my-1 rounded-lg p-3 border ${
      mode === 'add' ? 'bg-[#0a1a0f] border-green-800' : 'bg-[#1a2535] border-blue-600'
    }`}>
      <div className={`text-xs font-semibold mb-2 ${mode === 'add' ? 'text-green-400' : 'text-blue-400'}`}>
        {mode === 'add' ? '새 장소 추가' : '장소 수정'}
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">타임스탬프</label>
          <input className={inputCls} value={timestampStr} onChange={(e) => setTimestampStr(e.target.value)} placeholder="00:00" />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">국가코드 (ISO)</label>
          <input className={inputCls} value={countryCode} onChange={(e) => setCountryCode(e.target.value)} placeholder="KR" maxLength={2} />
        </div>
      </div>
      <div className="mb-2">
        <label className="text-[10px] text-slate-500 block mb-1">장소명</label>
        <input className={inputCls} value={place} onChange={(e) => setPlace(e.target.value)} placeholder="명동 거리" />
      </div>
      <div className="grid grid-cols-2 gap-2 mb-2">
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">도시</label>
          <input className={inputCls} value={city} onChange={(e) => setCity(e.target.value)} placeholder="서울" />
        </div>
        <div>
          <label className="text-[10px] text-slate-500 block mb-1">국가</label>
          <input className={inputCls} value={country} onChange={(e) => setCountry(e.target.value)} placeholder="대한민국" />
        </div>
      </div>
      <div className="mb-3">
        <label className="text-[10px] text-slate-500 block mb-1">설명</label>
        <input className={inputCls} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="한 줄 설명" />
      </div>
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          className={`px-3 py-1.5 rounded text-xs font-semibold text-white ${
            mode === 'add' ? 'bg-green-700 hover:bg-green-600' : 'bg-blue-700 hover:bg-blue-600'
          }`}
        >
          {mode === 'add' ? '추가' : '저장'}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded text-xs bg-[#2a2a2a] text-gray-400 hover:bg-[#3a3a3a]">
          취소
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npx jest __tests__/components/TimelineEditForm.test.tsx
```
Expected: PASS (4 tests)

- [ ] **Step 5: Commit**

```bash
git add components/TimelineEditForm.tsx __tests__/components/TimelineEditForm.test.tsx
git commit -m "feat: add TimelineEditForm for inline add/edit"
```

---

## Task 15: TimelineItemRow + TimelineList 컴포넌트

**Files:**
- Create: `components/TimelineItemRow.tsx`, `components/TimelineList.tsx`, `__tests__/components/TimelineList.test.tsx`

- [ ] **Step 1: TimelineItemRow 구현**

`components/TimelineItemRow.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { formatTimestamp, getFlagEmoji } from '@/lib/format'
import type { TimelineItem } from '@/lib/types'
import TimelineEditForm from './TimelineEditForm'

interface Props {
  item: TimelineItem
  isActive: boolean
  isEditing: boolean
  isConfirmingDelete: boolean
  onClick: () => void
  onEdit: () => void
  onDelete: () => void
  onSave: (item: TimelineItem) => void
  onCancelEdit: () => void
  onConfirmDelete: () => void
  onCancelDelete: () => void
}

export default function TimelineItemRow({
  item, isActive, isEditing, isConfirmingDelete,
  onClick, onEdit, onDelete, onSave, onCancelEdit,
  onConfirmDelete, onCancelDelete,
}: Props) {
  return (
    <>
      <div
        onClick={onClick}
        className={`flex items-start gap-2.5 px-4 py-2 cursor-pointer border-l-2 transition-colors group ${
          isActive ? 'bg-[#1e1e1e] border-red-500' : 'border-transparent hover:bg-[#1a1a1a]'
        }`}
      >
        <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5 ${
          isActive ? 'bg-red-500 text-white' : 'bg-[#2a2a2a] text-gray-400'
        }`}>
          {formatTimestamp(item.timestamp)}
        </span>
        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${
          isActive ? 'bg-red-500 ring-2 ring-red-500/30' : 'bg-red-500/60'
        }`} />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-white truncate">{item.place}</p>
          <p className="text-[11px] text-gray-500 truncate">{item.description}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">
            {getFlagEmoji(item.countryCode)} {item.city}, {item.country}
          </p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit} className="w-6 h-6 bg-blue-700 rounded text-[11px] flex items-center justify-center">✏️</button>
          <button onClick={onDelete} className="w-6 h-6 bg-red-900 rounded text-[11px] flex items-center justify-center">🗑</button>
        </div>
      </div>

      {isEditing && (
        <TimelineEditForm mode="edit" item={item} onSave={onSave} onCancel={onCancelEdit} />
      )}

      {isConfirmingDelete && (
        <div className="mx-3 my-1 bg-[#1c0f0f] border border-red-900 rounded-lg px-3 py-2 flex items-center justify-between">
          <div>
            <p className="text-red-400 font-semibold text-xs">{item.place}</p>
            <p className="text-red-300/70 text-[11px]">이 항목을 삭제할까요?</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onConfirmDelete} className="bg-red-600 text-white text-xs px-2.5 py-1 rounded font-semibold">삭제</button>
            <button onClick={onCancelDelete} className="bg-[#2a2a2a] text-gray-400 text-xs px-2.5 py-1 rounded">취소</button>
          </div>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 2: 테스트 작성**

`__tests__/components/TimelineList.test.tsx`:
```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import TimelineList from '@/components/TimelineList'
import type { TimelineItem } from '@/lib/types'

const items: TimelineItem[] = [
  { id: '1', timestamp: 32, place: '인천공항', city: '인천', country: '대한민국', countryCode: 'KR', description: '도착', lat: 37.4, lng: 126.4 },
  { id: '2', timestamp: 468, place: '명동 거리', city: '서울', country: '대한민국', countryCode: 'KR', description: '쇼핑', lat: 37.5, lng: 126.9 },
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
    fireEvent.click(screen.getByText('새 장소 추가하기'))
    expect(screen.getByText('새 장소 추가')).toBeInTheDocument()
  })

  it('shows empty state when items is empty', () => {
    render(<TimelineList items={[]} activeTimestamp={0} onItemClick={jest.fn()} onItemsChange={jest.fn()} onMarkerFocus={jest.fn()} />)
    expect(screen.getByText('방문 장소를 찾지 못했어요')).toBeInTheDocument()
    expect(screen.getByText('직접 추가하기')).toBeInTheDocument()
  })
})
```

- [ ] **Step 3: 테스트 실패 확인**

```bash
npx jest __tests__/components/TimelineList.test.tsx
```
Expected: FAIL

- [ ] **Step 4: TimelineList 구현**

`components/TimelineList.tsx`:
```tsx
'use client'

import { useState, useCallback } from 'react'
import type { TimelineItem } from '@/lib/types'
import TimelineItemRow from './TimelineItemRow'
import TimelineEditForm from './TimelineEditForm'

interface Props {
  items: TimelineItem[]
  activeTimestamp: number
  onItemClick: (timestamp: number) => void
  onItemsChange: (items: TimelineItem[]) => void
  onMarkerFocus: (itemId: string) => void
}

export default function TimelineList({ items, activeTimestamp, onItemClick, onItemsChange, onMarkerFocus }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const activeItem = items.reduce<TimelineItem | null>((best, item) => {
    if (item.timestamp > activeTimestamp) return best
    if (!best || item.timestamp > best.timestamp) return item
    return best
  }, null)

  const handleSave = useCallback((updated: TimelineItem) => {
    const next = items.map((i) => (i.id === updated.id ? updated : i))
    onItemsChange(next.sort((a, b) => a.timestamp - b.timestamp))
    setEditingId(null)
  }, [items, onItemsChange])

  const handleConfirmDelete = useCallback((id: string) => {
    onItemsChange(items.filter((i) => i.id !== id))
    setDeletingId(null)
  }, [items, onItemsChange])

  const handleAdd = useCallback((newItem: TimelineItem) => {
    const next = [...items, newItem].sort((a, b) => a.timestamp - b.timestamp)
    onItemsChange(next)
    setShowAddForm(false)
  }, [items, onItemsChange])

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-[#2a2a2a] flex items-center justify-between flex-shrink-0">
        <h3 className="text-[13px] font-semibold text-white">📍 방문 장소 타임라인</h3>
        <span className="text-[11px] text-gray-500 bg-[#2a2a2a] px-2 py-0.5 rounded-full">{items.length}곳</span>
      </div>

      <div className="flex-1 overflow-y-auto">
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
            <span className="text-5xl mb-4 opacity-30">📍</span>
            <p className="text-white font-semibold text-sm mb-1">방문 장소를 찾지 못했어요</p>
            <p className="text-gray-500 text-xs mb-5">영상에 장소 설명이 부족하거나 자막이 없을 수 있어요</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-red-500 text-white text-xs px-4 py-2 rounded-lg font-semibold"
              >
                직접 추가하기
              </button>
              <a href="/" className="bg-[#2a2a2a] text-gray-400 text-xs px-4 py-2 rounded-lg">
                새 영상 분석
              </a>
            </div>
          </div>
        )}
        {items.map((item) => (
          <TimelineItemRow
            key={item.id}
            item={item}
            isActive={activeItem?.id === item.id}
            isEditing={editingId === item.id}
            isConfirmingDelete={deletingId === item.id}
            onClick={() => { onItemClick(item.timestamp); onMarkerFocus(item.id) }}
            onEdit={() => setEditingId(item.id)}
            onDelete={() => setDeletingId(item.id)}
            onSave={handleSave}
            onCancelEdit={() => setEditingId(null)}
            onConfirmDelete={() => handleConfirmDelete(item.id)}
            onCancelDelete={() => setDeletingId(null)}
          />
        ))}

        {showAddForm ? (
          <TimelineEditForm mode="add" onSave={handleAdd} onCancel={() => setShowAddForm(false)} />
        ) : (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-blue-400 text-[13px] hover:bg-[#1a1f2e] border-b border-[#1e1e1e]"
          >
            <span className="w-5 h-5 rounded-full bg-blue-900/50 flex items-center justify-center text-sm">＋</span>
            새 장소 추가하기
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: 테스트 통과 확인**

```bash
npx jest __tests__/components/TimelineList.test.tsx
```
Expected: PASS (3 tests)

- [ ] **Step 6: Commit**

```bash
git add components/TimelineItemRow.tsx components/TimelineList.tsx __tests__/components/TimelineList.test.tsx
git commit -m "feat: add TimelineItemRow and TimelineList with edit/delete/add"
```

---

## Task 16: MapView 컴포넌트

**Files:**
- Create: `components/MapView.tsx`

- [ ] **Step 1: 구현**

`components/MapView.tsx`:
```tsx
'use client'

import { useEffect, useRef } from 'react'
import { APIProvider, Map, AdvancedMarker, InfoWindow, useMap } from '@vis.gl/react-google-maps'
import { useState } from 'react'
import { formatTimestamp, getFlagEmoji } from '@/lib/format'
import type { TimelineItem } from '@/lib/types'

interface Props {
  items: TimelineItem[]
  focusedItemId: string | null
  onMarkerClick: (itemId: string) => void
}

function MapContent({ items, focusedItemId, onMarkerClick }: Props) {
  const map = useMap()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const polylineRef = useRef<google.maps.Polyline | null>(null)

  // 경로 Polyline
  useEffect(() => {
    if (!map || items.length < 2) return
    polylineRef.current?.setMap(null)
    const validItems = items.filter((i) => i.lat !== 0 && i.lng !== 0)
    polylineRef.current = new google.maps.Polyline({
      path: validItems.map((i) => ({ lat: i.lat, lng: i.lng })),
      geodesic: true,
      strokeColor: '#ef4444',
      strokeOpacity: 0,
      icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.6, scale: 3 }, offset: '0', repeat: '15px' }],
      map,
    })
    return () => { polylineRef.current?.setMap(null) }
  }, [map, items])

  // focusedItemId 변경 시 지도 이동
  useEffect(() => {
    if (!map || !focusedItemId) return
    const item = items.find((i) => i.id === focusedItemId)
    if (item && item.hasCoords) {
      map.panTo({ lat: item.lat, lng: item.lng })
      map.setZoom(14)
      setSelectedId(focusedItemId)
    }
  }, [map, focusedItemId, items])

  const validItems = items.filter((i) => i.hasCoords)
  const selected = validItems.find((i) => i.id === selectedId)

  return (
    <>
      {validItems.map((item, idx) => (
        <AdvancedMarker
          key={item.id}
          position={{ lat: item.lat, lng: item.lng }}
          onClick={() => { setSelectedId(item.id); onMarkerClick(item.id) }}
        >
          <div className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-white text-[11px] font-bold shadow-lg cursor-pointer ${
            selectedId === item.id ? 'bg-orange-500 scale-125' : 'bg-red-500'
          } transition-transform`}>
            {idx + 1}
          </div>
        </AdvancedMarker>
      ))}

      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          onCloseClick={() => setSelectedId(null)}
        >
          <div className="p-1 min-w-[150px]">
            <p className="text-[10px] text-red-600 font-mono font-semibold">{formatTimestamp(selected.timestamp)}</p>
            <p className="font-bold text-sm mt-0.5">{selected.place}</p>
            <p className="text-gray-500 text-xs">{getFlagEmoji(selected.countryCode)} {selected.city}, {selected.country}</p>
            <p className="text-gray-700 text-xs mt-1">{selected.description}</p>
          </div>
        </InfoWindow>
      )}
    </>
  )
}

export default function MapView({ items, focusedItemId, onMarkerClick }: Props) {
  const center = items.find((i) => i.hasCoords)
  const defaultCenter = center ? { lat: center.lat, lng: center.lng } : { lat: 37.5665, lng: 126.9780 }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <Map
        defaultCenter={defaultCenter}
        defaultZoom={10}
        mapId="travel-map"
        className="w-full h-full"
        disableDefaultUI
        zoomControl
      >
        <MapContent items={items} focusedItemId={focusedItemId} onMarkerClick={onMarkerClick} />
      </Map>
    </APIProvider>
  )
}
```

- [ ] **Step 2: `.env.local`에 클라이언트 키 추가**

`.env.local.example`에 추가:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...
```

`.env.local`에도 동일하게 추가 (같은 키 값):
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<GOOGLE_MAPS_API_KEY와 동일한 값>
```

- [ ] **Step 3: 빌드 타입 체크**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 4: Commit**

```bash
git add components/MapView.tsx .env.local.example
git commit -m "feat: add Google Maps component with markers, polyline, InfoWindow"
```

---

## Task 17: 결과 페이지 조합

**Files:**
- Create: `app/result/[id]/page.tsx`

- [ ] **Step 1: 구현**

`app/result/[id]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { loadSession } from '@/lib/session'
import ResultClient from './ResultClient'

export default async function ResultPage({ params }: { params: { id: string } }) {
  const result = await loadSession(params.id)
  if (!result) notFound()
  return <ResultClient result={result} />
}
```

`app/result/[id]/ResultClient.tsx`:
```tsx
'use client'

import { useRef, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import VideoPlayer, { VideoPlayerHandle } from '@/components/VideoPlayer'
import TimelineList from '@/components/TimelineList'
import BlogGenerator from '@/components/BlogGenerator'
import type { AnalysisResult, TimelineItem } from '@/lib/types'

const MapView = dynamic(() => import('@/components/MapView'), { ssr: false })

interface Props {
  result: AnalysisResult
}

export default function ResultClient({ result }: Props) {
  const playerRef = useRef<VideoPlayerHandle>(null)
  const [items, setItems] = useState<TimelineItem[]>(result.items)
  const [currentTime, setCurrentTime] = useState(0)
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null)
  const [showBlog, setShowBlog] = useState(false)

  const handleItemClick = useCallback((timestamp: number) => {
    playerRef.current?.seekTo(timestamp)
  }, [])

  const handleMarkerClick = useCallback((itemId: string) => {
    const item = items.find((i) => i.id === itemId)
    if (item) playerRef.current?.seekTo(item.timestamp)
  }, [items])

  return (
    <div className="h-screen bg-[#0f0f0f] flex flex-col overflow-hidden">
      {/* Top nav */}
      <nav className="h-13 bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center px-5 gap-3 flex-shrink-0">
        <span className="font-bold text-white text-[15px]">Travel<span className="text-red-500">Map</span></span>
        <span className="flex-1 text-[13px] text-gray-500 truncate">{result.videoTitle}</span>
        <a href="/" className="bg-[#2a2a2a] text-gray-400 text-xs px-3 py-1.5 rounded-lg hover:bg-[#3a3a3a]">새 영상 분석</a>
      </nav>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel */}
        <div className="w-[400px] flex-shrink-0 flex flex-col bg-[#141414] border-r border-[#2a2a2a] overflow-hidden">
          <VideoPlayer
            ref={playerRef}
            videoId={result.videoId}
            onTimeUpdate={setCurrentTime}
          />
          <div className="flex-1 overflow-hidden">
            <TimelineList
              items={items}
              activeTimestamp={currentTime}
              onItemClick={handleItemClick}
              onItemsChange={setItems}
              onMarkerFocus={setFocusedItemId}
            />
          </div>
          <div className="p-3 border-t border-[#2a2a2a] flex-shrink-0">
            <button
              onClick={() => setShowBlog(true)}
              className="w-full bg-gradient-to-r from-blue-700 to-violet-700 text-white text-[13px] font-semibold py-2.5 rounded-lg"
            >
              ✍️ 블로그 포스트 자동 생성
            </button>
          </div>
        </div>

        {/* Right: Map */}
        <div className="flex-1 relative">
          <MapView
            items={items}
            focusedItemId={focusedItemId}
            onMarkerClick={handleMarkerClick}
          />
        </div>
      </div>

      {/* Blog panel overlay */}
      {showBlog && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
          <div className="bg-[#141414] border border-[#2a2a2a] rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
              <h2 className="text-white font-semibold">여행 블로그 생성</h2>
              <button onClick={() => setShowBlog(false)} className="text-gray-500 hover:text-white text-xl">×</button>
            </div>
            <div className="flex-1 overflow-auto">
              <BlogGenerator items={items} videoTitle={result.videoTitle} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 빌드 타입 체크**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 3: Commit**

```bash
git add app/result/
git commit -m "feat: add result page assembling all components"
```

---

## Task 18: BlogGenerator + `/api/blog` 라우트

**Files:**
- Create: `components/BlogGenerator.tsx`, `app/api/blog/route.ts`

- [ ] **Step 1: `/api/blog` 라우트 구현**

`app/api/blog/route.ts`:
```ts
import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { formatTimestamp, getFlagEmoji } from '@/lib/format'
import type { TimelineItem } from '@/lib/types'

export const maxDuration = 120

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const { items, videoTitle }: { items: TimelineItem[]; videoTitle: string } = await req.json()

  const locationSummary = items
    .map((item, i) => `${i + 1}. [${formatTimestamp(item.timestamp)}] ${getFlagEmoji(item.countryCode)} ${item.place} (${item.city}, ${item.country}) — ${item.description}`)
    .join('\n')

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const anthropicStream = await client.messages.stream({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [{
          role: 'user',
          content: `당신은 여행 블로그 작가입니다. 다음 YouTube 여행 영상의 방문 장소 정보를 바탕으로 매력적인 한국어 여행 블로그 포스트를 작성해주세요.

영상 제목: ${videoTitle}

방문 장소:
${locationSummary}

요구사항:
- 자연스러운 여행기 형식으로 작성
- 각 장소에 대한 생생한 묘사 포함
- 독자가 직접 여행하는 느낌을 줄 것
- 마크다운 형식 사용 (# 제목, ## 소제목, **볼드** 등)
- 총 800~1200자 분량`,
        }]
      })

      for await (const chunk of anthropicStream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`))
        }
      }
      controller.enqueue(encoder.encode('data: {"done": true}\n\n'))
      controller.close()
    }
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' }
  })
}
```

- [ ] **Step 2: BlogGenerator 컴포넌트 구현**

`components/BlogGenerator.tsx`:
```tsx
'use client'

import { useState, useRef } from 'react'
import type { TimelineItem } from '@/lib/types'

interface Props {
  items: TimelineItem[]
  videoTitle: string
}

export default function BlogGenerator({ items, videoTitle }: Props) {
  const [content, setContent] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const hasStarted = useRef(false)

  // 렌더 후 자동 시작 — useEffect로 처리해야 React 규칙 준수
  useEffect(() => {
    if (!hasStarted.current) generate()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generate() {
    if (isGenerating || hasStarted.current) return
    hasStarted.current = true
    setIsGenerating(true)
    setContent('')

    const res = await fetch('/api/blog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, videoTitle }),
    })

    const reader = res.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value)
      for (const line of text.split('\n').filter((l) => l.startsWith('data: '))) {
        const data = JSON.parse(line.slice(6))
        if (data.done) { setIsGenerating(false); return }
        if (data.text) setContent((prev) => prev + data.text)
      }
    }
    setIsGenerating(false)
  }

  async function copyToClipboard() {
    await navigator.clipboard.writeText(content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="p-5">
      {isGenerating && !content && (
        <p className="text-gray-400 text-sm animate-pulse">블로그 작성 중...</p>
      )}
      {content && (
        <>
          <div className="prose prose-invert prose-sm max-w-none text-gray-300 whitespace-pre-wrap text-[13px] leading-relaxed">
            {content}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={copyToClipboard}
              className="bg-[#2a2a2a] text-gray-300 text-xs px-4 py-2 rounded-lg hover:bg-[#3a3a3a]"
            >
              {copied ? '✅ 복사됨' : '📋 복사하기'}
            </button>
            <button
              onClick={() => { hasStarted.current = false; setContent(''); generate() }}
              className="bg-[#2a2a2a] text-gray-300 text-xs px-4 py-2 rounded-lg hover:bg-[#3a3a3a]"
            >
              🔄 다시 생성
            </button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: 빌드 타입 체크**

```bash
npx tsc --noEmit
```
Expected: 오류 없음

- [ ] **Step 4: Commit**

```bash
git add components/BlogGenerator.tsx app/api/blog/route.ts
git commit -m "feat: add blog generation with Claude streaming"
```

---

## Task 19: 환경변수 검증 + 404 페이지

**Files:**
- Create: `lib/validateEnv.ts`, `app/not-found.tsx`

- [ ] **Step 1: 환경변수 검증 유틸 구현**

`lib/validateEnv.ts`:
```ts
const REQUIRED_ENV_VARS = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GOOGLE_MAPS_API_KEY',
  'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
] as const

export function validateEnv(): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      `Copy .env.local.example to .env.local and fill in your API keys.`
    )
  }
}
```

- [ ] **Step 2: `/api/analyze` 라우트 상단에 검증 추가**

`app/api/analyze/route.ts` — `POST` 함수 최상단 (stream 열기 전)에 추가:
```ts
import { validateEnv } from '@/lib/validateEnv'

export async function POST(req: NextRequest) {
  // 스트림 열기 전에 검증 — 실패 시 500 HTTP 응답 (SSE 이벤트가 아님)
  validateEnv()
  const { url } = await req.json()
  // ... 나머지 동일
```

- [ ] **Step 3: 404 페이지 구현**

`app/not-found.tsx`:
```tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">404</h1>
        <p className="text-gray-400 mb-6">분석 결과를 찾을 수 없습니다.</p>
        <Link href="/" className="bg-red-500 text-white px-5 py-2.5 rounded-lg text-sm font-semibold">
          처음으로
        </Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 4: 전체 테스트 실행**

```bash
npx jest
```
Expected: All tests pass (13+ tests)

- [ ] **Step 5: 프로덕션 빌드 확인**

```bash
npm run build
```
Expected: `✓ Compiled successfully`

- [ ] **Step 6: Commit**

```bash
git add lib/validateEnv.ts app/not-found.tsx app/api/analyze/route.ts
git commit -m "feat: add env validation and 404 page"
```

---

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 0 | — | — |
| Codex Review | `/codex review` | Independent 2nd opinion | 0 | — | — |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | CLEAR (PLAN) | 7 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | issues_open | score: 5/10 → 8/10, 4 decisions |

**UNRESOLVED:** 0
**VERDICT:** ENG CLEARED — ready to implement.

---

## Task 20: 로컬 E2E 스모크 테스트

**Files:** 없음 (수동 확인)

- [ ] **Step 1: 개발 서버 실행**

```bash
npm run dev
```

- [ ] **Step 2: 홈 → 분석 → 결과 플로우 확인**

1. `http://localhost:3000` 접속
2. 실제 YouTube 여행 영상 URL 입력 (예: `https://youtu.be/<id>`)
3. 분석 진행 화면에서 단계별 진행 확인
4. 결과 화면에서:
   - 좌측 패널에 YouTube 플레이어 표시 확인
   - 타임라인 리스트에 장소 목록 표시 확인
   - 우측 지도에 마커 표시 확인
   - 타임라인 아이템 클릭 → 영상 해당 시점으로 이동 확인
   - 마커 클릭 → InfoWindow 팝업 표시 확인
   - ✏️ 버튼 → 인라인 수정 폼 확인
   - 🗑 버튼 → 삭제 확인 UI 확인
   - ＋ 새 장소 추가하기 → 추가 폼 확인
   - 블로그 생성 버튼 → 스트리밍 블로그 텍스트 확인

- [ ] **Step 3: 최종 Commit**

```bash
git add -A
git commit -m "feat: travel youtube map MVP complete"
```
