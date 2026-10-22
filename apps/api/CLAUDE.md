# Back-end

## Modules

- Le back-end est organisé en `modules`, chacun ayant trait à une portion du métier. La seule exception est le module [framework](src/modules/framework), qui regroupe les utilitaires techniques propres à Nest.js. Les utilitaires plus atomiques se trouvent dans [src/utils](src/utils)
- Chaque module expose un fichier `<module_name>.module.ts` à sa racine et un service (`<module_name>.service.ts`) qui est l'API de ce module. Pour utiliser un concept propre à cette entité métier, on passe par ce service
- Chaque requête (query) du service récupère les données de la façon la plus directe possible. Privilégier Prisma dans la mesure du possible et, sinon, ne pas hésiter à écrire une requête SQL avec [TypedSQL](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/typedsql). Ces requêtes suivent idéalement les règles [sqlfluff](.sqlfluff). Leur contenu peut être préparé par les mutations (voir le point suivant)
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
  2. Si le cas est courant et concerne plusieurs cas d'usage à travers différentes entités, on peut passer par un service tiers : un `Finder`, chargé de récupérer cette information de façon fiable. Par exemple [AffectationVersionFinder](src/modules/session/transparence/infrastructure/finders/affectation-version.finder.ts)
  3. Si le cas est ponctuel, on peut même répéter une requête existant ailleurs

- Une query est pensée pour l'utilisateur : elle rend un DTO, sérialisé sur le réseau. Un finder est pensé pour le système : il peut rendre des `Map` ou des objets riches. Un accès aux données consommé par d'autres modules est un finder
- Un finder prend des identifiants, pas des données déjà chargées : les jointures se font en SQL, pas en TypeScript après coup
- Préférer TypedSQL à un `$queryRaw` écrit dans le code, sauf quand la structure de la requête varie à l'exécution
- Ne jamais rapprocher des données par leur texte (`ILIKE`) avec une table de référence : passer par les clés étrangères
- Une table appartient au module qui l'écrit, quel que soit le schéma où elle est rangée
- Un module lit les données d'un autre module par une méthode `internal...` du service de ce module. Seules la table `users` (`identity_and_access_context`) et les copies LOLFI (les tables de `data_administration_context` et `nominations_context.magistrat`) peuvent être lues directement. Un endpoint garde le chemin REST et le tag OpenAPI de la ressource qu'il sert, même quand un autre module le traite
- Un module écrit dans les données d'un autre module par une méthode `internal...` du service de ce module, dans la transaction de l'appelant (`@Transactional(Propagation.Mandatory)` côté propriétaire)
- Un endpoint sans `@HasRole` est public : le middleware d'authentification ne fait qu'attacher l'utilisateur à la requête. L'autorisation se fait par rôle, jamais par l'URL

## Performance et transactions

- Pas de N+1 par défaut : pas d'`await` dans une boucle mais une requête groupée. Exception : quand le regroupement complique le contrat d'un objet central, quelques lectures ponctuelles et indexées restent acceptables
- Ne pas ajouter d'index par réflexe : le justifier par un volume réel et par le plan d'exécution
- Plusieurs lectures liées dans un même traitement passent par une transaction, sinon chacune prend sa propre connexion du pool
- Pas de `Promise.all` sur `db.tx` : une transaction interactive ne supporte pas les requêtes concurrentes
- Une transaction reste courte : les traitements longs (rendu d'un PDF, envoi d'un fichier au stockage) se font en dehors, puis la transaction enregistre le résultat
- Supprimer un fichier passe par `Files.delete`, qui attend la validation de la transaction en cours : un fichier ne disparaît jamais du stockage alors que la base est revenue en arrière. Pour toute autre action qui ne doit avoir lieu qu'une fois les données enregistrées, utiliser `afterCommit`

## Base de données

Certaines fonctionnalités de [PostgreSQL](https://www.postgresql.org/) n'existent pas vraiment dans Prisma. Pour le moment, il est préférable d'accepter ces contraintes.

TypeScript ne vérifie pas les champs d'un `select` ou d'un `include` passé à Prisma : un champ inexistant compile sans erreur, alors que le `where` est bien vérifié. Chaque `select` et chaque `include` racine porte donc `satisfies`, qui vérifie aussi les relations imbriquées. Un test (`prisma-selects.spec.ts`) échoue s'il en manque un :

```ts
await this.db.tx.agenda.findMany({
  where: { sessionId },
  select: { id: true, versions: { select: { status: true } } } satisfies Prisma.AgendaSelect,
});
```

Deux défauts en sont la cause : un changement de TypeScript 6.0 que son équipe considère comme voulu ([microsoft/TypeScript#64006](https://github.com/microsoft/TypeScript/issues/64006), fermé sans correction) et le générateur `prisma-client` de Prisma 7 ([prisma/orm#29519](https://github.com/prisma/orm/issues/29519)). Les `satisfies` et ce test ne pourront être retirés que si Prisma corrige son générateur.

Par convention :

- Chaque entité nommée utilise le snake case en base, alors que le mapping dans Prisma est en camelCase. Par exemple, une table `User` serait définie ainsi :

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

- Les requêtes SQL vivent dans le dossier [prisma/sql](prisma/sql). Elles sont nommées comme une fonction JavaScript valide. Lorsque les paramètres sont des scalaires, on les documente en haut du fichier avec la syntaxe fournie par Prisma :

```sql
-- @param {String} $1:sessionId
```

- En règle générale, les entités de haut niveau ont une clé primaire en UUID (`id String @id @db.Uuid`). Les sous-entités qui les référencent utilisent une clé composée : `@@id([userId, sessionId])`

- On conserve les conventions de nommage proposées par Prisma pour les clés primaires et étrangères
- Dans certains cas, on doit donner un nom accessible uniquement depuis Prisma. Par convention, on utilise `primaryKey` pour la clé primaire. Par exemple, pour une clé primaire composée :

```prisma
model SessionAttachment {
  sessionId String @db.Uuid
  name String

  @@id([sessionId, name], name: "primaryKey")
}
```
