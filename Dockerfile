# 1. Node.js 설치된 리눅스 준비 (가벼운 버전)
FROM node:20-alpine

# 2. 작업 폴더 만들기
WORKDIR /app

# 3. 패키지 목록 복사 및 설치
COPY package*.json ./
# prisma도 필요하므로 복사
COPY prisma ./prisma/

# 4. 라이브러리 설치 (ci는 clean install의 약자, 더 안정적임)
RUN npm ci

# 5. 소스 코드 전체 복사
COPY . .

# 6. Prisma 클라이언트 생성
RUN npx prisma generate

# 7. 빌드 (Next.js -> .next/standalone)
# DATABASE_URL은 빌드 타임에 Prisma 초기화용으로만 사용 (런타임은 .env 파일 사용)
ARG DATABASE_URL=postgresql://postgres:pi@127.0.0.1:5432/travel_youtube_map
RUN DATABASE_URL=${DATABASE_URL} npm run build

# 8. 서버 실행 포트 알려주기
EXPOSE 3000

# 9. 서버 실행 명령어 (standalone 모드)
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", ".next/standalone/server.js"]
