FROM node:22-alpine AS base

WORKDIR /app

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

# Build stage
FROM base AS builder

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

ARG DATABASE_URL="mysql://root:password@localhost:3306/visual"
ENV DATABASE_URL=$DATABASE_URL

COPY . .

RUN pnpm prisma:generate

RUN pnpm build

# Production stage
FROM base AS runner

ENV NODE_ENV=production
ENV LISTEN_HOST=0.0.0.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

COPY --from=builder /app/node_modules ./node_modules

RUN pnpm prune --prod

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server.mjs ./server.mjs
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/src ./src

RUN mkdir -p logs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget --no-verbose --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["pnpm", "start"]
