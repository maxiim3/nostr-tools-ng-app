FROM node:22 AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

FROM oven/bun:1.2.13

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production --ignore-scripts

COPY server.mjs ./
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["bun", "server.mjs"]
