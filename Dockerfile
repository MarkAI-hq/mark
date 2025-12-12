# ===============================
# Stage 1 — Builder
# ===============================
FROM node:22-bullseye AS builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY pnpm-workspace.yaml ./
COPY package.json pnpm-lock.yaml ./

RUN corepack enable && \
    corepack install -g pnpm@10.12.1 && \
    pnpm --version

RUN pnpm install --frozen-lockfile

COPY . .


RUN pnpm build

# ===============================
# Stage 2 — Production (Distroless)
# ===============================
FROM gcr.io/distroless/nodejs22-debian12 AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy standalone output
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000

# This is the correct CMD for distroless
CMD ["server.js"]