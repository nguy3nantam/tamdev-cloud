# syntax=docker/dockerfile:1

# ---- Stage 1: build Astro site ----
FROM node:20-alpine AS build
WORKDIR /app

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

# Sinh PNG logo/favicon từ public/logo.svg
RUN node scripts/generate-icons.mjs

RUN npm run build

# ---- Stage 2: Node.js runtime ----
FROM node:20-alpine
WORKDIR /app

COPY package.json ./
COPY --from=build /app/node_modules /app/node_modules

COPY --from=build /app/dist /app/dist
COPY --from=build /app/src /app/src
COPY --from=build /app/public /app/public
COPY --from=build /app/scripts /app/scripts

ENV HOST=0.0.0.0
ENV PORT=80
ENV NODE_ENV=production

EXPOSE 80
CMD ["node", "./dist/server/entry.mjs"]
