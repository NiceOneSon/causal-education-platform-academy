# 빌드 컨텍스트는 레포 루트다: docker build -f apps/api/Dockerfile .
FROM node:24-alpine
WORKDIR /repo
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY contracts/package.json contracts/
COPY integrations/learning/package.json integrations/learning/
COPY integrations/messaging/package.json integrations/messaging/
RUN npm ci --omit=dev --workspace=@academy/api --include-workspace-root=false && npm cache clean --force

COPY contracts/openapi contracts/openapi
COPY integrations/learning/src integrations/learning/src
COPY apps/api/src apps/api/src
COPY apps/api/modules apps/api/modules

USER node
EXPOSE 3000
# Node 24가 .ts 파일의 타입을 지우고 바로 실행한다 (빌드 단계 없음).
CMD ["node", "apps/api/src/server.ts"]
