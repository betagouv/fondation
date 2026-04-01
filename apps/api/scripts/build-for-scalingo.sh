#!/usr/bin/env bash

# Create folder to package the API production code
mkdir .tmp-build/

# Copy monorepo root files
cp -v \
  package.json \
  pnpm-lock.yaml \
  pnpm-workspace.yaml \
  .tmp-build/

# Copy shared packages
mkdir -v .tmp-build/packages/
cp -rv \
  packages/shared-models/ \
  .tmp-build/packages/shared-models/

# Copy api files needed for production
mkdir -pv .tmp-build/apps/api
cp -rv \
  apps/api/package.json \
  apps/api/prisma.config.ts \
  apps/api/prisma \
  apps/api/dist \
  .tmp-build/apps/api/

cp -v \
  apps/api/scalingo/.buildpacks \
  apps/api/scalingo/Procfile \
  apps/api/scalingo/Aptfile \
  .tmp-build/

# Make archive to upload the packaged built api
tar -czf api-scalingo.tar.gz .tmp-build
