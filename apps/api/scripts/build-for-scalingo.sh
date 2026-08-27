#!/usr/bin/env bash

[[ -n "$DATABASE_URL" ]] || { echo "Missing DATABASE_URL"; exit 1; }

pnpm --filter api... install --frozen-lockfile --ignore-scripts && \
  pnpm --filter api exec prisma migrate --config prisma.config.ts deploy && \
  pnpm --filter api exec prisma generate --config prisma.config.ts --generator client --sql && \
  pnpm --filter api... run build

[[ -n "$SENTRY_AUTH_TOKEN" ]] && \
  pnpm run --filter api sentry \
    sourcemaps inject --org betagouv --project fondation_api ./dist && \
  pnpm run --filter api sentry \
    sourcemaps upload --org betagouv --project fondation_api ./dist

temp=$(basename $(mktemp -d)) && \
  mkdir -p "$temp" && \
  find apps/api/dist packages/documents-assets/dist \
    -iname '*.d.ts' -type f -delete \
    -or -iname '*.map' -type f -delete \
    -or -iname '*.tsbuildinfo' -type f -delete && \
  mv bin pnpm-lock.yaml pnpm-workspace.yaml vendor "$temp" && \
  mkdir -p "$temp/apps/api" "$temp/packages/documents-assets" && \
  mv apps/api/dist "$temp/apps/api" && \
  mv packages/documents-assets/{dist,assets} "$temp/packages/documents-assets" && \
  jq 'del(.scripts)' package.json > "$temp/package.json" && \
  jq 'del(.scripts)' apps/api/package.json > "$temp/apps/api/package.json" && \
  jq 'del(.scripts)' packages/documents-assets/package.json \
    > "$temp/packages/documents-assets/package.json" && \
  mv apps/api/scalingo/{.buildpacks,Procfile} "$temp" && \
  tar -czf api-scalingo.tar.gz "$temp"
