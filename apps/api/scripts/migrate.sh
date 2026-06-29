#!/usr/bin/env bash
set -euo pipefail

###
# TODO:(restricted_user)
#  scalingo does not allow to create roles
#  - We can't create a NON LOGIN role (group) with restricted access to the db.
#  - We can't rely on inheritance to create dynamic roles
#  - in addition, the CLI does not allow to provide a password without an interactive TTY,
#  preventing to generate a role on the fly
###

for var in SCALINGO_APP_REGION SCALINGO_API_APP_NAME SCALINGO_SSH_KEY SCALINGO_API_TOKEN; do
  [[ -n "${!var:-}" ]] || { echo "missing $var"; exit 1; }
done

command -v scalingo > /dev/null || { echo "unknown command scalingo"; exit 1; }
command -v pnpm > /dev/null || { echo "unknown command pnpm"; exit 1; }

mkdir -p .ssh
echo "$SCALINGO_SSH_KEY" > .ssh/scalingo
chmod 600 .ssh/scalingo

LOCAL_PORT=10000
scalingo \
  --region "$SCALINGO_APP_REGION" \
  --app "$SCALINGO_API_APP_NAME" \
  db-tunnel SCALINGO_POSTGRESQL_URL \
  --identity .ssh/scalingo \
  --port "$LOCAL_PORT" > /dev/null &
TUNNEL_PID=$!
trap "kill $TUNNEL_PID 2>/dev/null; rm -f updated_url" EXIT

ADMIN_DATABASE_URL=$(scalingo --app "$SCALINGO_API_APP_NAME" --region "$SCALINGO_APP_REGION" env-get SCALINGO_POSTGRESQL_URL)

# TODO:(restricted_user)
# ROLE_NAME="fon_user_$(openssl rand -base64 6 | tr '+/' '-_' | tr -d '=')"
# ROLE_PASSWORD="$(openssl rand -base64 25 | tr '+/' '-_' | tr -d '=')"

pnpm --filter api... install --frozen-lockfile --ignore-scripts

DB_URL_PARTS="${ADMIN_DATABASE_URL#*://}"
DB_HOST_PATH="${DB_URL_PARTS#*@}"

DB_NAME="${DB_HOST_PATH#*/}"
DB_USERPASS="${DB_URL_PARTS%%@*}"
DATABASE_URL="postgresql://${DB_USERPASS}@localhost:${LOCAL_PORT}/${DB_NAME}"

run_prisma() {
  DATABASE_URL="$DATABASE_URL" pnpm --filter api exec prisma --config ./prisma.config.ts "$@"
}

# TODO:(restricted_user)
# scalingo \
#   --region "$SCALINGO_APP_REGION" \
#   --app "$SCALINGO_API_APP_NAME" \
#   --addon "$SCALINGO_DB_ID" \
#   database-users-create "$ROLE_NAME"

run_prisma migrate resolve --applied 00_squash 2>/dev/null || \
  echo 'Already applied 00_squash'

run_prisma migrate diff --from-url="$DATABASE_URL" --to-schema-datamodel=./prisma | tee -a "${GITHUB_STEP_SUMMARY:-/dev/null}"

# TODO:(restricted_user)
# run_prisma generate --generator rotateRoles
# sed -i 's|fon_user|$ROLE_NAME|' apps/api/scripts/gen-group-role.sql
# run_prisma db execute --schema ./prisma --file ./scripts/gen-group-role.sql

run_prisma migrate deploy

# TODO:(restricted_user)
# UPDATED_URL="postgresql://${ROLE_NAME}:${ROLE_PASSWORD}@${DB_HOST_PATH}"
# echo "$UPDATED_URL" > updated_url
# scalingo \
#   --region "$SCALINGO_APP_REGION" \
#   --app "$SCALINGO_API_APP_NAME" \
#   env-set "DATABASE_URL=$(cat updated_url)"
