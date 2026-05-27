----
title: Archive d'une session
description: |
  Marquer une session comme archivée 
---

## Objectif principal

Une fois une session archivée, on ne peut plus la modifier. Elle reste accessible en lecture pour tous ses lecteurs, et on doit indiquer clairement à l'utilisateur qu'il consulte de l'information qui a été archivée.

## Contraintes attendues

1. On ne peut archiver une session que lorsque tous les dossiers qui la compose sont rapportés ( voir 2. )
2. Un dossier est considéré rapporté lorsque:
   2.1. Le dossier a au moins 1 rapporteur
   2.2. Son issue est `VALIDATED` ou `NON_VALIDATED`
   2.3. Le dossier apparaît dans un PV de restitution (official report)
3. Une session archivée, désactive toute modification sur celle-ci:
   3.1. Impossible de changer les méta-données de la session (date, nom, ...)
   3.2. Impossible de changer les rapporteurs, priorités, issues, synthèses des dossiers de la session
   3.3. Impossible de générer de nouveaux documents (agenda, official report, presentation plans)
4. Une session archivée, n'accepte plus de données depuis les lolfi ingestions, on met à jour toutes les données sous-jacentes ( dans le schéma `data_administration_context` et la table `nominations_context.magistrats`), mais pas les session, dossiers, documents... (du schéma `nominations_context`)
5. Lorsque l'on archive une session, toutes les données sous-jacentes sont considérées comme archivées (dossiers, synthèses, version d'affectation...), y compris les données issues des membres (les rapports, memo, commentaires...)
6. Par cascade avec le point précédent, si un utilisateur essaie de modifier une données liée à une session archivée, on rejette l'action avec une exception
7. Une session archivée, n'est plus affichée aux members sur leur page d'accueil, et parallèlement, elle n'apparait plus dans la table de gestion des sessions pour les utilisateur au role `ADJOINT_SECRETAIRE_GENERAL` ou `ADMIN`, mais dans une page dédiée, qui reprend les mêmes écrans
   7.1. Chaque fois que l'on consulte une page qui fait référence à de la donnée archivée, on doit afficher un bandeau qui prévient l'utilisateur qu'il consulte une information archivée

on doit réaliser cette fonctionnalité de façon pragmatique en évitant de rajouter trop de logique à l'existant.

## Plan d'implémentation

### Vue d'ensemble

L'archive est modélisée comme un **soft-flag** sur `Session` (`archivedAt` / `archivedBy`), symétrique au soft-delete existant. Toutes les contraintes d'écriture sont centralisées dans le domaine, et les lectures restent accessibles sans modification majeure.

---

### 1. Migration Prisma

**Fichier :** `apps/api/prisma/schemas/nominations.prisma`

Ajouter deux champs au modèle `Session` :

```prisma
archivedAt DateTime? @map("archived_at")
archivedBy String?   @map("archived_by") @db.Uuid
```

Créer la migration SQL correspondante dans `apps/api/prisma/migrations/`.

> **Piège :** ne pas ajouter `archivedAt: null` au `where` de `NominationSessionRepository.find()` — les lectures d'une session archivée restent valides. Seul le guard de mutation s'appuie sur ce flag.

---

### 2. Domain — `nomination-session.ts`

**Fichier :** `apps/api/src/modules/session/domain/nomination-session.ts`

**Nouvelles classes d'erreur :**

```ts
export class NominationSessionAlreadyArchived extends Error {}
export class NominationSessionCannotBeArchived extends Error {
  constructor(readonly unreportedFileCount: number) {
    super();
  }
}
export class NominationSessionIsArchived extends Error {}
```

**Nouvel événement :**

```ts
export class NominationSessionArchived {
  constructor(
    readonly sessionId: string,
    readonly userId: string,
  ) {}
}
```

L'ajouter à l'union `NominationSessionEvent`.

**Nouveau flag dans `NominationSession.from()` :**

Ajouter `isArchived: boolean` aux props de `from()`, stocker comme champ privé.

**Nouvelle méthode `archive()` :**

```ts
archive(command: { userId: string; unreportedFileCount: number }): void {
  if (this.isArchived) throw new Nomiring[]) { super() }
}
```

