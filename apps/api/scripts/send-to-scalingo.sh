#!/bin/bash

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
#   Script géré par le CSM (Conseil Supérieur de la Magistrature)   #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

ENV_FILE=$1

if [[ ! -f "$ENV_FILE" ]]; then
  printf "usage: %s <fichier d'environnement>\n" "$0" >&2
  exit 1
fi

. "$ENV_FILE"

BASEDIR="$HOME/lolfi2fondation"
LOGS_DIR="$BASEDIR/logs/$ENV_LABEL"
TODAY=$(date -I)
LOGS_CHECKED=""

mkdir -p "$LOGS_DIR"

function log {
  msg=$1
  level=${2:-LOG}

  log_file="$LOGS_DIR/$TODAY.log"

  if [[ -z "$LOGS_CHECKED" ]]; then
    find "$LOGS_DIR" -name "*.log" -mtime +10 -delete
    LOGS_CHECKED="true"
  fi

  if [[ "$level" = 'LOG' ]]; then
    color="\033[0;1;32m"
  elif [[ "$level" = 'ERROR' ]]; then
    color="\033[0;1;31m"
  elif [[ "$level" = 'FATAL' ]]; then
    color="\033[45;1;37m"
  fi

  printf "%s [%s] %s\n" "$(date -Iseconds)" "$level" "$msg" >> "$log_file"
  printf "%s %b[%s]%b %s\n" "$(date -Iseconds)" "$color" "$level" "\033[0m" "$msg"
}

function script_digest {
  if command -v sha256sum > /dev/null; then
    sha256sum "$0" | cut -c1-12
  else
    shasum -a 256 "$0" | cut -c1-12
  fi
}

function notify_mattermost {
  text=$1
  log "Notifying mattermost with '$text'" 'DEBUG'

  attachment="{
    \"text\": \"$text\",
    \"color\": \"#dc2626\",
    \"title\": \":alert: Import LOLFI en échec ($ENV_LABEL)\",
    \"fields\": [
      {
        \"title\": \"CC\",
        \"value\": \"- @jessica.kossibale\n- @remi.boureau.lienard\"
      }
    ]
  }";

  if curl --retry 3 --retry-max-time 30 --silent --show-error --fail \
    --data "{ \"attachments\": [$attachment] }" \
    --header 'Content-type: application/json' \
    --header "Authorization: Bearer $SCALINGO_TOKEN" \
    -X POST "$SCALINGO_URL/api/f/m";
  then
    log "Notified mattermost successfully" 'DEBUG'
  else
    log "Failed to notify mattermost" 'ERROR'
  fi
}

for var in ENV_LABEL SCALINGO_URL SCALINGO_TOKEN DATA_PATH; do
  if [[ -z "${!var}" ]]; then
    log "$var manquant dans $ENV_FILE" 'FATAL'
    exit 1
  fi
done

if ! which curl > /dev/null; then
  log "commande inconnue 'curl'" 'FATAL'
  exit 1
fi

if [[ ! -d "$DATA_PATH" ]]; then
  log "dépôt introuvable: $DATA_PATH" 'FATAL'
  exit 1
fi

function run {
  mkdir -p "$BASEDIR/ftp_history"
  if [[ -f "$BASEDIR/$TODAY.$ENV_LABEL.success" ]]; then
    log "Already succeeded. Exiting"
    return
  fi

  ATTEMPT_COUNT=$(cat "$BASEDIR/$TODAY.$ENV_LABEL.attempt" 2>/dev/null)
  ATTEMPT_COUNT=${ATTEMPT_COUNT:-1}

  failed=0
  for filename in $(ls -rt "$DATA_PATH"/* | head -n1); do
    log "sending $filename to $ENV_LABEL"

    if curl --silent --fail --retry-max-time 120 \
      --header "Authorization: Bearer $SCALINGO_TOKEN" \
      --header "X-Script-Digest: $(script_digest)" \
      --form "file=@${filename};type=application/pkcs7-mime" \
      "$SCALINGO_URL/api/ingest/v1/lolfi";
    then
      mkdir -p "$BASEDIR/ftp_history/$ENV_LABEL/$TODAY"
      mv "$filename" "$BASEDIR/ftp_history/$ENV_LABEL/$TODAY"
    else
      failed=$(( failed + 1 ))
      log "failed sending $filename" 'ERROR'
    fi
  done

  if [[ $failed -eq 0 ]]; then
    rm -f "$BASEDIR"/*".$ENV_LABEL."{attempt,success}
    date -Iseconds > "$BASEDIR/$TODAY.$ENV_LABEL.success"
    return
  fi

  if [[ $ATTEMPT_COUNT -eq 3 ]]; then
    log "Plus de 3 échecs" 'ERROR'
    notify_mattermost "Plus de 3 échecs à l'import"
    return 1
  fi

  log "$(( ATTEMPT_COUNT )) tentatives en échec" 'ERROR'
  echo $(( ATTEMPT_COUNT + 1 )) > "$BASEDIR/$TODAY.$ENV_LABEL.attempt"

  return 0
}

run
