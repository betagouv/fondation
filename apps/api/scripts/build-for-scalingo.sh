#!/usr/bin/env bash

temp=(mktemp) && \
  pnpm --filter api... install --frozen-lockfile --ignore-scripts && \
  pnpm --filter api prisma migrate --config prisma.config.ts deploy && \
  pnpm --filter api prisma generate --config prisma.config.ts --generator client --sql && \
  pnpm run --filter api... build

[[ -n "$SENTRY_AUTH_TOKEN" ]] && \
  pnpm run --filter api sentry \
    sourcemaps inject --org betagouv --project fondation_api ./dist && \
  pnpm run --filter api sentry \
    sourcemaps upload --org betagouv --project fondation_api ./dist

find apps/api/dist -iname '*.d.ts' -type f -or -iname '*.map' -type f -delete && \
  pnpm deploy --filter api --prod "$temp" && \
  mv "$temp"/scalingo/{.buildpacks,Procfile,Aptfile} "$temp" && \
  rmdir "$temp/scalingo" && \
  tar -czf api-scalingo.tar.gz "$temp"
