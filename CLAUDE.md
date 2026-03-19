Chaque proposition doit:

- Être succincte: moins de code = moins de bug
- Prendre en compte la performance, il faut un temps de réponse raisonnable (autour de 1s) pour servir une vingtaine d'utilisateurs en simultanée
- Préférer séparer les problématiques, plutôt que tout réunir dans une seule et même fonction, classe, fichier
- Privilégier l'utilisation de l'anglais, sauf quand des équivalent métier n'existent pas
- Limiter l'ajout de dépendance, en préférant utiliser la librairie standard node.js disponible dans la version 24 LTS
- Ne pas avoir peur de répéter du code, plutôt que de créer des abstractions trop rapidement

Concernant le style:

- Privilégier un style orienté objet, plutôt que basé sur des fonctions lorsque c'est cohérent (un composant React sera toujours une fonction)
- Exploiter les capacités offertes par les framework, plutôt que d'essayer de les contourner
- Éviter les commentaires, au profit d'un code lisible qui réutilise le vocabulaire métier

Le projet est organisé dans un mono-repository pnpm où l'on retrouve le back-end dans [apps/api](../apps/api) et le front-end dans [apps/client](../apps/client).

## Recommandations Typescript

1. Privilégier l'utilisation de `type` plutôt que d'interface, sauf:
   - Si le type contient des fonctions
   - On souhaite utiliser l'effacement spécifique des interfaces
   - On souhaite que cette interface soit implémentée par des sous-classes (à éviter)