Ajouter une méthode `archive(userId: string)` dans `NominationSession` qui :

1. Vérifie que la session n'est pas déjà archivée (lance `SessionIsArchived`)
2. Vérifie que tous les dossiers sont "rapportés" (contrainte 2) — lance `SessionNotArchivable` avec la liste des dossiers non rapportés
3. Retourne `{ isArchived: true, archivedAt: new Date(), archivedBy: userId }`

La condition "dossier rapporté" se vérifie ainsi :

- `dossier.reporterIds.length > 0` (au moins 1 rapporteur dans l'AffectationVersion courante)
- `dossier.outcome === 'VALIDATED' || dossier.outcome === 'NON_VALIDATED'`
- `dossier.officialReportId !== null` (lien via `OfficialReportNominationFile`)

> Note : le check du rapporteur nécessite l'AffectationVersion active. Passer les rapporteur IDs en paramètre de la méthode pour garder le domaine pur.

---

### 3. Repository — `nomination-session.repository.ts`

**Fichier :** `apps/api/src/modules/session/infrastructure/repositories/nomination-session.repository.ts`

Dans `find()`, sélectionner `archivedAt` et le passer à `NominationSession.from()` (via `isArchived: !!session.archivedAt`).

Dans `persist()`, ajouter le cas `NominationSessionArchived` :

```ts
} else if (message instanceof NominationSessionArchived) {
  await this.persistNominationSessionArchived(tx, message);
}
```

```ts
private persistNominationSessionArchived(tx: Prisma.TransactionClient, message: NominationSessionArchived) {
  return tx.session.update({
    where: { id: message.sessionId },
    data: { archivedAt: this.clock.now(), archivedBy: message.userId },
  });
}
```

---

### 4. Vérification de la précondition d'archivage

**Nouveau fichier SQL :** `apps/api/prisma/sql/countSessionUnreportedFiles.sql`

```sql
-- @param {String} $1:sessionId
SELECT COUNT(*)::int AS "count"
FROM nominations_context.dossier_de_nomination AS d
WHERE
  d.session_id = $1::UUID
  AND NOT (
    d.outcome IN ('VALIDATED', 'NON_VALIDATED')
    AND EXISTS (
      SELECT 1 FROM docs.official_report_nomination_file orf
      WHERE orf.nomination_file_id = d.id
    )
    AND EXISTS (
      SELECT 1
      FROM nominations_context.nomination_file_to_reporter nfr
      INNER JOIN nominations_context.affectation av
        ON av.id = nfr.version_id
        AND av.session_id = $1::UUID
        AND av.statut = 'PUBLIEE'
      WHERE nfr.nomination_file_id = d.id
    )
  )
```

**Nouveau fichier :** `apps/api/src/modules/session/infrastructure/queries/count-session-unreported-files.query.ts`

Injectable utilisant `$queryRawTyped(countSessionUnreportedFiles(sessionId))`.

---

### 5. Service — `sessions.service.ts`

**Fichier :** `apps/api/src/modules/session/infrastructure/sessions.service.ts`

Injecter `CountUnreportedFilesFinder` et ajouter :

```ts
async archiveSession(command: { sessionId: string; userId: string }): Promise<void> {
  const unreportedFileCount = await this.countUnreportedFilesFinder.find(command.sessionId);
  const session = await this.nominationSessionRepository.find(command.sessionId);
  session.archive({ userId: command.userId, unreportedFileCount });
  await this.nominationSessionRepository.persist(session);
}
```

---

### 6. Controller & filtre d'exception

**Fichier :** `apps/api/src/modules/session/session.controller.ts`

```ts
@HasRole(Role.ADJOINT_SECRETAIRE_GENERAL)
@Post('/:sessionId/archive')
@HttpCode(HttpStatus.NO_CONTENT)
archiveSession(
  @Param('sessionId', ParseUUIDPipe) sessionId: string,
  @AuthedUserId() userId: string,
): Promise<void> {
  return this.sessions.archiveSession({ sessionId, userId });
}
```

---

### 7. Guards transverses — contrainte 6

**Nouveau fichier :** `apps/api/src/modules/shared/assert-session-not-archived.ts`

```ts
export async function assertSessionNotArchived(prisma: PrismaService, sessionId: string): Promise<void> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    select: { archivedAt: true },
  });
  if (session?.archivedAt) throw new NominationSessionIsArchived();
}
```

À appeler en tête des méthodes de mutation dans :

- `SummaryService` (écriture de synthèse, ajout de screenshot)
- `ReportService` (mise à jour d'un rapport)
- `ObservationService` (ajout/modification d'observation)

Chaque filtre d'exception de ces modules gère `NominationSessionIsArchived` → `ForbiddenException`.

> `NominationSessionIsArchived` est défini dans le domain session ; l'exporter depuis le module pour éviter une dépendance circulaire.

---

### 8. Contrainte 4 — Lolfi ingest

**Fichier :** `apps/api/src/modules/ingest/services/ingestors/lolfi-transparences.ingestor.ts`

Avant toute écriture dans `nominations_context`, vérifier que la session n'est pas archivée :

```ts
const session = await this.prisma.session.findFirst({
  where: { lolfiSessionId: rawSessionId, archivedAt: null },
  select: { id: true },
});
if (!session) return; // archivée ou inexistante — on ne touche pas nominations_context
```

Les ingestors purement référentiels (`magistrats`, `grades`, `fonctions`, `postes`…) qui écrivent dans `data_administration_context` ne sont **pas** modifiés.

---

### 9. Listes & queries — contrainte 7

**`list-nomination-sessions.query.ts`** : ajouter `archivedAt: null` dans le `where`.

**`listMemberGardeDesSceauxSessions.sql`** : ajouter `AND s.archived_at IS NULL` dans la clause `WHERE`.

**`detail-nomination-session.query.ts`** : ajouter `archivedAt` au `select`, exposer `isArchived: boolean` dans `DetailedNominationSessionDto`.

---

### 10. Enrichissement des queries — propagation de `isArchived`

**Objectif :** Toute query qui remonte de l'information liée à une session doit comporter un booléen `isArchived` pour que le client affiche le bandeau d'avertissement et désactive les actions d'écriture.

**Queries concernées :**

1. **`detail-nomination-file.query.ts`** — Détail d'un dossier
   - Join sur la session, sélectionner `session.archivedAt`
   - Exposer `isArchived: boolean` dans `DetailedNominationFileDto`

2. **`list-nomination-files.query.ts`** — Liste des dossiers d'une session
   - Join sur la session, sélectionner `session.archivedAt`
   - Exposer `isArchived: boolean` dans chaque item du `NominationFilesTableItemDto`

3. **`list-reports-for-session.query.ts`** — Liste des rapports d'une session
   - Join sur la session via le dossier, sélectionner `session.archivedAt`
   - Exposer `isArchived: boolean` dans `ReportListItemDto`

4. **`get-report-overview.query.ts`** — Détail d'un rapport
   - Join sur la session via le dossier et la session, sélectionner `session.archivedAt`
   - Exposer `isArchived: boolean` dans `ReportOverviewDto`

5. **`list-summaries-for-file.query.ts`** — Synthèses d'un dossier
   - Join sur la session et le dossier
   - Exposer dans chaque synthèse : `isArchived: boolean`, `fileLabel: string`, `sessionId: string`

6. **`get-summary-detail.query.ts`** — Détail d'une synthèse
   - Join sur la session et le dossier
   - Exposer : `isArchived: boolean`, `fileLabel: string`, `sessionId: string`

7. **`list-observations-for-file.query.ts`** — Observations d'un dossier
   - Join sur la session et le dossier
   - Exposer dans chaque observation : `isArchived: boolean`, `fileLabel: string`, `sessionId: string`

8. **`list-observations-for-user.query.ts`** (si existe) — Observations d'un utilisateur sur plusieurs sessions
   - Join sur session/dossier pour chaque observation
   - Exposer : `isArchived: boolean`, `fileLabel: string`, `sessionId: string`

**Pattern à suivre :**

Pour les synthèses et observations, enrichir le contexte pour qu'elles restent compréhensibles même hors du contexte direct d'un dossier ou d'une session :

```ts
// Synthèse
export const SummaryDto = z.object({
  id: z.string().uuid(),
  content: z.string(),
  // ... autres champs métier
  fileLabel: z.string().describe('Le libellé du dossier pour contextualiser'),
  sessionId: z.string().uuid(),
  isArchived: z.boolean().describe('true si la session est archivée'),
});

// Observation
export const ObservationDto = z.object({
  id: z.string().uuid(),
  content: z.string(),
  // ... autres champs métier
  fileLabel: z.string().describe('Le libellé du dossier pour contextualiser'),
  sessionId: z.string().uuid(),
  isArchived: z.boolean().describe('true si la session est archivée'),
});
```

---

### 11. Client — page sessions archivées

**Fichier :** `apps/client/src/utils/route-path.utils.ts` — ajouter `ARCHIVED_SESSIONS: '/sg/sessions/archived'` dans `ROUTE_PATHS.SG`.

**Nouveau fichier :** `apps/client/src/pages/secretariat-general/ArchivedSessionsPage.tsx`

Réutilise le composant `ManageSession` (ou un composant identique) branché sur la query `useListedArchivedNominationSessionsQuery`. Les colonnes et filtres sont identiques à la page de gestion active.

**Nouveau fichier :** `apps/client/src/queries/archived-nomination-sessions.queries.ts`

**`AppRouter.tsx`** : ajouter la route `ROUTE_PATHS.SG.ARCHIVED_SESSIONS` dans les enfants de `ROUTE_PATHS.SG.DASHBOARD`.

**Dashboard SG** : ajouter un lien « Sessions archivées » dans la navigation.

---

### 12. Client — bandeau d'avertissement (contrainte 7.1)

**Nouveau composant :** `apps/client/src/components/shared/ArchivedSessionBanner.tsx`

Composant `<Notice>` du DSFR, non fermable, affiché quand `isArchived === true` dans :

- `TableauDeBordResume` (vue SG)
- `ReportListPage` (vue membre d'une session)
- `ReportOverviewPage` (vue membre d'un rapport)

---

### 13. Client — désactivation des actions d'écriture

Quand `isArchived === true` (propagé via le DTO `DetailedNominationSessionDto`) :

- `TableauDeBordActions` : désactiver les boutons de génération de documents
- Lien vers `SESSION_ID_EDIT` : masquer ou désactiver
- `NominationFilesTable` : cellules priorité / rapporteurs / issue en lecture seule
- Bouton « Archiver » : visible uniquement si `isValidated && !isArchived`

---

### Ordre d'implémentation recommandé

1. Migration Prisma + `prisma generate`
2. Domain + tests unitaires
3. Repository (`find` + `persist`)
4. SQL `countUnreportedNominationFiles` + query injectable
5. Service `archiveSession()`
6. Endpoint `POST /:sessionId/archive` + filtre d'exception
7. `list-nomination-sessions.query.ts` + SQL membre (`archivedAt: null`)
8. Query + endpoint `GET /archived`
9. `DetailedNominationSessionDto` : ajout `isArchived`
10. Guards transverses (Report, Summary, Observation)
11. Lolfi ingest guard
12. `pnpm run openapi:generate`
13. Client : page archivées + route + lien dashboard
14. Client : `ArchivedSessionBanner` + intégration
15. Client : désactivation des boutons de mutation

---

### Récapitulatif des pièges

| Piège                                                                     | Solution                                                                                         |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `find()` du repository doit rester accessible pour les sessions archivées | Ne pas filtrer sur `archivedAt: null` dans `find()`                                              |
| Ordre de route NestJS                                                     | Déclarer `GET /archived` avant `GET /:sessionId`                                                 |
| `NominationSessionIsArchived` utilisé par plusieurs modules               | L'exporter depuis le module session, éviter la dépendance circulaire                             |
| `LolfiSessionsIngestor` écrit dans `data_administration_context`          | Ne pas modifier cet ingestor, seul `LolfiTransparencesIngestor` est concerné                     |
| Nommage de la fonction SQL TypedSQL                                       | `countUnreportedNominationFiles` (camelCase valide JS), avec `-- @param` Prisma                  |
| Dossiers sans rapporteur dans la version publiée                          | La sous-requête doit joindre sur `statut = 'PUBLIEE'` pour ne pas compter les versions brouillon |
