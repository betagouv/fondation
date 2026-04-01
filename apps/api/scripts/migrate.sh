#!/usr/bin/env bash
set -euo pipefail

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
  db-tunnel SCALINGO_DATABASE_URL \
  --identity .ssh/scalingo \
  --port "$LOCAL_PORT" &
TUNNEL_PID=$!
trap "kill $TUNNEL_PID 2>/dev/null; rm -f updated_url" EXIT

ADMIN_DATABASE_URL=$(scalingo --app "$SCALINGO_API_APP_NAME" --region "$SCALINGO_APP_REGION" env-get SCALINGO_POSTGRESQL_URL)

ROLE_NAME="fon_$(openssl rand -base64 6 | tr '+/' '-_' | tr -d '=')"
ROLE_PASSWORD="$(openssl rand -base64 25)"

UNLOGIN=$(cat <<'SQL'
DO $$
DECLARE
  r TEXT;
BEGIN
  FOR r IN
    SELECT pg_roles.rolname
    FROM pg_catalog.pg_roles
    INNER JOIN pg_catalog.pg_auth_members ON pg_auth_members.roleid = pg_roles.oid
    WHERE pg_roles.rolcanlogin
      AND pg_auth_members.member = (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'fon_group')
  LOOP
    EXECUTE format('ALTER ROLE %I NOLOGIN', r);
  END LOOP;
END;
$$;
SQL
)

ROLE_SCRIPT="CREATE ROLE \"$ROLE_NAME\" LOGIN PASSWORD '$ROLE_PASSWORD' NOINHERIT ROLE \"fon_group\""

sed "s/COMMIT;/${UNLOGIN}\n\n${ROLE_SCRIPT}\n\nCOMMIT;/" \
  apps/api/scripts/gen-group-role.sql > apps/api/gen-group-role.sql

DB_URL_PARTS="${ADMIN_DATABASE_URL#*://}"
DB_HOST_PATH="${DB_URL_PARTS#*@}"
UPDATED_URL="postgresql://${ROLE_NAME}:${ROLE_PASSWORD}@${DB_HOST_PATH}"


pnpm --filter api... install --frozen-lockfile --ignore-scripts

run_prisma() {
  DATABASE_URL="$ADMIN_DATABASE_URL" pnpm --filter api prisma "$@"
}

run_prisma migrate diff --from-url="$ADMIN_DATABASE_URL" --to-schema-datamodel=./apps/api/prisma
run_prisma generate --generator rotateRoles
run_prisma db execute --schema ./prisma --file ./scripts/gen-group-role.sql
run_prisma migrate deploy

echo "$UPDATED_URL" > updated_url
scalingo \
  --region "$SCALINGO_APP_REGION" \
  --app "$SCALINGO_API_APP_NAME" \
  env-set "DATABASE_URL=$(cat updated_url)"
