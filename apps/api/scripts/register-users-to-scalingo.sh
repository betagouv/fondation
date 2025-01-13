#!/bin/bash

source ./scripts/scalingo-utils.sh

upload_and_run_scalingo "$1" "./apps/api/dist/src/identity-and-access-context/adapters/primary/nestjs/cli/user-registration/register-user.cli.js --from-json"
