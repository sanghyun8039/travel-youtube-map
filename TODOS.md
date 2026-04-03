# TODOS

## Security

- **Priority:** P1
  - **Title:** Blog API 인증/Rate Limiting 추가
  - **Description:** `POST /api/blog`에 인증 및 rate limiting 없음 — 누구나 반복 호출하여 Anthropic API 쿼터 소진 가능. 세션 검증 또는 간단한 rate limit 미들웨어 추가 필요.
  - **Noticed on:** feat/improvements-and-fixes

- **Priority:** P1
  - **Title:** analyze route에서 address 필드 매핑
  - **Description:** `geocodePlace`가 반환하는 `address` 필드가 `/api/analyze` 파이프라인에서 `TimelineItem`으로 전달되지 않음 — 블로그 생성 시 모든 장소에 "주소 정보 없음" 표시. `lib/analyzer.ts` 또는 `app/api/analyze/route.ts`에서 `address: coords?.address` 매핑 추가 필요.

- **Priority:** P1
  - **Title:** Geocoding API 클라이언트 노출 제한
  - **Description:** `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`가 브라우저 번들에 포함되어 임의 Geocoding 호출에 사용 가능. Google Cloud Console에서 HTTP referrer 제한 설정 또는 서버 프록시 라우트로 전환 권장.

## Infrastructure

- **Priority:** P2
  - **Title:** ffmpeg/yt-dlp 실행 타임아웃 설정
  - **Description:** `lib/keyframes.ts`의 `execAsync`에 timeout 옵션 없음 — 장시간 처리 시 Node 프로세스 좀비화 가능. `exec(cmd, { timeout: 120000 })` 추가 권장.

## Completed

