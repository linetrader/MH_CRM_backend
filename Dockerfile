# 1단계: 빌드 스테이지
FROM node:20 AS builder
WORKDIR /app

# 의존성 설치
COPY package*.json ./
RUN npm install

# 전체 소스 복사 및 빌드
COPY . .
RUN npm run build

# 2단계: 실행 스테이지
FROM node:20-slim
WORKDIR /app

# 빌드 결과 및 실행에 필요한 파일만 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 포트는 docker-compose에서 지정하므로 생략 가능
CMD ["node", "dist/main"]
