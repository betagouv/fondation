---
title: Le monorepo vérifie ses types et compile l'API avec TypeScript 7, à côté de TypeScript 6
author:
  - github.com/kornifex
date: 2026-10-20
---

## En une phrase

`tsc` vient de TypeScript 7 dans tout le monorepo et compile l'API à la place du CLI de Nest, tandis que
le paquet `typescript` reste en version 6 pour les outils qui importent son API.

## Contexte

Le CLI de Nest compilait l'API avec `tsc` 6 en 10,7 s, à chaque build comme à chaque démarrage :
`deleteOutDir` vidait `dist`, `.tsbuildinfo` compris, si bien qu'aucune compilation n'était incrémentale. Ce temps se payait deux fois par PR sur la CI
(démarrage des e2e de l'API, étape `Build`), une fois dans `openapi.yml` et à chaque redémarrage en
`dev` (7,3 s). Côté vérification des types, `pnpm types:check` prenait 11,4 s et `prepush` environ 24 s.

FON-314 proposait SWC, que le CLI de Nest sait piloter. TypeScript 7.0, réécrit en Go, est sorti entre
la rédaction du ticket et sa prise en charge.

## Mesures

|                                             | TS 6 + CLI Nest | SWC + CLI Nest                 | TS 7                  |
| ------------------------------------------- | --------------- | ------------------------------ | --------------------- |
| Build de l'API                              | 10,7 s          | 1,4 s, sans vérifier les types | 1,6 s, types vérifiés |
| Redémarrage en `dev` après une modification | 7,3 s           | 2,3 s                          | 2,5 à 3,6 s           |
| `start:e2e` jusqu'à l'API prête             | 10,4 s          | —                              | 2,2 s                 |
| `pnpm types:check`                          | 11,4 s          | 11,4 s                         | 3,1 s                 |
| `pnpm run prepush`                          | ~24 s           | ~24 s                          | ~8 s                  |

## Options écartées

- **Garder TS 6 et le CLI de Nest** : on ne gagne rien, et la vérification des types reste le poste le
  plus lent du client comme de l'API.
- **SWC** : il compile vite, mais il change le JavaScript produit de deux façons qui ne se voient pas à
  la compilation.
  - Il exporte les classes par des getters sur une liaison `let`. Les métadonnées `design:paramtypes`
    d'un import circulaire tombent alors dans la zone morte temporelle, et l'API plante au démarrage
    (`Cannot access 'TransparenceService' before initialization`). Il faudrait envelopper les 32
    injections `@Inject(forwardRef(...))` dans un `WrapperType<T>`, puis chaque nouvelle.
  - Il ne résout pas les alias de type : leurs métadonnées deviennent `Object`. Pour `OpenIdProvider`,
    `@nestjs/swagger` retire le paramètre `{provider}` de l'OpenAPI, sans erreur. On ne le verrait que
    dans la PR `chore/openapi`, ouverte après le merge.
  - Le build ne vérifie plus les types : `build-for-scalingo.sh` livrerait du code non vérifié.
- **TS 7 pour l'API seulement** (un catalogue pnpm nommé) : il fonctionne, mais `types:check` reste à
  11 s parce que le client, le plus lent (8,2 s), reste en TS 6.
- **`@hey-api/openapi-ts` en préversion `next`** : elle ne dépend plus de TypeScript et génère le même
  code, mais aucune version stable n'est sortie depuis la 0.99.0 (juin 2026), la 0.100.0 annoncée est
  cassante, et elle ne règle pas `@swc-node/register`, qui importe lui aussi l'API de TypeScript.

## Décision

- **TS 6 et TS 7 côte à côte**, selon la méthode du billet de sortie de TypeScript 7. Dans le catalogue,
  `typescript` est un alias de `@typescript/typescript6` et `@typescript/native` un alias de
  `typescript@7`. Le binaire `tsc` vient de la version 7. `require('typescript')` rend la version 6,
  dont ont besoin `@hey-api/openapi-ts`, `@swc-node/register` et `prisma-selects.spec.ts`. Les `overrides`
  pnpm ne suffisent pas : ces outils déclarent `typescript` en dépendance pair, résolue depuis le projet.
- **L'API se compile avec `tsc -p tsconfig.build.json`** : TS 7 n'expose plus l'API que le CLI de Nest
  utilise pour compiler. `dev` et `start:debug` lancent `tsc -w` et `node --watch` côte à côte, sans
  nouvelle dépendance. `@nestjs/cli`, `@nestjs/schematics` et `nest-cli.json` disparaissent.
- **Seul `build` vide `dist`** : la livraison part de zéro, tandis que `start`, `start:e2e`, `dev` et
  `start:debug` compilent par-dessus le `dist` existant, de façon incrémentale.
- **Les imports de l'API sont relatifs** : `tsc` ne réécrit pas l'alias `src/*`. Les imports `#src/*`
  de Node gardaient des chemins courts, mais `package.json`, Vitest et oxfmt devaient rester d'accord,
  et sans l'alias Vitest les tests auraient tourné sans bruit sur un `dist` périmé.

TS 7 produit le même JavaScript que TS 6, `__decorate` et `__metadata` compris, et les mêmes source maps
pour Sentry. L'OpenAPI et les clients générés ne changent pas.

## Conséquences

- On accepte deux versions de TypeScript : `typescript` désigne la 6, `tsc` la 7. Un éditeur réglé sur
  la version du workspace pointe vers le paquet TS 6 réduit, sans `tsserver` : il faut garder la version
  intégrée à l'éditeur ou l'extension TypeScript 7.
- L'alias se retire en six lignes quand `@hey-api/openapi-ts` 0.100 sera stable et que
  `@swc-node/register` se passera de l'API de TypeScript (`// TODO` dans `pnpm-workspace.yaml`).
  `prisma-selects.spec.ts` devra alors parser sans TypeScript, par exemple avec `parseAst` de
  `vitest/node`.
- En `dev`, la vérification des types de `tsc -w` prend environ 5 s : une deuxième sauvegarde n'est prise
  en compte qu'à sa fin, et une erreur de types n'empêche pas le redémarrage.
- Hors `build`, une source supprimée ou renommée laisse son `.js` dans `dist`. Rien ne parcourt ce
  dossier, et `pnpm build` repart d'un `dist` vide.
- Les imports relatifs remontent jusqu'à six niveaux (`../../../../../../utils/date-only`).
