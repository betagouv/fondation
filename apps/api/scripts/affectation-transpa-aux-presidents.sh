#!/bin/bash

scalingo \
    --region $SCALINGO_APP_REGION \
    --app $SCALINGO_APP_NAME \
    run \
    "node ./apps/api/dist/cli/affectation-transpa-aux-presidents.js"
