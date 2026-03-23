#!/bin/bash

###
# https://doc.scalingo.com/platform/app/secret-file-in-app
###

mkdir -p $(dirname "$LOLFI_CRYPTO_PRIVKEY_PATH");
mkdir -p /tmp/fondation/{input,output};

echo $SECRET_LOLFI_PRIVATE_KEY | base64 -d > $LOLFI_CRYPTO_PRIVKEY_PATH;

cd apps/api;


SOCKET_PATH=/var/run/fondation_api.sock
bin/start-nginx.sh node /var/run/fondation_api/src/main.js