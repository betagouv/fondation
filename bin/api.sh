#!/bin/bash

###
# https://doc.scalingo.com/platform/app/secret-file-in-app
###

# a key protected by a passphrase imports without error and only fails when decrypting
function import_pgp_key {
  [ -n "$SECRET_LOLFI_PGP_PRIVATE_KEY" ] || return 0

  local gpg=(gpg --homedir "$LOLFI_GNUPG_HOME" --batch --quiet)
  mkdir -p -m 700 "$LOLFI_GNUPG_HOME" && \
    echo "$SECRET_LOLFI_PGP_PRIVATE_KEY" | base64 -d | "${gpg[@]}" --import && \
    local fingerprint=$("${gpg[@]}" --list-secret-keys --with-colons | awk -F: '/^fpr/ { print $10; exit }') && \
    echo ok | "${gpg[@]}" --trust-model always --recipient "$fingerprint" --encrypt | "${gpg[@]}" --decrypt > /dev/null
}

mkdir -p $(dirname "$LOLFI_CRYPTO_PRIVKEY_PATH") && \
  mkdir -p /tmp/fondation/{input,output} && \
  echo $SECRET_LOLFI_PRIVATE_KEY | base64 -d > $LOLFI_CRYPTO_PRIVKEY_PATH && \
  { import_pgp_key || echo "PGP key not usable: the PGP archives will not be decrypted" >&2; } && \
  cd apps/api && \
  node ./dist/main.js
