#!/bin/bash

upload_and_run_scalingo() {
    local FILE_PATH="$1"
    local SCALINGO_SCRIPT="$2"

    if [ -z "$FILE_PATH" ] || [ -z "$SCALINGO_SCRIPT" ]; then
        echo "Usage: upload_and_run_scalingo <file-path> <scalingo-script>"
        exit 1
    fi

    local FILE_NAME=$(basename "$FILE_PATH")
    local SCALINGO_FILE_PATH="/tmp/uploads/$FILE_NAME"

    scalingo \
        --region $SCALINGO_APP_REGION \
        --app $SCALINGO_APP_NAME \
        run \
        --file $FILE_PATH \
        "node $SCALINGO_SCRIPT $SCALINGO_FILE_PATH"
}
