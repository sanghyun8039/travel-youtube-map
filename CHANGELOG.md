# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0.0] - 2026-04-03

### Added
- 지도 마커 클릭 시 해당 타임라인 아이템으로 자동 스크롤 및 영상 시간 이동
- 타임라인 패널 너비 드래그로 조절 가능 (300px~600px, 리사이즈 핸들 표시)
- 마커에 방문 순서 번호 표시 (Google Maps Pin glyph)
- 타임라인 아이템 편집 폼에 주소 검색 기능 추가 (검색 버튼 또는 Enter로 지오코딩 자동 완성)
- `TimelineItem`에 `address` 선택 필드 추가, 타임라인 목록에 주소 표시

### Changed
- 블로그 생성 프롬프트 개선 — 네이버 블로그 형식, 타임스탬프 포함, 장소별 상세 주소 반영
- 지오코더가 `city`, `country`, `countryCode`, `address`를 포함한 전체 정보 반환 (기존: 좌표만 반환)
- 지도 포커스 이동을 `panTo` → `setCenter`로 변경, 줌 레벨 15 → 17로 상향
- 맵 기본 중심을 서울에서 도쿄로 변경 (범위 자동 맞춤 전 초기값)
- 폴리라인 투명도 0.7 → 0.4, 대시 간격 조정

### Fixed
- `geocoder.ts`: `locality`와 `administrative_area_level_1` 동시 존재 시 `locality` 우선 적용 (순서 의존 버그 수정)
- `blog/route.ts`: API key 검증을 stream 시작 전으로 이동 — 실패 시 HTTP 500 올바르게 반환
- `TimelineEditForm`: Enter 키 중복 제출 방지 (`isSearching` 중 재호출 차단)
- `ResultClient`: resize 이벤트를 `document`에 부착 — 브라우저 window 밖에서 마우스 놓아도 리사이즈 정상 종료
- `keyframes.ts`, `whisper.ts`: `child_process` 모듈 import 방식 수정 (빌드 안정성)
