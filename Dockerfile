FROM node:20-alpine AS base

# 1. Dependensi
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# 2. Build
FROM base AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# Alat sekali-jalan (migrasi skema & data lama). Tidak ikut image produksi:
#   docker compose run --rm puskesmas_tools npx prisma migrate deploy
#   docker compose run --rm puskesmas_tools npx tsx scripts/migrate-legacy.ts
FROM base AS tools
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate

# 3. Runtime (stage terakhir = target default)
FROM base AS runner
RUN apk add --no-cache openssl
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup -S app && adduser -S app -G app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# Prisma client + engine hasil generate (pastikan ada walau tracing standalone melewatkannya).
# Prisma CLI sengaja tidak dibawa; migrasi skema dijalankan lewat stage "tools".
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client
# next/image menulis cache optimasi ke .next/cache; harus bisa ditulis user non-root.
RUN mkdir -p .next/cache && chown -R app:app .next/cache

USER app
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/login > /dev/null || exit 1
# Migrasi skema dijalankan terpisah sebelum start/update:
#   docker compose run --rm puskesmas_tools npx prisma migrate deploy
CMD ["node", "server.js"]
