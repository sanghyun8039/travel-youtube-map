# DB Schema Design — Travel YouTube Map

**Date:** 2026-04-03
**Status:** Approved

---

## Overview

YouTube 여행 영상 분석 결과를 PostgreSQL DB에 저장한다. 핵심 목표는 **"이 장소에 방문한 유튜버 목록"** 쿼리를 지원하는 것이며, 장소는 Google Place ID를 기준으로 전역 중복 제거한다.

---

## Tech Stack

| 항목 | 선택 |
|------|------|
| DB | PostgreSQL (라즈베리파이 셀프 호스팅) |
| ORM | Prisma |
| 장소 중복 제거 | Google Places API Text Search (googlePlaceId) |

---

## Schema (Prisma)

```prisma
model Channel {
  id           String   @id @default(uuid())
  channelId    String   @unique  // YouTube channel ID (UCxxxx...)
  channelName  String
  channelUrl   String
  thumbnailUrl String?
  createdAt    DateTime @default(now())

  videos       Video[]
}

model Video {
  id          String   @id @default(uuid())
  videoId     String   @unique  // YouTube video ID
  title       String
  channelId   String
  channel     Channel  @relation(fields: [channelId], references: [id])
  destCity    String?  // main_destination.city
  destCountry String?  // main_destination.country
  analyzedAt  DateTime @default(now())

  places      VideoPlace[]
}

model Place {
  id            String   @id @default(uuid())
  googlePlaceId String   @unique
  name          String   // 정규 이름 (Google 기준)
  address       String?
  city          String?
  country       String?
  countryCode   String?
  lat           Float
  lng           Float
  createdAt     DateTime @default(now())

  appearances   VideoPlace[]
}

model VideoPlace {
  id          String   @id @default(uuid())
  videoId     String
  video       Video    @relation(fields: [videoId], references: [id])
  placeId     String?  // null 허용: 좌표 없는 장소(hasCoords: false)
  place       Place?   @relation(fields: [placeId], references: [id])
  timestamp   Int      // seconds
  localName   String   // 영상에서 추출된 이름 (e.g. "세나도 광장")
  description String?
  orderIndex  Int      // 방문 순서 (지도 번호 마커용)

  @@unique([videoId, orderIndex])  // placeId null 허용으로 인해 orderIndex 기준 unique
}
```

---

## 저장 트리거: 수동 버튼

분석 완료 후 자동 저장하지 않는다. 사용자가 타임라인을 수동 편집(추가/수정/삭제)한 뒤 **[DB에 저장]** 버튼을 클릭하면 클라이언트의 현재 상태가 DB에 반영된다.

**버튼 위치:** 결과 페이지 좌측 패널 하단 (블로그 생성 버튼 옆)

---

## API: POST /api/save

### 채널 정보 취득 방법

YouTube oEmbed API (무료, API 키 불필요):
```
GET https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={videoId}&format=json
→ author_name (채널명), author_url (채널 URL) 반환
```
channelId는 `author_url`에서 파싱하거나, YouTube Data API v3 `videos.list`로 취득.

### Request Body

```ts
{
  videoId: string
  videoTitle: string
  channelId: string       // YouTube channel ID
  channelName: string
  channelUrl: string
  destCity?: string
  destCountry?: string
  items: TimelineItem[]   // 편집된 현재 상태 그대로
}
```

### 처리 순서

```
1. Channel upsert  (channelId unique key)
2. Video upsert    (videoId unique key)
3. 해당 videoId의 VideoPlace 전체 삭제
4. items 루프:
     hasCoords = true  → Places API Text Search → googlePlaceId 취득
                        → Place upsert (googlePlaceId unique key)
                        → VideoPlace create (placeId 포함)
     hasCoords = false → VideoPlace create (placeId = null)
5. 성공 응답 반환
```

> **삭제 후 재삽입 전략**: 수동 삭제된 장소 diff 로직 없이 현재 화면 상태가 DB에 정확히 반영됨.

### Response

```ts
// 성공
{ success: true, savedCount: number }

// 실패
{ success: false, error: string }
```

---

## 핵심 쿼리 예시

```sql
-- 특정 장소에 방문한 유튜버 목록
SELECT c.channelName, v.title, vp.timestamp, vp.localName
FROM VideoPlace vp
JOIN Video v ON vp.videoId = v.id
JOIN Channel c ON v.channelId = c.id
WHERE vp.placeId = '<placeId>'
ORDER BY vp.timestamp;

-- 특정 유튜버가 방문한 장소 전체
SELECT p.name, p.city, vp.localName, vp.timestamp, v.title
FROM VideoPlace vp
JOIN Place p ON vp.placeId = p.id
JOIN Video v ON vp.videoId = v.id
JOIN Channel c ON v.channelId = c.id
WHERE c.channelId = 'UCxxxx';
```

---

## 수동 편집 케이스별 처리

| 케이스 | 처리 |
|--------|------|
| 장소 이름/설명 수정 | 삭제 후 재삽입으로 자동 반영 |
| 장소 삭제 | 삭제 후 재삽입 → 해당 VideoPlace 미생성 |
| 장소 추가 (좌표 있음) | Places API 호출 → Place upsert → VideoPlace create |
| 장소 추가 (좌표 없음) | VideoPlace create (placeId null) |

---

## Out of Scope

- 사용자 인증 / 로그인
- 관리자 Place 병합 UI
- 장소별 통계 대시보드 (추후)
- 사용자 여행 지도 생성 (추후)
