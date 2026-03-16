#!/bin/bash

if [[ -f $HOME/.profile ]]; then
  . $HOME/.profile;
fi

TODAY=$(date -I)
LOGS_CHECKED=""

function log {
  msg=$1
  level=${2:-LOG}

  mkdir -p "$HOME/logs"
  log_file="$HOME/logs/$TODAY.log"

  if [[ -z "$LOGS_CHECKED" ]]; then
    find "$HOME/logs" -name "*.log" -mtime +10 -delete
    LOGS_CHECKED="true"
  fi

  printf "%s [%s] %s\n" "$(date -Iseconds)" "$level" "$msg" >> "$log_file"
}

function notify_mattermost {
  if [[ -z "$MATTERMOST_WEBHOOK" ]]; then
    return;
  fi

  text=$1
  log "Notifying mattermost with '$text'" 'DEBUG'

  attachment="{
    \"text\": \"$text\",
    \"color\": \"#dc2626\",
    \"title\": \":alert: Import LOLFI en échec\",
    \"fields\": [
      {
        \"title\": \"CC\",
        \"value\": \"- @jquagliatini\n- @remi.boureau.lienard\"
      }
    ]
  }";

  if curl --retry-max-time 30 --silent \
    --data "{ \"attachments\": [$attachment] }" \
    --header 'Content-type: application/json' \
    -X POST \
    "$MATTERMOST_WEBHOOK";
  then
    log "Notified mattermost successfully" 'DEBUG'
  else
    log "Failed to notify mattermost" 'ERROR'
  fi
}

function fail {
  message=$1;

  notify_mattermost "$message"

  log "$message" 'ERROR'
  return 1;
}

if [[ -z "$MATTERMOST_WEBHOOK" ]]; then
  return $(fail "cannot notify mattermost");
fi

if ! which curl; then
  return $(fail "unknown command 'curl'");
fi

for env in "$SCALINGO_PREPROD_API_KEY" "$SCALINGO_PROD_API_KEY" "$SCALINGO_PREPROD" "$SCALINGO_PROD" ; do
  if [[ -z $env ]]; then
    return $(fail "impossible de contacter scalingo")
  fi
done

for env in "$DATA_PATH_PROD" "$DATA_PATH_PREPROD"; do
  if [[ ! -d "$env" ]]; then
    return $(fail "fichiers introuvables")
  fi
done

function run {
  env=$1
  if [[ $env != 'PROD' && $env != 'PREPROD' ]]; then
    return $(fail "Unknown environment $env");
  fi

  mkdir -p "$HOME/ftp_history"
  if [[ -f "$HOME/$TODAY.$env.success" ]]; then
    log "Already succeeded. Exiting"
    return;
  fi

  ATTEMPT_COUNT=$(cat "$HOME/$TODAY.$env.attempt" 2>/dev/null)
  ATTEMPT_COUNT=${ATTEMPT_COUNT:1}

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
  for filename in $(ls -rt "$path"/*); do
    log "sending $filename to $env"

    index=$(( index + 1 ))
    if [[ $index -gt 1 ]]; then sleep 1; fi

    if curl --silent --fail --retry-max-time 120 \
      --header "Authentication: Bearer ${token}" \
      --form "file=@./${filename};type=application/pkcs7-mime" \
      "$base_url"/api/ingest/v1/lolfi;
    then
      name=$(basename "$filename")
      mv "$filename" "$HOME/ftp_history/$name"
    else
      failed=$(( failed + 1 ))
      log "failed sending $filename" 'ERROR'
    fi
  done

  if [[ $failed -eq 0 ]]; then
    rm "$HOME"/*".$env."{attempt,success}
    date -Iseconds > "$HOME/$TODAY.$env.success"
    return
  else
    if [[ $ATTEMPT_COUNT -eq 3 ]]; then
      log "Failed more than 3 times" 'ERROR'

      return $(fail "Plus de 3 échecs à l'import")
    fi

    log "Failed $(( ATTEMPT_COUNT )) times" 'ERROR'
    echo $(( ATTEMPT_COUNT + 1 )) > "$HOME/$TODAY.$env".attempt
  fi
}


status_preprod=$(run 'PREPROD');
status_prod=$(run 'PROD');

if [[ $status_preprod -gt 0 ]]; then exit 1; fi
if [[ $status_prod -gt 0 ]]; then exit 1; fi