# Design System — Travel YouTube Map

## Product Context
- **What this is:** YouTube 여행 영상 URL을 입력하면 AI가 방문 장소와 타임스탬프를 추출해 지도에 마커로 표시하는 웹 앱
- **Who it's for:** 여행 유튜버, 여행 콘텐츠 시청자, 여행 계획 중인 사람
- **Space/industry:** 여행 + 콘텐츠 분석 도구
- **Project type:** Web app (분석 도구 + 지도 시각화)

## Aesthetic Direction
- **Direction:** Industrial/Editorial hybrid — 데이터 밀도 높은 도구 감성 + 여행 스토리텔링 리듬
- **Decoration level:** intentional — 배경 텍스처 없음, 레이아웃 자체가 시각적 계층 역할
- **Mood:** 어두운 밤에 지도를 들여다보는 느낌. 분석 도구지만 여행의 설렘이 살아있어야 한다. YouTube 레드와 어두운 배경의 대비가 핵심 시각 언어.
- **Reference sites:** Linear, Vercel Dashboard, YouTube 다크 모드 인터페이스

## Typography
- **Display/Hero:** Inter 700 — 제품명, 화면 제목
- **Body:** Inter 400/500 — 장소명, 설명, UI 레이블
- **UI/Labels:** Inter 500 — 버튼, 폼 레이블, 상태 텍스트
- **Timestamp/Code (RISK 1):** JetBrains Mono 500/600 — 타임스탬프 배지, 시간 표시. 시스템 monospace 대비 날카롭고 기술적인 느낌. 코딩 도구 감성.
- **Loading:** Google Fonts CDN — `https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap`
- **Scale:**
  - hero: 32–36px / font-weight: 700
  - h1: 24px / font-weight: 700
  - h2: 18px / font-weight: 600
  - h3: 16px / font-weight: 600
  - body: 14px / font-weight: 400 / line-height: 1.6
  - small: 12px
  - micro: 10–11px (배지, 레이블)

## Color
- **Approach:** restrained — 레드 단일 액센트, 나머지는 그레이 계열 뉴트럴
- **CSS Variables:**
  ```css
  --base:            #0a0a0a;  /* 페이지 배경 */
  --panel:           #111111;  /* 좌측 패널, 카드 배경 */
  --surface:         #1a1a1a;  /* 중간 레이어 배경 */
  --hover:           #1e1e1e;  /* 호버 상태 */
  --input:           #252525;  /* 인풋 배경 */
  --border:          #2a2a2a;  /* 모든 구분선 */
  --text-primary:    #f0f0f0;  /* 주요 텍스트 */
  --text-secondary:  #9ca3af;  /* 보조 텍스트 */
  --text-muted:      #6b7280;  /* 힌트, 레이블 */
  --red:             #ef4444;  /* 주 액센트 — YouTube 레드 계열 */
  --red-hover:       #dc2626;  /* 버튼 호버 */
  --red-glow:        rgba(239, 68, 68, 0.12);  /* 활성 행 배경 (RISK 3) */
  --blue:            #3b82f6;  /* 링크, 추가 버튼, 포커스 */
  --green:           #22c55e;  /* 완료 상태 */
  --yellow:          #eab308;  /* 경고 상태 */
  ```
- **Dark mode:** 기본이 다크 모드. 라이트 모드 지원 시 `--base: #f8f8f8`, `--panel: #ffffff`, `--border: #d4d4d4`로 오버라이드.

## Spacing
- **Base unit:** 4px
- **Density:** comfortable (타임라인 아이템: 8–10px vertical padding)
- **Scale:**
  - 2xs: 2px
  - xs: 4px
  - sm: 8px
  - md: 16px
  - lg: 24px
  - xl: 32px
  - 2xl: 48px
  - 3xl: 64px

## Layout
- **Approach:** grid-disciplined — 결과 화면은 엄격한 2-컬럼 (400px 고정 + 나머지)
- **Result screen:** 좌측 패널 400px 고정 / 우측 지도 flex-1
- **Left panel:** 상단부터 — 영상 플레이어(16:9) → 타임라인(스크롤) → 블로그 버튼(하단 고정)
- **Max content width:** 홈/분석 화면 max-width 520px (중앙 정렬)
- **Border radius:**
  - badge/chip: 4px (`--r-sm`)
  - button/input: 6px (`--r-md`)
  - form/card: 8px (`--r-lg`)
  - modal/panel: 12px (`--r-xl`)

## Motion
- **Approach:** minimal-functional — 이해를 돕는 전환만, 장식적 애니메이션 없음
- **Easing:** enter: `ease-out` / exit: `ease-in` / move: `ease-in-out`
- **Duration:**
  - micro: 100ms (버튼 hover, 아이콘 회전)
  - short: 150ms (타임라인 행 hover, 입력 포커스)
  - medium: 250ms (패널 슬라이드, 폼 열기/닫기)
  - long: 400ms (페이지 전환)
