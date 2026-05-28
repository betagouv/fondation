#!/bin/bash

FILENAME='xlsx-0.20.3.tgz'
EXPECTED_HASH='8dc73fc3b00203e72d176e85b50938627c7b086e607c682e8d3c22c02bb99fe8'

if [[ -s "./vendor/$FILENAME" ]]; then
  exit 0
fi

echo -n "${EXPECTED_HASH}  ./vendor/${FILENAME}" > .hash

curl --silent -L -o "./vendor/$FILENAME" \
  "https://cdn.sheetjs.com/xlsx-0.20.3/$FILENAME"

if ! sha256sum --quiet --check .hash; then
  # rm .hash
  echo "sheetjs download failed, hash does not match";
  exit 1
fi;

#rm -f .hash
