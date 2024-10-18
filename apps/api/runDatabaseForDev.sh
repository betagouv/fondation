rm -rf ./docker-postgresql-data-for-dev
docker-compose -f ./docker-compose-postgresql-dev.yaml down --volumes
docker-compose -f ./docker-compose-postgresql-dev.yaml down --remove-orphans
docker-compose -f ./docker-compose-postgresql-dev.yaml up
