# Objectif de Fondation

 Donner au CSM (Conseil Supérieur de la Magistrature) les moyens d'un travail efficace et de qualité afin de concourir à la continuité du fonctionnement de l'institution judiciaire et de contribuer à une RH vertueuse du corps de la magistrature. 


# Procédure d'installation de l'application

1. Installation des dépendances

Dans un terminal, se placer à la racine du projet et jouer la commande suivante d'installation des dépendances.

```bash
pnpm install
```

2. Créer un fichier `.env` dans le dossier `apps/api`, un fichier .env.example est disponible dans le dossier `apps/api`.
En local, seule la variable COOKIE_SECRET est obligatoire. Renseignez celle-ci avec un mot de passe fort.

```bash 
COOKIE_SECRET=
SCW_ACCESS_KEY=
SCW_SECRET_KEY=
SENTRY_DSN=
DEPLOY_ENV=
```

3. Installation de la base de données

Jouez le script suivant : runDatabaseForDev.sh

```bash
./runDatabaseForDev.sh

docker compose -f ./docker-compose-dev.yaml down --volumes
docker compose -f ./docker-compose-dev.yaml down --remove-orphans
docker compose -f ./docker-compose-dev.yaml --env-file ./.env.docker up
```

Ce script a pour effet de supprimer la base de données existante sur votre poste local et de la recréer à partir d'un fichier de seed.
Il met en place également un MinIO pour la gestion des fichiers dont les accès se trouvent dans les fichiers de configuration.

```bash
services:
  postgres:
    container_name: postgres
    image: 'postgres:13.2'
    ports:
      - '5441:5432'
    networks:
      - app_net
    environment:
      POSTGRES_USER: fondation
      POSTGRES_PASSWORD: secret
      POSTGRES_DB: fondation
    volumes:
      - fondation_postgres_data:/var/lib/postgresql/data

  minio:
    container_name: minio
    image: 'minio/minio:latest'
    entrypoint: sh -c "mkdir -p /data/sandbox-csm-fondation-reports-context && mkdir -p /data/sandbox-csm-fondation-transparences-context && minio server /data --console-address :9001"
    ports:
      - '9000:9000' # API
      - '9001:9001' # Web interface
    networks:
      - app_net
    environment:
      MINIO_ROOT_USER: fondation
      MINIO_ROOT_PASSWORD: fondation-secret
      MINIO_SSE_C_KEY: minio-encryption-key
    volumes:
      - fondation_minio:/data

```

4. Lancement de l'application

Se placer respectivement dans les dossiers `apps/api` et `client` et jouer les commandes suivantes :

```bash
pnpm dev
```

5. Accès à l'application

L'application est accessible à l'adresse suivante : http://localhost:5173.
Deux utilisateurs mockés sont présents dans la base de données :

- luc.denan@example.fr
- jean@example.fr

Le mot de passe est "password+00" pour les deux utilisateurs.
