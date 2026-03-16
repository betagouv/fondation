#!/bin/bash

###
# https://doc.scalingo.com/platform/app/secret-file-in-app
###

mkdir -p $(dirname "$LOLFI_CRYPTO_PRIVKEY_PATH");
mkdir -p /tmp/fondation/{input,output};

echo $SECRET_LOLFI_PRIVATE_KEY | base64 -d > $LOLFI_CRYPTO_PRIVKEY_PATH;

cd apps/api;
node ./dist/src/main.js