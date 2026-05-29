#!/usr/bin/env bash

[[ -n "$DATABASE_URL" ]] || { echo "Missing DATABASE_URL"; exit 1; }

./scripts/sheetjs.sh && \
  pnpm --filter api... install --frozen-lockfile --ignore-scripts && \
  pnpm --filter api exec prisma migrate --config prisma.config.ts deploy && \
  pnpm --filter api exec prisma generate --config prisma.config.ts --generator client --sql && \
  pnpm --filter api... run build

[[ -n "$SENTRY_AUTH_TOKEN" ]] && \
  pnpm run --filter api sentry \
    sourcemaps inject --org betagouv --project fondation_api ./dist && \
  pnpm run --filter api sentry \
    sourcemaps upload --org betagouv --project fondation_api ./dist

## @see apps/api/package.json#scripts.postinstall
postinstall="bash apps/api/scripts/postinstall.sh" && \
temp=$(basename $(mktemp -d)) && \
  mkdir -p "$temp" && \
  find {apps/api,packages/shared-models}/dist \
    -iname '*.d.ts' -type f -delete \
    -or -iname '*.map' -type f -delete \
    -or -iname '*.tsbuildinfo' -type f -delete && \
  mv bin pnpm-lock.yaml pnpm-workspace.yaml vendor "$temp" && \
  mkdir -p "$temp/apps/api" && \
  mkdir -p "$temp/apps/api/scripts" && \
  mv apps/api/dist "$temp/apps/api" && \
  mv apps/api/scripts/postinstall.sh $temp/apps/api/scripts && \
  mkdir -p "$temp/packages/shared-models" && \
  mv packages/shared-models/dist "$temp/packages/shared-models" && \
  jq ".scripts = {build: \"$postinstall\"} | del(.jest)" package.json > "$temp/package.json" && \
  jq 'del(.scripts,.jest)' apps/api/package.json > "$temp/apps/api/package.json" && \
  jq 'del(.scripts,.types)' packages/shared-models/package.json > "$temp/packages/shared-models/package.json" && \
  mv apps/api/scalingo/{.buildpacks,Procfile,Aptfile} "$temp" && \
  tar -czf api-scalingo.tar.gz "$temp"
