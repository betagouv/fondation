#!/bin/bash

NC='\033[0m'
BG_RED='\033[0;101m'
RED='\033[0;31m'

if [[ -z $DATABASE_ADMIN_URL ]]; then
  echo -e "$(date -Iseconds) ${BG_RED}[FATAL]${NC} No ADMIN database available";
  exit 1;
fi;

API_ROOT='/var/run/fondation-api'
VITE_FAVICON='favicon'

if [[ "$APP" =~ 'production' ]]; then
  rm apps/client/public/favicon.staging.svg
else
  mv apps/client/public/favicon.staging.svg \
    apps/client/public/favicon.svg
fi

pnpm run --filter shared-models build && 
  pnpm run --filter client build --emptyOutDir --outDir "$PWD/dist" && \

  mkdir -p /var/run/fondation && \
  # TODO: add prisma generation
  pnpm run --filter api build;

[[ -n "$SENTRY_AUTH_TOKEN" ]] && \
  pnpm run --filter api sentry \
    sourcemaps inject --org betagouv --project fondation_api ./dist && \
  pnpm run --filter api sentry --url https://sentry.incubateur.net \
    sourcemaps upload --org betagouv --project fondation_api ./dist;

find apps/api/dist -iname '*.d.ts' -type f -or -iname '*.map' -type f -delete && \
  pnpm deploy --filter api --prod "$API_ROOT" && \
  rm -rf .claude .github .husky apps bin node_modules \
    packages scalingo scripts .gitignore .nvmrc CLAUDE.md package.json \
    pnpm-lock.yaml pnpm-workspace.yaml README.md
