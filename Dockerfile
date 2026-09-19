# syntax=docker/dockerfile:1

# ---- Stage 1: build Astro site ----
FROM node:20-alpine AS build
WORKDIR /app

# Dùng npm install (không cần package-lock.json) để repo clone từ GitHub
# cũng build được mà không yêu cầu lock file.
COPY package.json ./
RUN npm install

COPY astro.config.mjs tsconfig.json ./
COPY public/ public/
COPY src/ src/
COPY scripts/ scripts/

# Font hệ thống cho script tạo ảnh OG
RUN apk add --no-cache ttf-dejavu

# Sinh ảnh OG trước khi build
RUN node scripts/generate-og.mjs

RUN npm run build

# ---- Stage 2: nginx runtime ----
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY security-headers.conf /etc/nginx/security-headers.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
