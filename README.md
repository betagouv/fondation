# Fondation

Donner au CSM (Conseil Supérieur de la Magistrature) les moyens d'un travail efficace et de qualité afin de concourir à la continuité du fonctionnement de l'institution judiciaire et de contribuer à une RH vertueuse du corps de la magistrature.

## Technologies

|         |      |
| ------- | ---- |
| node    | >=20 |
| pnpm    | >=10 |
| nestjs  | >=11 |
| reactjs | >=19 |

## Procédure d'installation de l'application

1. Installation des dépendances

```bash
pnpm install --frozen-lockfile
```

2. Copier le fichier `.env.example` vers `.env`

Le fichier .env.example contient toutes les variables nécessaires pour démarrer l'application localement.

3. Installation des bases de données

```
$ cd apps/api
$ docker compose --file ./test/docker-compose-test.yaml up -d
$ pnpm run prisma migrate deploy
```

pour la BDD de test:

```
$ npx dotenvx run -f .env.e2e -f .env -- pnpm run prisma migrate deploy
```

> [!WARNING]
> Pour le moment, il est très facile de lancer les tests sur la base locale, le mieux
> est d'utiliser le script dans le fichier package.json.

4. Lancement de l'application

Se placer respectivement dans les dossiers `apps/api` et `apps/client` et jouer les commandes suivantes :

```bash
pnpm dev
```

5. Accès à l'application

On peut très facilement créer un utilisateur en base de données en utilisant la commande suivante:

```
$ cd apps/api
$ pnpm run cli user register \
  --email jean@example.fr \
  --firstname Jean \
  --lastname Moulin \
  --gender MALE \
  --role MEMBRE_PARQUET
password: *****
repeat password: *****
```

Ce CLI est interactif et demandera les informations manquantes si nécessaires.
Il est recommandé de créer un membre commun, et un agent du secrétariat général.
