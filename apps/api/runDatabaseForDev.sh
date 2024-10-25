docker compose -f ./docker-compose-postgresql-dev.yaml down --volumes
docker compose -f ./docker-compose-postgresql-dev.yaml down --remove-orphans
docker compose -f ./docker-compose-postgresql-dev.yaml --env-file ./.env.docker up
