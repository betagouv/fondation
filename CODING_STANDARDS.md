# Standards de code

La forme du code et les points que les outils ne vérifient pas. Une revue applique chaque règle et répond à chaque question pour le diff qu'elle lit, en citant le fichier et la ligne. Les conventions de conception vivent dans [CLAUDE.md](CLAUDE.md) et dans les `CLAUDE.md` de chaque application.

## Style

- Privilégier un style orienté objet plutôt que fonctionnel lorsque c'est cohérent (un composant React reste toujours une fonction)
- Exploiter les capacités offertes par les frameworks plutôt que d'essayer de les contourner
- Éviter les commentaires au profit d'un code lisible qui reprend le vocabulaire métier. Un commentaire ne garde que ce que le code ne peut pas dire : un piège, une décision métier, une contrainte extérieure
- Trier par ordre alphabétique les propriétés d'un objet, les clés d'un type et les attributs JSX. Exceptions : les dates calendaires (jour, mois, année), un ordre qui reflète l'interface, les DTO du back-end et les blocs existants qu'on ne touche pas

## TypeScript

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

## Points de revue

Ce que les revues ont relevé plusieurs fois.

### La mutation refuse-t-elle ce que la query interdit ?

Chaque capacité servie au client (`canX`, `xRequired`, un statut) est revérifiée par la mutation correspondante, avec la même règle du domaine : un client qui masque un bouton n'empêche pas l'appel. Voir [l'ADR](docs/adr/2026-10-19-regles-metier-servies-comme-capacites.md).

Défaut type : un menu affiché sur un dossier verrouillé, dont l'action finit en 409, ou un membre grisé dans une liste que l'API accepte pourtant d'affecter.

### Cette règle de gestion existe-t-elle déjà ailleurs ?

Une règle (un tri, une garde, une condition d'affichage) n'est écrite qu'une fois, côté domaine. Chercher son vocabulaire dans le code avant d'en accepter une nouvelle : deux implémentations finissent par diverger.

Défaut type : l'ordre protocolaire trié en SQL et en TypeScript, avec des résultats différents sur les accents.

### Chaque nouvelle lecture en base passe-t-elle dans un e2e ?

Un finder ou une query ajoutée est exercée par au moins un scénario de [apps/api-e2e](apps/api-e2e) : les tests unitaires du domaine reçoivent des données déjà préparées et ne voient pas une jointure fausse.

### Les textes disent-ils ce que fait le code ?

Commentaires, messages de commit, libellés et toasts décrivent un comportement qui existe dans le diff, pas un comportement prévu ou supposé.

Défaut type : une modale qui promet une « lecture seule » que l'API n'applique pas.

### Une donnée personnelle part-elle vers Sentry ?

Adresse électronique, adresse IP, nom : rien de tout cela dans les messages, les tags ou le contexte envoyés à Sentry. On y met des identifiants techniques.
