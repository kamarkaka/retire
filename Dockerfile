# Production image: static app + server-managed market data (monthly refresh).
FROM node:24-bookworm-slim AS build
WORKDIR /app
COPY package.json package-lock.json .node-version ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-bookworm-slim
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl python3 \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/src ./src
COPY --from=build /app/verification/reference/check-refresh-source.py /app/verification/reference/read-historical-source.py ./verification/reference/
COPY --from=build /app/package.json ./
ENV PORT=8080 DATA_DIR=/data MARKET_DATA_REFRESH_HOURS=720 BASE_PATH=/
VOLUME /data
EXPOSE 8080
HEALTHCHECK --interval=60s --timeout=5s CMD curl -f http://127.0.0.1:${PORT}/ || exit 1
CMD ["node_modules/.bin/tsx", "scripts/serve.ts"]
