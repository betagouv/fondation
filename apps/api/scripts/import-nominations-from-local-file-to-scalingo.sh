#!/bin/bash

# Check if a file path argument is provided
if [ -z "$1" ]; then
  echo "Usage: $0 <file-path>"
  exit 1
fi

# Get the full file path from the argument
FILE_PATH="$1"

# Extract the file name from the file path
FILE_NAME=$(basename "$FILE_PATH")

SCALINGO_FILE_PATH="/tmp/uploads/$FILE_NAME"

# Upload the file to Scalingo and run the import script
scalingo \
  --region $SCALINGO_APP_REGION \
  --app $SCALINGO_APP_NAME \
  run --file $FILE_PATH "node ./dist/cli/run-import-nominations-from-local-file-cli.js $SCALINGO_FILE_PATH"
