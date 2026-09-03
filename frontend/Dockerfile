FROM node:24.19.0-bookworm-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

FROM node:24.19.0-bookworm-slim AS builder

WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:24.19.0-bookworm-slim AS runtime

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    TZ=Asia/Seoul \
    LOG_PATH=/app/logs

RUN groupadd --system --gid 10001 portfolio \
    && useradd --system --uid 10001 --gid portfolio --home-dir /app --shell /usr/sbin/nologin portfolio \
    && mkdir -p /app/logs \
    && chown portfolio:portfolio /app/logs

COPY --from=builder --chown=portfolio:portfolio /app/public ./public
COPY --from=builder --chown=portfolio:portfolio /app/.next/standalone ./
COPY --from=builder --chown=portfolio:portfolio /app/.next/static ./.next/static

USER portfolio

EXPOSE 3000

CMD ["node", "server.js"]