2. Préférer la composition à l'héritage
3. Ne pas créer des interfaces trop rapidement, et globalement éviter les abstractions trop rapides
4. Nommer les choses telles qu'elles sont, plutôt que d'essayer de les généraliser (voir le point 3.)
5. Préférer des types forts en entrée, mais des types plus souples en sorte: `readonly [string, ...string[]]` en entrée mais `string[]` en sortie.
6. Ne pas immédiatement proposer une solution générique
7. Se reposer sur des socles solide pour le nommage: [Zod](https://zod.dev), [RxJs](https://rxjs.dev).
8. Exploiter les API standards ESNEXT
9. Ne pas hésiter à faire de la mutation d'objet pour améliorer la performance, mais garder ces mutations localisées
10. Utiliser les unions discriminées
11. Privilégier des Enums dynamiques (sous forme de string), plutôt que les enums natives:

```ts
const COLORS = ['RED', 'BLUE', 'GREEN'] as const;
export const Color = (typeof COLORS)[number];
```

12. Utiliser des type-guard et enrichir les types lorsque c'est cohérent:

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

## Développement Back-end

### Socle technique

Les briques essentielles du projet Back-End sont:

- [Nest.js](https://docs.nestjs.com/)
- [Express.js](https://expressjs.com/en/5x/api.html)
- [Prisma](https://www.prisma.io/docs/orm)

### Recommandations

- On génère une spécification OpenAPI 3.0, qui est utilisé par le front-end pour générer son client (via la commande `pnpm run openapi:generate`)
- Cette spécification doit utiliser les bonnes pratiques Nest.js via les décorateurs `@Api` et exploiter `nestjs-zod` pour le typage fort.
- Les DTO doivent se nommer:
  - En entrée, du nom de l'action à effecter, suivit de `Dto`. Par exemple pour l'action "supprimer une session" en anglais j'aurais: `DeleteSessionDto`
  - En sortie j'utilise le participe passé de l'action. Dans l'exemple précédent: `DeletedSessionDto`
  - Les DTO doivent être unique sur toute l'application

- Le back-end est organisé en `modules` chacun ayant trait à une portion du métier. La seule exception est le module [framework](../apps/api/src/modules/framework) qui regroupe les utilitaires techniques propres à nest.js. On peut retrouver des utilitaires plus atomiques dans [apps/api/src/utils](../apps/api/src/utils)
- Chaque module expose un fichier `<module_name>.module.ts` à sa racine et est responsable d'exposer un service (`<module_name>.service.ts`) qui est l'API de ce module. Lorsque l'on veut utiliser un concept propre à cette entité métier on va utiliser ce service.
- Chaque requête (query) au service récupère la données de la façon la plus directe possible. Dans la mesure du possible privilégier l'utilisation de prisma, mais autrement ne pas hésiter à utiliser une requête SQL directe en utilisant le système [TypedSQL](https://www.prisma.io/docs/orm/prisma-client/using-raw-sql/typedsql) de prisma. Ces requêtes doivent idéalement suivre les règles [sqlfluff](../apps/api/.sqlfluff). Le contenu des requêtes peut-être préparé par les mutations (voir le point suivant).
- Chaque mutation du service doit être ACID et idempotente (le plus possible). On utilise majoritairement une approche guidée par des évènements. Chaque mutation est effectué dans un objet orchestrateur responsable de la vérification des invariants. Chaque mutation entraîne l'émission d'un évènement qui sera utilisé comme source de la persistance en base de données. exemple:

```ts
// src/modules/users/domain/user.ts
export class UserLoggedIn {
  constructor(readonly userId: string) {}
}

export type UserEvent /* ajouter ici les autres évènements*/ = UserLoggedIn;

export class User {
  #messages: UserEvent[] = [];
  private constructor(
    readonly id: string,
    private readonly hashed: Password, // La classe Password est une classes utilitaire qui abstrait le hash
  ) {}

  get messages(): readonly UserEvent[] {
    return this.#messages;
  }

  static from(props: { id: string; hashed: Password }): User {
    return new User(props.id, props.hashed);
  }

  login(command: { password: string }): void {
    if (!this.hashed.equals(password)) throw new Error(); // Idéalement créer une erreur spécifique
    this.#messages.push(new UserLoggedIn(this.id));
  }
}

// src/modules/users/infrastructure/user.repository.ts
@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(predicate: { email: string }): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email: { equals: predicate.email, mode: 'insensitive' } },
      select: { id: true, password: true },
    });
    if (!user) throw new NotFoundException();

    return User.from({ id: user.id, password: await Password.from(user.password) });
  }

  persist(user: User) {
    return this.prisma.$transaction(
      user.messages.map((message) => {
        if (message instanceof UserLoggedIn) {
          return this.persistUserLoggedIn(message);
        } else {
          return assertNever(message);
        }
      }),
    );
  }

  private persistUserLoggedIn(message: UserLoggedIn) {
    return this.prisma.userSession.create({ data: { userId: message.userId } });
  }
}

// src/modules/users/users.service.ts
// Cette classe peut être appelé autant dans un contrôleur (le cas le plus courant)
// que par d'autres services dans l'application
@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async login(command: { email: string; password: string }): Promise<void> {
    const user = await this.userRepository.findByEmail(command);
    user.login(command);
    await user.persist(user);
  }
}

// src/modules/users/users.module.ts
@Module({ providers: [UserRepository, UsersService], exports: [UsersService] })
export class UsersModule {}
```

- Tout ce qui est de l'ordre du domaine, les invariant métier, les règles de gestion, doivent apparaître dans un dossier `domain` qui doit être testé unitairement au maximum
- Tout le reste peut exister dans un dossier `infrastructure` au niveau du dossier

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

- Lorsque l'on doit récupérer de l'information de manière complexe pour faciliter une mutation, plusieurs possibilités s'offrent à nous:
  1. Si le cas est assez courant, mais ne couvre qu'une entité métier, ces données doivent exister dans l'objet orchestrateur
  2. Si le cas est courant, mais couvre plusieurs cas d'usage à travers différentes entités, alors on peut utiliser un service tier: un `Finder`. Son utilité est de récupérer cette information de façon fiable. Par exemple [AffectationVersionFinder](../apps/api/src/modules/session/infrastructure/finders/affectation-version.finder.ts).
  3. Si le cas est ponctuel, alors on peut même répéter une requête existant ailleurs

### Base de données

Le projet utilise [Prisma ORM](https://www.prisma.io/docs/orm) pour:

- Concevoir et maintenir les tables dans la base de données
- Accéder et modifier les données

Certaines fonctionnalités disponibles dans le SGBD [PostgreSQL](https://www.postgresql.org/) n'existent pas vraiment dans Prisma. Pour le moment, il est préférable d'accepter ces contraintes.

Chaque table est décrite dans un fichier `.schema`. Ils sont tous disponibles dans le dossier [prisma/schemas](../apps/api/prisma/schemas/), et la configuration de Prisma est disponible dans [prisma.config.ts](../apps/api/prisma.config.ts).

Par convention:

- Chaque entité nommée utilise la snake case, alors que le mapping dans Prisma est en camelCase. Par exemple, la table `User` est définit:

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

- Chaque enum utilise la convention `PrismaXXXEnum`. Par exemple une enum "status" serait définit ainsi:

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

- Chaque entité doit être définit dans un schéma en base de données
- On privilégie la [3è forme normale](https://en.wikipedia.org/wiki/Database_normalization) plutôt que la dé-normalisation, en dehors de problématique de performance à la lecture. Ainsi les tableaux et objets json sont à éviter
- L'utilisation de ces structures à la lecture est fortement conseillée, si elle permet de récupérer l'information dans la forme la mieux structurée pour la consommation par le client.

- Les requêtes SQL peuvent exister dans le dossier [prisma/sql](../apps/api/prisma/sql). Elles doivent être nommées comme une fonction javascript valide. Lorsque les paramètres sont des scalaires, on devrait les documenter en utilisant la syntaxe fournit par Prisma en haut du fichier:

```sql
-- @param {String} $1:sessionId
```

- En règle générale, les entités de haut niveau devait définir une clé primaire en UUID (`id String @id @db.Uuid`). Les sous-entités qui font référence à ces entités de haut niveau devrait utiliser une clé composée. `@@id([userId, sessionId])`.

- On conserve les conventions de nommage en base de données proposées par Prisma pour les clés primaires et étrangères.
- Dans certains cas, on doit définir une valeur pour le nom, mais uniquement accessible depuis Prisma. Par convention, on utilise `primaryKey` pour la clé primaire. Par exemple pour une clé primaire composée:

```prisma
model SessionAttachment {
  sessionId String @id @db.Uuid
  name String

  @@id([sessionId, name], name: "primaryKey")
}
```

## Guide Front-End

### Socle technique

- [React](https://react.dev/)
- [React Router](https://reactrouter.com/start/data/routing) en mode data
- [Système de Design de l'État](https://www.systeme-de-design.gouv.fr/version-courante/fr) et particulièrement dans son implémentation en [React](https://react-dsfr.codegouv.studio/)
- [Tanstack Query](http://tanstack.com/query)

### Recommandations

A garder en tête:

- L'application doit être fluide (les temps de réponse doivent être court), compréhensible par différents profils d'utilisateurs, y compris ceux nécessitant une assistance.
- On doit suivre les préconisations ARIA et préférer les implémentations du navigateur (Chrome)

Côté technique:

- Toujours privilégier l'inférence de type quand c'est possible. Par exemple plutôt que d'écrire un composant React comme cela:

```tsx
type MyAwesomeComponentProps = { foo: string };
export const MyAwesomeComponent: React.FC<MyAwesomeComponentProps> = ({ foo }) => <p>{foo}</p>;
```

Préférer

```tsx
export function MyAwesomeComponent(props: { foo: string }) {
  return <p>{props.foo}</p>;
}
```

- Préférer utiliser un `Context` plutôt que de faire du props-drilling
- Utiliser Tanstack Query pour gérer l'état asynchrone de l'application (voir [État asynchrone](#état-asynchrone))

### État asynchrone

La synchronisation entre le client et le serveur utilise Tanstack Query et le sdk généré avec [hey-api](https://heyapi.dev/openapi-ts/plugins/sdk).

- Les queries et mutations, doivent vivre dans le dossier [queries](../apps/client/src/queries)
- Chaque hook déclaré ici est responsable de sa propre API, mais:
  - Les query doivent utiliser une clé dans un registre de clés déclaré en haut du fichier
  - Chaque clé doit pouvoir être identifiable pour invalider le contenu de cette dernière
  - Si la mutation invalide une query, il faut le faire

## Vocabulaire métier

- Magistrat
- Garde des Sceaux
- Session
- Dossier
- Transparence
- Proposition
- Candidat

## Décisions

Certaines prises de décisions sont documentées dans [adr](../apps/api/docs/adr)
