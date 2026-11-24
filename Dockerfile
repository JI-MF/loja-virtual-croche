
FROM node:24-bookworm-slim AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS deps

COPY package.json package-lock.json ./

RUN npm ci

FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules

COPY . .

ENV DATABASE_URL="mysql://build:build@localhost:3306/croche"

RUN npx prisma generate

RUN npm run build

FROM base AS migrate

COPY --from=deps /app/node_modules ./node_modules

COPY prisma ./prisma
COPY prisma7.config.ts ./prisma7.config.ts
COPY package.json ./package.json

CMD ["npx", "prisma", "migrate", "deploy"]

FROM base AS runner

ENV NODE_ENV=production

ENV NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

COPY --from=builder --chown=nextjs:nodejs /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/src/generated/prisma ./src/generated/prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
