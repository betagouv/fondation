#!/bin/bash

# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #
#   Script géré par le CSM (Conseil Supérieur de la Magistrature)   #
# # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # # #

if [[ -f $HOME/.profile ]]; then
  . $HOME/.profile;
fi

BASEDIR="$HOME/lolfi2fondation"
TODAY=$(date -I)
LOGS_CHECKED=""

mkdir -p "$BASEDIR"

function log {
  msg=$1
  level=${2:-LOG}

  mkdir -p "$BASEDIR/logs"
  log_file="$BASEDIR/logs/$TODAY.log"

  if [[ -z "$LOGS_CHECKED" ]]; then
    find "$BASEDIR/logs" -name "*.log" -mtime +10 -delete
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

function notify_mattermost {
  env=$1

  if [[ $env = 'PROD' ]]; then
    webhook="$SCALINGO_PROD"
    token="$SCALINGO_PROD_API_KEY"
  elif [[ $env = 'PREPROD' ]]; then
    webhook="$SCALINGO_PREPROD"
    token="$SCALINGO_PREPROD_API_KEY"
  else
    log "environnement inconnu '$env', alerte non envoyée" 'ERROR'
    return 1
  fi

  text=$2
  log "Notifying mattermost with '$text'" 'DEBUG'

  attachment="{
    \"text\": \"$text\",
    \"color\": \"#dc2626\",
    \"title\": \":alert: Import LOLFI en échec\",
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
    --header "Authorization: Bearer $token" \
    -X POST "$webhook/api/f/m";
  then
    log "Notified mattermost successfully" 'DEBUG'
  else
    log "Failed to notify mattermost" 'ERROR'
  fi
}

if ! which curl > /dev/null; then
  log "commande inconnue 'curl'" 'FATAL'
  exit 1;
fi

for env in "$DATA_PATH_PROD" "$DATA_PATH_PREPROD"; do
  if [[ ! -d "$env" ]]; then
    log "fichiers introuvables" 'FATAL'
    return 1;
  fi
done

function run {
  env=$1
  if [[ $env != 'PROD' && $env != 'PREPROD' ]]; then
    log "environnement inconnu $env" 'FATAL'
    return 1;
  fi

  mkdir -p "$BASEDIR/ftp_history"
  if [[ -f "$BASEDIR/$TODAY.$env.success" ]]; then
    log "Already succeeded. Exiting"
    return;
  fi

  ATTEMPT_COUNT=$(cat "$BASEDIR/$TODAY.$env.attempt" 2>/dev/null)
  ATTEMPT_COUNT=${ATTEMPT_COUNT:-1}

  if [[ $env == 'PROD' ]]; then
    base_url=$SCALINGO_PROD
    token=$SCALINGO_PROD_API_KEY
    path=$DATA_PATH_PROD
  elif [[ $env == 'PREPROD' ]]; then
    base_url=$SCALINGO_PREPROD
    token=$SCALINGO_PREPROD_API_KEY
    path=$DATA_PATH_PREPROD
  fi

  index=0
  failed=0
  for filename in $(ls -rt "$path"/* | head -n1); do
    log "sending $filename to $env"

    index=$(( index + 1 ))
    if [[ $index -gt 1 ]]; then sleep 1; fi

    if curl --silent --fail --retry-max-time 120 \
      --header "Authorization: Bearer ${token}" \
      --form "file=@${filename};type=application/pkcs7-mime" \
      "$base_url"/api/ingest/v1/lolfi;
    then
      name=$(basename "$filename")
      mkdir -p "$BASEDIR/ftp_history/$env/$TODAY"
      mv "$filename" "$BASEDIR/ftp_history/$env/$TODAY"
    else
      failed=$(( failed + 1 ))
      log "failed sending $filename" 'ERROR'
    fi
  done

  if [[ $failed -eq 0 ]]; then
    rm "$BASEDIR"/*".$env."{attempt,success}
    date -Iseconds > "$BASEDIR/$TODAY.$env.success"
    return
  else
    if [[ $ATTEMPT_COUNT -eq 3 ]]; then
      log "Plus de 3 échecs" 'ERROR'

      notify_mattermost $env "Plus de 3 échecs à l'import"
      return 1;
    fi

    log "$(( ATTEMPT_COUNT )) tentatives en échec" 'ERROR'
    echo $(( ATTEMPT_COUNT + 1 )) > "$BASEDIR/$TODAY.$env".attempt
  fi

  return 0
}


run 'PREPROD'; status_preprod=$?
run 'PROD'; status_prod=$?

if [[ $status_preprod -ne 0 || $status_prod -ne 0 ]]; then exit 1; fi
