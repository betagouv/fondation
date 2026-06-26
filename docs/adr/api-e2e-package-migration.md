# Migration des tests e2e → `apps/api-e2e`

## Décision

Les tests e2e de l'API ont été migrés dans un package dédié `apps/api-e2e`, découplé du code source de l'API.

## Contexte

7 fichiers `*.e2e-spec.ts` coexistaient dans `apps/api/src/modules/` avec les problèmes suivants :

- Chaque spec démarrait sa propre instance NestJS → boilerplate répété
- Imports directs depuis `src/*` (alias vers `apps/api/src/`) → couplage fort
- Incohérence entre `AppModule.create()` et `Test.createTestingModule()`

## Architecture cible

### Serveur externe

Les tests s'exécutent contre le **même serveur externe** que les tests Playwright. Le package `api-e2e` ne démarre plus NestJS en interne.

```
pnpm start:e2e  →  API sur http://localhost:3000
pnpm -F api-e2e test
```

La variable d'environnement `API_URL` permet de cibler un autre serveur (CI, staging).

### Structure du package

```
apps/api-e2e/
├── assets/lodam/lodam_transparence.xlsx   # fixture LODAM
├── src/
│   ├── sdk.ts                             # Proxy SDK auto-injectant le client
│   ├── fixtures.ts                        # fixtures Vitest (baseUrl, adminSdk, memberSdk)
│   ├── fixtures/
│   │   ├── auth.fixture.ts                # registerUser + registerAndLogin via HTTP
│   │   └── session.fixture.ts             # createSession via supertest (multipart)
│   ├── generated/api/                     # client généré par hey-api (ne pas éditer)
│   └── specs/
│       ├── simple-auth.e2e-spec.ts
│       ├── lolfi.e2e-spec.ts
│       ├── members.e2e-spec.ts
│       ├── session.e2e-spec.ts
│       ├── affectation.e2e-spec.ts
│       ├── docs.e2e-spec.ts
│       └── report.e2e-spec.ts
├── openapi-ts.config.ts
├── vitest.config.ts
├── tsconfig.json
└── package.json
```

### Règles d'import

- **Interdit** : importer depuis `apps/api/src/` ou via un alias `src/*`
- **Autorisé** : `shared-models`, `lolfi`, `supertest`, packages `@hey-api/*`, Node.js standard

### SDK Proxy

```ts
// src/sdk.ts
import * as api from './generated/api/sdk';
export type AppSdk = typeof api;

export function createSdk(client: Client): AppSdk {
  return new Proxy({} as typeof api, {
    get(_, namespace) {
      const ns = api[namespace as keyof typeof api];
      if (ns === null || (typeof ns !== 'function' && typeof ns !== 'object')) return ns;
      return new Proxy(ns as object, {
        get(_, method) {
          const fn = (ns as Record<string, unknown>)[method as string];
          if (typeof fn !== 'function') return fn;
          return (opts: object = {}) => (fn as (o: object) => unknown)({ client, ...opts });
        },
      });
    },
  });
}
```

Le SDK généré utilise des classes avec méthodes statiques (`export class auth { static login() {...} }`). Le Proxy intercèpte l'accès aux namespaces (classes) puis aux méthodes statiques, en pré-injectant `client`.

### Fixtures Vitest

```ts
// Utilisation dans les specs
import { test, expect } from '../fixtures';

test('example', async ({ adminSdk, baseUrl }) => {
  await adminSdk.sessions.listSessionsOfTypeGardeDesSceaux({ client });
});
```

- `baseUrl` : fixture worker-scoped, depuis `process.env.API_URL ?? 'http://localhost:3000'`
- `adminSdk`, `memberSdk` : fixtures test-scoped, création via `POST /api/auth/v2/register` + login

### Création des utilisateurs

Pas d'accès direct à `SimpleAuthService`. La création passe par l'endpoint HTTP :
```
POST /api/auth/v2/register
```
Ce même endpoint est utilisé par les tests Playwright.

### Sessions LODAM

La fixture `createSession` utilise `supertest` pour les uploads multipart (ZIP lolfi) et `vi.waitFor` pour attendre la fin du job d'ingestion.

Les types de réponse viennent du SDK généré (`PaginatedNominationFiles`, `DetailedReportDto`, etc.) plutôt que des DTOs internes de l'API.

## Commandes

```bash
# Générer le client (API doit tourner sur :3000)
pnpm -F api-e2e openapi:generate

# Lancer les tests
pnpm -F api-e2e test
```
