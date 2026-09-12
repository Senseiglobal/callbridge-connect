FROM oven/bun:1 AS web-build
WORKDIR /build
COPY apps/typescript/callbridge-web/package.json apps/typescript/callbridge-web/bun.lock ./
RUN bun install --frozen-lockfile
COPY apps/typescript/callbridge-web/ ./
ENV VITE_CALLBRIDGE_API_URL=/
RUN bun run build

FROM node:22-bookworm-slim AS node-runtime
FROM python:3.12-slim-bookworm
WORKDIR /app
COPY --from=node-runtime /usr/local/bin/node /usr/local/bin/node
COPY apps/python/callbridge/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY apps/python/callbridge/ ./backend/
COPY --from=web-build /build/.output/ ./web/
COPY scripts/serve.mjs ./scripts/serve.mjs
RUN useradd --create-home appuser && mkdir /app/data && chown appuser:appuser /app/data
USER appuser
ENV PORT=8080 CALLE_DRY_RUN=true CALLBRIDGE_PUBLIC_DEMO=true CALLBRIDGE_DB=/app/data/callbridge.db PYTHONUNBUFFERED=1
EXPOSE 8080
CMD ["node", "scripts/serve.mjs"]
