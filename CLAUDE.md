Chaque proposition doit :

- Être succincte : moins de code = moins de bugs
- Prendre en compte la performance : il faut un temps de réponse raisonnable (autour de 1 s) pour servir une vingtaine d'utilisateurs simultanément
- Séparer les problématiques plutôt que tout réunir dans une seule et même fonction, classe ou fichier
- Privilégier l'anglais, sauf quand il n'existe pas d'équivalent métier
- Limiter l'ajout de dépendances, en préférant la bibliothèque standard de Node.js 24 LTS
- Ne pas avoir peur de répéter du code plutôt que de créer des abstractions trop tôt

Concernant le style :

- Privilégier un style orienté objet plutôt que fonctionnel lorsque c'est cohérent (un composant React reste toujours une fonction)
- Exploiter les capacités offertes par les frameworks plutôt que d'essayer de les contourner
- Éviter les commentaires au profit d'un code lisible qui reprend le vocabulaire métier. Un commentaire ne garde que ce que le code ne peut pas dire : un piège, une décision métier, une contrainte extérieure
- Trier par ordre alphabétique les propriétés d'un objet, les clés d'un type et les attributs JSX. Exceptions : les dates calendaires (jour, mois, année), un ordre qui reflète l'interface, les DTO du back-end et les blocs existants qu'on ne touche pas

Le projet est organisé dans un monorepo pnpm où l'on retrouve le back-end dans [apps/api](apps/api) et le front-end dans [apps/client](apps/client).

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

## Développement back-end

### Socle technique

Les briques essentielles du back-end sont :

