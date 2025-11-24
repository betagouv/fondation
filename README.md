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
pnpm install
```

2. Copier le fichier `.env.example` vers `.env`

Le fichier .env.example contient toutes les variables nécessaires pour démarrer l'application localement.

3. Installation des bases de données

> [!WARNING]
> Le projet est en cours de migration vers [Prisma ORM](https://www.prisma.io/orm)
> mais utilise "historiquement" drizzle

```
$ cd apps/api
$ docker compose --file ./test/docker-compose-test.yaml up -d
$ pnpm run drizzle:migrate
```

4. Lancement de l'application

Se placer respectivement dans les dossiers `apps/api` et `apps/client` et jouer les commandes suivantes :

```bash
pnpm dev
```

5. Accès à l'application

_en utilisant le CLI_

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
Il est recommandé de créer un membre

_en utilisant le fichier de seed_

> [!WARNING]
> Faute d'une maintenance suffisante le fichier de seed est voué à disparaître

Il est possible de créer 2 profils en utilisant le script

L'application est accessible à l'adresse suivante : http://localhost:5173.
Deux utilisateurs mockés sont présents dans la base de données :

- luc.denan@example.fr
- jean@example.fr

Le mot de passe est "password+00" pour les deux utilisateurs.
