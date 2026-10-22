Chaque proposition doit :

- Être succincte : moins de code = moins de bugs
- Prendre en compte la performance : il faut un temps de réponse raisonnable (autour de 1 s) pour servir une vingtaine d'utilisateurs simultanément
- Séparer les problématiques plutôt que tout réunir dans une seule et même fonction, classe ou fichier
- Privilégier l'anglais, sauf quand il n'existe pas d'équivalent métier
- Limiter l'ajout de dépendances, en préférant la bibliothèque standard de Node.js 24 LTS
- Ne pas avoir peur de répéter une requête plutôt que de créer une abstraction trop tôt. Un DTO ou une règle de gestion n'existe en revanche qu'à un seul endroit

Concernant le style :

- Privilégier un style orienté objet plutôt que fonctionnel lorsque c'est cohérent (un composant React reste toujours une fonction)
- Exploiter les capacités offertes par les frameworks plutôt que d'essayer de les contourner
- Éviter les commentaires au profit d'un code lisible qui reprend le vocabulaire métier. Un commentaire ne garde que ce que le code ne peut pas dire : un piège, une décision métier, une contrainte extérieure
- Trier par ordre alphabétique les propriétés d'un objet, les clés d'un type et les attributs JSX. Exceptions : les dates calendaires (jour, mois, année), un ordre qui reflète l'interface, les DTO du back-end et les blocs existants qu'on ne touche pas

Le projet est un monorepo pnpm. Les conventions du back-end et de la base de données vivent dans [apps/api/CLAUDE.md](apps/api/CLAUDE.md), celles du front-end dans [apps/client/CLAUDE.md](apps/client/CLAUDE.md) : elles se chargent quand on travaille dans ces dossiers.

## Recommandations TypeScript

1. Privilégier `type` plutôt que `interface`, sauf :
   - si le type contient des fonctions
   - si l'on souhaite utiliser l'effacement spécifique des interfaces
   - si l'on souhaite que cette interface soit implémentée par des sous-classes (à éviter)
2. Préférer la composition à l'héritage
3. Ne pas créer d'interfaces trop tôt et, plus généralement, éviter les abstractions prématurées
4. Nommer les choses telles qu'elles sont plutôt que d'essayer de les généraliser (voir le point 3)
5. Préférer des types forts en entrée et des types plus souples en sortie : `readonly [string, ...string[]]` en entrée mais `string[]` en sortie
6. Ne pas proposer d'emblée une solution générique
7. S'appuyer sur des socles solides pour le nommage : [Zod](https://zod.dev), [RxJS](https://rxjs.dev)
8. Exploiter les API standards ESNext
9. Ne pas hésiter à muter des objets pour améliorer la performance mais garder ces mutations localisées
10. Utiliser les unions discriminées
11. Privilégier des enums dynamiques (sous forme de chaînes) plutôt que les enums natives :

```ts
const COLORS = ['RED', 'BLUE', 'GREEN'] as const;
export type Color = (typeof COLORS)[number];
```

12. Utiliser des type guards et enrichir les types lorsque c'est cohérent :

```ts
function withRequirements<T>(files: readonly T[]): (T & { requirements: string[] })[] {
  return files.map((f) => ({ ...f, requirements: [] }));
}

function withDefinedUser<T extends { user: { id: string } | undefined }>(
  sessions: readonly T[],
): (Omit<T, 'user'> & { user: { id: string } })[] {
  return sessions.filter((u): u is Omit<T, 'user'> & { user: { id: string } } => !!u.user);
}
```

13. Nommer les types directement : pas de `Parameters<typeof fn>[0]` ni de `ReturnType<typeof fn>` quand un type nommé existe et peut être importé
14. Quand 0 est une valeur légitime, tester avec `Number.isFinite` plutôt qu'avec une garde qui écarte les valeurs falsy

## Contrat d'API

- On génère une spécification OpenAPI 3.0, utilisée par le front-end pour générer son client (via la commande `pnpm run openapi:generate`)
- Cette spécification suit les bonnes pratiques de Nest.js avec les décorateurs `@Api...` et exploite `nestjs-zod` pour le typage fort
- Les DTO se nomment ainsi :
  - En entrée, du nom de l'action à effectuer suivi de `Dto`. Par exemple, pour l'action "supprimer une session" : `DeleteSessionDto`
  - En sortie, du participe passé de l'action. Dans l'exemple précédent : `DeletedSessionDto`
  - Chaque DTO est unique dans toute l'application
- Une liste affichée se charge par pages, la suivante au défilement (`onEndReached` du `DataTable`), jamais une remontée illimitée ni un bouton "Voir plus"

### DTO

- Ne mettre dans un DTO que ce que le client affiche : masquer une donnée dans l'interface ne la protège pas, elle reste lisible dans l'onglet Réseau
- Réutiliser la forme existante d'un concept avant d'en inventer une : par exemple, l'issue d'un dossier voyage partout en `{ value, comment }`
- Préférer un statut à un booléen, des sous-objets à un `extend`, des objets `{ id, ... }` à des chaînes dans les tableaux et des noms compréhensibles hors de leur contexte (`session: { id, name, date }` plutôt que `dateTransparence`)
- Les libellés d'affichage voyagent dans le DTO (`{ id, label }`) : ils ne sont ni reconstruits par jointure côté front ni concaténés en SQL
- Un `if` côté front sur une valeur métier qui décide de ce que l'utilisateur peut ou doit faire est une capacité manquante dans le contrat (`canX`, `xRequired` ou un statut), calculée par le domaine du back (voir [l'ADR](docs/adr/2026-10-19-regles-metier-servies-comme-capacites.md))

## Tests

- Le domaine est testé unitairement au maximum
- Les e2e de l'API vivent dans [apps/api-e2e](apps/api-e2e) et testent les cas nominaux, un scénario par test. Les 401 et les 403 ne se testent pas fonctionnalité par fonctionnalité : les gardes sont centrales et testées ailleurs. Pas d'assertion triviale
- Avant de pousser : `pnpm run prepush` (lint, formatage, types). Après une modification d'un schéma Prisma ou d'une requête SQL : `pnpm --filter api prisma:generate`, puis `pnpm run openapi:generate` (API démarrée sur le port 3000) si un contrat change. Les dossiers `generated` du client et des e2e ne se modifient jamais à la main

## Façon de travailler

- Un défaut préexistant se corrige dans la PR en cours, dans un commit séparé, une fois vérifié dans le code
- `// TODO: see ...` marque une convergence future entre deux implémentations parallèles

## Vocabulaire métier

- Magistrat
- Garde des Sceaux
- Session
- Dossier
- Transparence
- Proposition
- Candidat

## Décisions

Certaines décisions sont documentées dans [docs/adr](docs/adr) pour le transverse, [apps/api/docs/adr](apps/api/docs/adr) pour le back-end et [apps/client/docs/adr](apps/client/docs/adr) pour le front-end.
