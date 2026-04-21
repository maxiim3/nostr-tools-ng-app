FROM node:22-slim

WORKDIR /app

RUN npm install -g bun@1.2.13

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --ignore-scripts

COPY . .
RUN bun run build

EXPOSE 3000
CMD ["bun", "server.mjs"]
