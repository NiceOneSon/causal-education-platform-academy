# 빌드 컨텍스트는 레포 루트다: docker build -f apps/web/Dockerfile .
FROM node:24-alpine AS build
WORKDIR /repo
COPY package.json package-lock.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY contracts/package.json contracts/
COPY integrations/learning/package.json integrations/learning/
COPY integrations/messaging/package.json integrations/messaging/
RUN npm ci --workspace=@academy/web --include-workspace-root=false
COPY contracts contracts
COPY apps/web apps/web
RUN npm run build -w @academy/web

FROM nginx:1.29-alpine
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
EXPOSE 8080
