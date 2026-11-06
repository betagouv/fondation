# Base de données

Certaines fonctionnalités de [PostgreSQL](https://www.postgresql.org/) n'existent pas vraiment dans Prisma. Pour le moment, il est préférable d'accepter ces contraintes.

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

- Les requêtes SQL vivent dans le dossier [sql](sql). Elles sont nommées comme une fonction JavaScript valide. Lorsque les paramètres sont des scalaires, on les documente en haut du fichier avec la syntaxe fournie par Prisma :

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