- [Nest.js](https://docs.nestjs.com/)
- [Express.js](https://expressjs.com/en/5x/api.html)
- [Prisma](https://www.prisma.io/docs/orm)

### Recommandations

- On génère une spécification OpenAPI 3.0, utilisée par le front-end pour générer son client (via la commande `pnpm run openapi:generate`)
- Cette spécification suit les bonnes pratiques de Nest.js avec les décorateurs `@Api…` et exploite `nestjs-zod` pour le typage fort
- Les DTO se nomment ainsi :
  - En entrée, du nom de l'action à effectuer suivi de `Dto`. Par exemple, pour l'action "supprimer une session" : `DeleteSessionDto`
  - En sortie, du participe passé de l'action. Dans l'exemple précédent : `DeletedSessionDto`
  - Chaque DTO est unique dans toute l'application

- Le back-end est organisé en `modules`, chacun ayant trait à une portion du métier. La seule exception est le module [framework](apps/api/src/modules/framework), qui regroupe les utilitaires techniques propres à Nest.js. Les utilitaires plus atomiques se trouvent dans [apps/api/src/utils](apps/api/src/utils)
- Chaque module expose un fichier `<module_name>.module.ts` à sa racine et un service (`<module_name>.service.ts`) qui est l'API de ce module. Pour utiliser un concept propre à cette entité métier, on passe par ce service
- Chaque requête (query) du service récupère les données de la façon la plus directe possible. Privilégier Prisma dans la mesure du possible et, sinon, ne pas hésiter à écrire une requête SQL avec [TypedSQL](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/typedsql). Ces requêtes suivent idéalement les règles [sqlfluff](apps/api/.sqlfluff). Leur contenu peut être préparé par les mutations (voir le point suivant)
- Chaque mutation du service est ACID et, autant que possible, idempotente. On suit majoritairement une approche guidée par les évènements : chaque mutation passe par un objet orchestrateur qui vérifie les invariants et émet un évènement servant de source à la persistance en base. Par exemple :

```ts
// src/modules/users/domain/user.ts
export class UserLoggedIn {
  constructor(readonly userId: string) {}
}

export class WrongPassword extends Error {}

export type UserEvent /* ajouter ici les autres évènements */ = UserLoggedIn;

export class User {
  readonly #messages: UserEvent[] = [];

  private constructor(
    readonly id: string,
    private readonly hashed: Password, // Password est une classe utilitaire qui abstrait le hash
  ) {}

  get messages(): readonly UserEvent[] {
    return this.#messages;
  }

  static from(props: { hashed: Password; id: string }): User {
    return new User(props.id, props.hashed);
  }

  login(command: { password: string }): void {
    if (!this.hashed.equals(command.password)) throw new WrongPassword();
    this.#messages.push(new UserLoggedIn(this.id));
  }
}

// src/modules/users/infrastructure/user.repository.ts
@Injectable()
export class UserRepository {
  constructor(private readonly db: Db) {}

  async findByEmail(predicate: { email: string }): Promise<User> {
    const user = await this.db.tx.user.findFirst({
      where: { email: { equals: predicate.email, mode: 'insensitive' } },
      select: { id: true, password: true } satisfies Prisma.UserSelect,
    });
    if (!user) throw new NotFoundException();

    return User.from({ hashed: await Password.from(user.password), id: user.id });
  }

  @Transactional(Propagation.Mandatory)
  async persist(user: User): Promise<void> {
    for (const message of user.messages) {
      if (message instanceof UserLoggedIn) await this.persistUserLoggedIn(message);
      else assertNever(message);
    }
  }

  private persistUserLoggedIn(message: UserLoggedIn) {
    return this.db.tx.userSession.create({ data: { userId: message.userId } });
  }
}

// src/modules/users/users.service.ts
// Ce service est appelé par un contrôleur (le cas le plus courant) ou par d'autres services
@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  @Transactional()
  async login(command: { email: string; password: string }): Promise<void> {
    const user = await this.userRepository.findByEmail(command);
    user.login(command);
    await this.userRepository.persist(user);
  }
}

// src/modules/users/users.module.ts
@Module({ exports: [UsersService], providers: [UserRepository, UsersService] })
export class UsersModule {}
```

- Tout ce qui relève du domaine (les invariants métier, les règles de gestion) vit dans un dossier `domain`, testé unitairement au maximum
- Tout le reste vit dans un dossier `infrastructure`, au même niveau

```
- src/
  - modules/
    - users/
      - users.module.ts
      - users.service.ts
      - domain/
        - user.ts
      - infrastructure/
        - user.repository.ts
        - user.controller.ts
        - user.pipe.ts
```

- Lorsqu'une mutation a besoin d'une information complexe à récupérer, plusieurs possibilités s'offrent à nous :
  1. Si le cas est courant mais ne concerne qu'une entité métier, ces données vivent dans l'objet orchestrateur
  2. Si le cas est courant et concerne plusieurs cas d'usage à travers différentes entités, on peut passer par un service tiers : un `Finder`, chargé de récupérer cette information de façon fiable. Par exemple [AffectationVersionFinder](apps/api/src/modules/session/transparence/infrastructure/finders/affectation-version.finder.ts)
  3. Si le cas est ponctuel, on peut même répéter une requête existant ailleurs

- Une query est pensée pour l'utilisateur : elle rend un DTO, sérialisé sur le réseau. Un finder est pensé pour le système : il peut rendre des `Map` ou des objets riches. Un accès aux données consommé par d'autres modules est un finder
- Un finder prend des identifiants, pas des données déjà chargées : les jointures se font en SQL, pas en TypeScript après coup
- Préférer TypedSQL à un `$queryRaw` écrit dans le code, sauf quand la structure de la requête varie à l'exécution
- Ne jamais rapprocher des données par leur texte (`ILIKE`) avec une table de référence : passer par les clés étrangères
- Un module lit les données d'un autre module par une méthode `internal…` du service de ce module. Seul le module `users` peut être lu directement. Un endpoint vit dans le contrôleur qui possède son chemin REST
- Un endpoint sans `@HasRole` est public : le middleware d'authentification ne fait qu'attacher l'utilisateur à la requête. L'autorisation se fait par rôle, jamais par l'URL

### DTO

- Ne mettre dans un DTO que ce que le client affiche : masquer une donnée dans l'interface ne la protège pas, elle reste lisible dans l'onglet Réseau
- Réutiliser la forme existante d'un concept avant d'en inventer une : par exemple, l'issue d'un dossier voyage partout en `{ value, comment }`
- Préférer un statut à un booléen, des sous-objets à un `extend`, des objets `{ id, … }` à des chaînes dans les tableaux et des noms compréhensibles hors de leur contexte (`session: { id, name, date }` plutôt que `dateTransparence`)
- Les libellés d'affichage voyagent dans le DTO (`{ id, label }`) : ils ne sont ni reconstruits par jointure côté front ni concaténés en SQL

### Performance et transactions

- Pas de N+1 par défaut : pas d'`await` dans une boucle mais une requête groupée. Exception : quand le regroupement complique le contrat d'un objet central, quelques lectures ponctuelles et indexées restent acceptables
- Une liste affichée a une limite (avec un "Voir plus"), jamais une remontée illimitée
- Ne pas ajouter d'index par réflexe : le justifier par un volume réel et par le plan d'exécution
- Plusieurs lectures liées dans un même traitement passent par une transaction, sinon chacune prend sa propre connexion du pool
- Pas de `Promise.all` sur `db.tx` : une transaction interactive ne supporte pas les requêtes concurrentes
- Une transaction reste courte : les traitements longs (rendu d'un PDF, envoi d'un fichier au stockage) se font en dehors, puis la transaction enregistre le résultat
- Supprimer un fichier passe par `Files.delete`, qui attend la validation de la transaction en cours : un fichier ne disparaît jamais du stockage alors que la base est revenue en arrière. Pour toute autre action qui ne doit avoir lieu qu'une fois les données enregistrées, utiliser `afterCommit`

### Base de données

Le projet utilise [Prisma ORM](https://www.prisma.io/docs/orm) pour :

- Concevoir et maintenir les tables de la base de données
- Accéder aux données et les modifier

Certaines fonctionnalités de [PostgreSQL](https://www.postgresql.org/) n'existent pas vraiment dans Prisma. Pour le moment, il est préférable d'accepter ces contraintes.

TypeScript ne vérifie pas les champs d'un `select` ou d'un `include` passé à Prisma : un champ inexistant compile sans erreur, alors que le `where` est bien vérifié. Chaque `select` et chaque `include` racine porte donc `satisfies`, qui vérifie aussi les relations imbriquées. Un test (`prisma-selects.spec.ts`) échoue s'il en manque un :

```ts
await this.db.tx.agenda.findMany({
  where: { sessionId },
  select: { id: true, versions: { select: { status: true } } } satisfies Prisma.AgendaSelect,
});
```

Deux défauts en sont la cause : une régression de TypeScript depuis la version 6.0 ([microsoft/TypeScript#64197](https://github.com/microsoft/TypeScript/issues/64197)) et le générateur `prisma-client` de Prisma 7 ([prisma/prisma#29519](https://github.com/prisma/prisma/issues/29519)). Quand les deux seront corrigés, les `satisfies` et ce test pourront être retirés.

Chaque table est décrite dans un fichier `.prisma`. Ils se trouvent tous dans le dossier [prisma/schemas](apps/api/prisma/schemas/) et la configuration de Prisma se trouve dans [prisma.config.ts](apps/api/prisma.config.ts).

Par convention :

- Chaque entité nommée utilise le snake case en base, alors que le mapping dans Prisma est en camelCase. Par exemple, la table `User` est définie ainsi :

```prisma
model User {
  id String @db.Uuid @id
  firstName String @map("first_name")
  lastName String @map("last_name")
  email String

  @@map("user")
  @@schema("identity_and_access_context")
}
```

- Chaque enum suit la convention `PrismaXXXEnum`. Par exemple, une enum "status" serait définie ainsi :

```prisma
enum PrismaStatusEnum {
  IDLE
  RUNNING
  FAILED
  SUCCEEDED
  CANCELED

  @@map("status_enum")
  @@schema("public")
}
```

- Chaque entité est définie dans un schéma de la base de données
- On privilégie la [troisième forme normale](https://en.wikipedia.org/wiki/Database_normalization) plutôt que la dénormalisation, sauf problème de performance à la lecture. Les tableaux et les objets JSON sont donc à éviter en stockage
- À la lecture, en revanche, ces structures sont fortement conseillées quand elles permettent de rendre l'information sous la forme la plus utile au client

- Les requêtes SQL vivent dans le dossier [prisma/sql](apps/api/prisma/sql). Elles sont nommées comme une fonction JavaScript valide. Lorsque les paramètres sont des scalaires, on les documente en haut du fichier avec la syntaxe fournie par Prisma :

```sql
-- @param {String} $1:sessionId
```

- En règle générale, les entités de haut niveau ont une clé primaire en UUID (`id String @id @db.Uuid`). Les sous-entités qui les référencent utilisent une clé composée : `@@id([userId, sessionId])`

- On conserve les conventions de nommage proposées par Prisma pour les clés primaires et étrangères
- Dans certains cas, on doit donner un nom accessible uniquement depuis Prisma. Par convention, on utilise `primaryKey` pour la clé primaire. Par exemple, pour une clé primaire composée :

```prisma
model SessionAttachment {
  sessionId String @id @db.Uuid
  name String

  @@id([sessionId, name], name: "primaryKey")
}
```

## Développement front-end

### Socle technique

- [React](https://react.dev/)
- [React Router](https://reactrouter.com/start/data/routing) en mode data
- [Système de Design de l'État](https://www.systeme-de-design.gouv.fr/version-courante/fr), en particulier son implémentation [React](https://react-dsfr.codegouv.studio/)
- [TanStack Query](https://tanstack.com/query)

### Recommandations

À garder en tête :

- L'application doit être fluide (des temps de réponse courts) et compréhensible par différents profils d'utilisateurs, y compris ceux qui ont besoin d'une assistance
- On suit les préconisations ARIA et on préfère les implémentations natives du navigateur (Chrome)

Côté technique :

- Toujours privilégier l'inférence de type quand c'est possible. Par exemple, plutôt que d'écrire un composant React ainsi :

```tsx
type MyAwesomeComponentProps = { foo: string };
export const MyAwesomeComponent: React.FC<MyAwesomeComponentProps> = ({ foo }) => <p>{foo}</p>;
```

Préférer :

```tsx
export function MyAwesomeComponent(props: { foo: string }) {
  return <p>{props.foo}</p>;
}
```

- Préférer un `Context` au props drilling
- Croiser deux sources de données passe par un modèle construit une fois et partagé par un `Context`, pas par un hook appelé à chaque ligne
- Un nom de composant se suffit à lui-même, même dans un dossier déjà ciblé : `MagistratDetailsContent` plutôt que `DetailsContent`
- Utiliser TanStack Query pour gérer l'état asynchrone de l'application (voir [État asynchrone](#état-asynchrone))

### État asynchrone

La synchronisation entre le client et le serveur utilise TanStack Query et le SDK généré avec [hey-api](https://heyapi.dev/openapi-ts/plugins/sdk).

- Les queries et les mutations vivent dans le dossier [queries](apps/client/src/queries)
- Chaque hook déclaré ici est responsable de sa propre API, avec ces règles :
  - Chaque query utilise une clé tirée d'un registre de clés déclaré en haut du fichier
  - Chaque clé doit pouvoir être identifiée pour invalider son contenu
  - Si une mutation rend une query périmée, elle l'invalide

## Tests

- Le domaine est testé unitairement au maximum
- Les e2e de l'API testent les cas nominaux, un scénario par test. Les 401 et les 403 ne se testent pas fonctionnalité par fonctionnalité : les gardes sont centrales et testées ailleurs. Pas d'assertion triviale

## Façon de travailler

- Un défaut préexistant se corrige dans la PR en cours, dans un commit séparé, une fois vérifié dans le code
- `// TODO: see …` marque une convergence future entre deux implémentations parallèles

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
