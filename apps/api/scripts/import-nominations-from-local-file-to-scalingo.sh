#!/bin/bash

source ./scripts/scalingo-utils.sh

upload_and_run_scalingo "$1" "./apps/api/dist/cli/import-nominations-from-local-file/run-import-nominations-from-local-file-cli.js"