- **Key animations:**
  - 타임라인 행 hover: `background var(--duration) ease-out` (150ms)
  - 수정/삭제 버튼 show: `opacity 150ms ease-out`
  - SSE 단계 완료: 위에서 아래로 순차 페이드인

## Risk Decisions (Deliberate Departures)

### RISK 1: JetBrains Mono for Timestamps
타임스탬프 배지(`00:32`, `07:48`)에 시스템 monospace 대신 JetBrains Mono 사용.
- **Why:** 정렬이 깔끔하고, 코드/데이터 도구의 정밀한 느낌을 부여. YouTube의 타임스탬프 링크와 시각적으로 구분된 아이덴티티.
- **Trade-off:** Google Fonts 추가 로딩. Inter와 같이 묶어 요청하면 latency 무시 가능.
- **Usage:** `.t-badge`, `.blog-word-count`, 모든 시간 표시 요소

### RISK 2: Red Polyline for Map Route
지도 경로선을 Google Maps 기본 파란색 대신 `#ef4444` 빨간색 점선으로.
- **Why:** YouTube 레드와 타임라인 레드 마커와 시각적 일관성. "이 경로가 이 영상에서 왔다"는 연결감.
- **Trade-off:** 마커(빨간 핀)와 같은 색이라 구분이 약해질 수 있음. 점선 + 낮은 opacity(0.7)로 보완.
- **Implementation:** `strokeColor: '#ef4444'`, `strokeOpacity: 0.7`, `strokeWeight: 2`, `icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 }, offset: '0', repeat: '12px' }]`

### RISK 3: Row Glow Background for Active Timeline Item
활성 타임라인 행에 `border-left: 3px solid #ef4444` + `background: rgba(239,68,68,0.12)` glow.
- **Why:** 현재 재생 위치가 타임라인 어디에 있는지 한눈에 파악. 단순 테두리보다 공간감 있는 활성화 표현.
- **Trade-off:** 배경이 어둡기 때문에 빨간 glow가 강하게 보일 수 있음. opacity 0.12로 절제.
- **Implementation:**
  ```css
  .timeline-item.active {
    background: var(--red-glow);  /* rgba(239,68,68,0.12) */
    border-left: 3px solid var(--red);
    padding-left: calc(원래 padding-left - 3px);  /* border 보정 */
  }
  .timeline-item.active .t-badge {
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
  }
  ```

## Component Patterns

### Timeline Item
```tsx
// 기본 상태
<div className="flex items-center gap-2 px-3 py-2 border-b border-[--border] hover:bg-[--hover] transition-colors cursor-pointer">
  <span className="font-mono text-[10px] font-semibold bg-[--surface] text-[--text-secondary] px-1.5 py-0.5 rounded">
    {formatTimestamp(item.timestamp)}
  </span>
  <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
  <div className="flex-1 min-w-0">
    <div className="text-xs font-semibold truncate">{item.place}</div>
    <div className="text-[10px] text-[--text-muted] truncate mt-0.5">{item.description}</div>
  </div>
</div>

// 활성 상태 — 추가 클래스
className="... bg-[--red-glow] border-l-[3px] border-l-red-500 pl-[9px]"
```

### Error Alert
```tsx
<div className="bg-red-500/10 border border-red-500/25 rounded-md px-3 py-2.5 text-xs text-red-300">
  {message}
</div>
```

### Primary Button
```tsx
<button className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors active:scale-[0.97]">
  {label}
</button>
```

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-02 | Industrial/Editorial dark aesthetic | YouTube 영상 분석 도구 — 어두운 배경, 데이터 밀도, 레드 액센트로 YouTube와 연결감 |
| 2026-04-02 | Inter (body) + JetBrains Mono (timestamps) | Inter: 넓은 한국어 지원 + 높은 가독성 / JetBrains Mono: 타임스탬프 정밀성 |
| 2026-04-02 | Red #ef4444 as single accent | YouTube 레드와 유사, 마커/타임라인/버튼 전체 일관성 |
| 2026-04-02 | Red polyline on map (RISK 2) | 지도 경로와 타임라인 마커 색상 통일, 영상-지도 연결감 |
| 2026-04-02 | Row glow for active timeline (RISK 3) | 현재 재생 위치 즉각 인지, 절제된 rgba 배경으로 과하지 않게 |
| 2026-04-02 | 400px fixed left panel | 영상 플레이어 16:9 비율 유지 + 타임라인 스크롤 공간 확보 |
| 2026-04-02 | Minimal-functional motion | 분석 도구 특성상 빠른 인터랙션이 중요, 장식 애니메이션 배제 |
