# Fondation

Donner au CSM (Conseil Supérieur de la Magistrature) les moyens d'un travail efficace et de qualité afin de concourir à la continuité du fonctionnement de l'institution judiciaire et de contribuer à une RH vertueuse du corps de la magistrature.

## Technologies

|         |      |
| ------- | ---- |
| node    | >=20 |
| pnpm    | >=10 |
| nestjs  | >=11 |
| reactjs | >=19 |

## Bonnes pratiques

PNPM est configuré par défaut avec les options suivantes dans le fichier [pnpm-workspace.yaml](./pnpm-workspace.yaml):

```
preferFrozenLockfile: true  # N'installe que les dépendances du lockfile
ignoreDepScripts: true     # N'exécute pas les scripts hooked des dépendances (postinstall)
minimumReleaseAge: 10080   # Attends au moins 7 jours avant de proposer une dépendance à l'installation
```

Ces options visent à protéger l'installation de dépendances d'attaques par supply chain
(cf. [SHAI-HULUD 2](https://www.cert.ssi.gouv.fr/actualite/CERTFR-2025-ACT-051/))

> [!WARNING]
> Ces mesures n'empêchent pas la plus grande vigilance avant d'installer une dépendance.
> Chaque installation de dépendance doit être justifiée.

## Contribution

Les projets front et back utilisent des conventions légèrement différentes. Pour les expliciter
eslint et prettier ont chacun une configuration définie dans chaque projet.

Pour chaque pull request, on vérifie que le code proposé respecte ces conventions. Pour éviter des cycles de CI
inutiles, on peut utiliser le hook [husky](https://typicode.github.io/husky) `prepush` dans l'application en
utilisant `npx husky` pour l'installer.

Autrement à la racine du projet:

```ts
$ pnpm run prepush
$ pnpm run types:check; pnpm run lint:check; pnpm run format:check;
```

Globalement, configurer son IDE pour utiliser ces configuration est le mieux, mais le workspace PNPM
peut provoquer des conflits parfois.

## Procédure d'installation de l'application Back

Toutes les instructions ci-dessous se déroulent dans le dossier `apps/api`.

1. Installation des dépendances

```bash
pnpm install
```

2. Copier le fichier `.env.example` vers `.env`

Le fichier .env.example contient toutes les variables nécessaires pour démarrer l'application localement.

3. Installation des bases de données

```
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

## Génération du SDK front

Pour générer le code du contrat d'interface entre le front et le back, on utilise
[openapi](https://swagger.io/specification/) dans un mode _code-first_.

La spécification est générée directement depuis nos contrôleurs nest, grâce à

- [@nestjs/swagger](https://docs.nestjs.com/openapi/introduction)
- [nestjs-zod](https://www.npmjs.com/package/nestjs-zod/v/5.0.1)

Swagger UI est exposé par défaut sur [/openapi](http://localhost:3000/openapi).

Le SDK front est généré avec [@hey-api/openapi-ts](https://heyapi.dev/openapi-ts), et ces plugins:

- [typescript](https://heyapi.dev/openapi-ts/plugins/typescript)
- [sdk](https://heyapi.dev/openapi-ts/plugins/sdk)
- [client-fetch](https://heyapi.dev/openapi-ts/clients/fetch)

On ne génère _volontairement pas_ le client @tanstack/react-query puisque ce dernier n'offre
pas la fonctionnalité de _namespacing_ disponible dans le sdk directement.

La configuration de l'outil est disponible dans [apps/client/openapi-ts.config.ts](./apps/client/openapi-ts.config.ts).

### Générer le client

Pour mettre à jour le client, il faut démarrer le back

```
cd apps/api
pnpm run dev
```

Une fois disponible, on peut lancer le script de génération:

```
cd apps/client
pnpm run openapi:generate
```

openapi-ts utilise directement la spécification exposée par nest.

> [!NOTE]
> Le code généré est directement embarqué dans le dépôt de code pour faciliter les choses.

L'api est exploité dans des hooks custom qui retournent la `Query` ou la `Mutation`
de @tanstack/react-query dans le dossier [apps/client/src/queries](./apps/client/src/queries).

```ts
// apps/client/src/queries/auth.queries.ts
import { useQueryClient, useMutation } from '@tanstack/react-query';

/** convention d'utiliser $api en mode namespace */
import * as $api from '@api/sdk';

/** On expose un dictionnaire de fonctions pour générer les clés */
export const authKeys = {
  introspectSession: () => ['introspectSession'],
};

/** L'implémentation est laissée libre */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => $api.auth.logout(),
    onSuccess: () => queryClient.removeQueries({ queryKey: authKeys.introspectSession() }),
  });
}
```

Enfin, les types générés peuvent être utilisés au niveau des composants depuis `@api/types`.

```tsx
// apps/client/src/components/secretariat-general/membres/details/DetailsMember.tsx
import type { DetailedMemberDto } from '@api/types';
// ...
```
