#!/bin/bash

###
# WARNING: this script has not yet been tested in deployed environments.
###

NC='\033[0m'
BG_RED='\033[0;101m'
BG_GREEN='\033[0;102m'

if [[ -z "$DATABASE_ADMIN_URL" ]]; then 
  echo -e "$(date -Iseconds) ${BG_RED}[FATAL]${NC} Missing 'DATABASE_ADMIN_URL' envvar";
  exit 1;
fi

if [[ -z "$SCALINGO_APP" ]]; then 
  echo -e "$(date -Iseconds) ${BG_RED}[FATAL]${NC} Missing 'SCALINGO_APP' envvar";
  exit 1;
fi

if [[ -z "$SCALINGO_REGION" ]]; then 
  echo -e "$(date -Iseconds) ${BG_RED}[FATAL]${NC} Missing 'SCALINGO_REGION' envvar";
  exit 1;
fi

for app in scalingo psql openssl; do
  if ! which "$app" > /dev/null; then 
    echo -e "$(date -Iseconds) ${BG_RED}[FATAL]${NC} Missing $app command";
    exit 1;
  fi
done

pg_role_name="fon_$(openssl rand -base64 6)"
pg_password=$(openssl rand -base64 25)

existing_url=$(scalingo --app "$SCALINGO_APP" --region "$SCALINGO_REGION" env-get DATABASE_URL)
target=$(scalingo --app "$SCALINGO_APP" --region "$SCALINGO_REGION" env-get DATABASE_URL | \
  sed "s|://[^@]*@|://${pg_role_name}:${pg_password}@|")

scalingo --app "$SCALINGO_APP" --region "$SCALINGO_REGION" env-set DATABASE_URL="${target}"

for role in $(psql "$DATABASE_ADMIN_URL" --tuples-only --csv \
  --command="SELECT r.rolname FROM pg_catalog.pg_roles r INNER JOIN pg_catalog.pg_auth_members m ON m.roleid = r.oid WHERE r.rolcanlogin AND m.member = (SELECT oid FROM pg_catalog.pg_roles WHERE rolname = 'fon_group')")
do
  psql $DATABASE_ADMIN_URL --command="ALTER ROLE ${role} UNLOGIN"
done

pgsql $DATABASE_ADMIN_URL \
  --command="CREATE ROLE \"${pg_role_name}\" LOGIN PASSWORD '${pg_password}' NOINHERIT ROLE fon_role;"

echo -e "$(date -Iseconds) ${BG_GREEN}[SUCCESS]${NC} changed the current user to ${pg_role_name}";
