FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/package.json
COPY web/package.json web/package.json
RUN npm ci

COPY packages/shared packages/shared
COPY web web

# Same-origin deployment (nginx reverse-proxies /api to the backend container), so the
# default is a relative path - no domain baked into the bundle, no CORS needed.
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run shared:build && npm run build -w web

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/web/dist /usr/share/nginx/html

EXPOSE 80
