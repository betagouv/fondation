docker compose -f ./docker-compose-dev.yaml down --volumes
docker compose -f ./docker-compose-dev.yaml down --remove-orphans
docker compose -f ./docker-compose-dev.yaml --env-file ./.env.docker up
