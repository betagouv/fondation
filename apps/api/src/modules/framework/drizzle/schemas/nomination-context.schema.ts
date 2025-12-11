import { relations, sql } from 'drizzle-orm';
import {
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { StatutAffectation } from 'src/modules/session/domain/statut-affectation.enum';
import { formationEnum } from './shared-kernel.schema';
import { users } from './identity-and-access-context.schema';
import { PrioriteEnum } from 'shared-models';

export const nominationsContextSchema = pgSchema('nominations_context');

export const typeDeSaisineEnum = nominationsContextSchema.enum(
  'type_de_saisine',
  ['TRANSPARENCE_GDS'],
);

export const statutAffectationEnum = nominationsContextSchema.enum(
  'statut_affectation',
  Object.values(StatutAffectation) as [
    StatutAffectation,
    ...StatutAffectation[],
  ],
);

export const affectationPm = nominationsContextSchema.table(
  'affectation',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    sessionId: uuid('session_id').notNull(),
    version: integer('version').notNull().default(1),
    statut: statutAffectationEnum('statut')
      .notNull()
      .default(StatutAffectation.BROUILLON),
    datePublication: timestamp('date_publication'),
    auteurPublication: uuid('auteur_publication'),
    formation: formationEnum('formation').notNull(),
  },
  (table) => ({
    sessionVersionUnique: uniqueIndex().on(table.sessionId, table.version),
    sessionVersionIdx: index('idx_affectation_session_version').on(
      table.sessionId,
      table.version,
    ),
    oneBrouillonPerSessionIdx: index('idx_one_brouillon_per_session')
      .on(table.sessionId)
      .where(sql`${table.statut} = 'BROUILLON'`),
  }),
);

export const affectationRelations = relations(affectationPm, ({ many }) => ({
  affectations: many(drizzleNominationFileToReporterPm),
}));

export const préAnalysePm = nominationsContextSchema.table('pre_analyse', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  dossierDeNominationId: uuid('dossier_de_nomination_id').unique().notNull(),
  règles: jsonb('regles').array().notNull(),
});

export const sessionPm = nominationsContextSchema.table('session', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  version: integer('version').notNull().default(1),
  name: text('name').notNull(),
  formation: formationEnum('formation').notNull(),
  typeDeSaisine: typeDeSaisineEnum('type_de_saisine').notNull(),
  sessionImportéeId: text('session_import_id').unique().notNull(),
  content: jsonb('content').$type<object>().notNull(),
});

export const drizzlePrioriteEnum = pgEnum(
  'priorite_enum',
  Object.values(PrioriteEnum) as [PrioriteEnum, ...PrioriteEnum[]],
);

export const dossierDeNominationPm = nominationsContextSchema.table(
  'dossier_de_nomination',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    sessionId: uuid('session_id').notNull(),
    dossierDeNominationImportéId: uuid('dossier_de_nomination_import_id')
      .unique()
      .notNull(),
    // content: jsonb('content').notNull(),
    priorite: drizzlePrioriteEnum('priorite'),
    number: integer(),
    name: text(),
    rank: text(),
    grade: text(),
    observers: text()
      .array()
      .notNull()
      .default(sql`'{}'::TEXT[]`),
    dueDate: date('due_date'),
    biography: text(),
    birthDate: date('birth_date'),
    formation: formationEnum(),
    currentPosition: text('current_position'),
    targetedPosition: text('targeted_position'),
    lastRankingDate: date('last_ranking_date'),
    lastPositionDate: date('last_position_date'),
  },
);

export const drizzleNominationFileToReporterPm = nominationsContextSchema.table(
  'nomination_file_to_reporter',
  {
    versionId: uuid('version_id')
      .notNull()
      .references(() => affectationPm.id, {
        onDelete: 'cascade',
        onUpdate: 'no action',
      }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
        onUpdate: 'no action',
      }),
    nominationFileId: uuid('nomination_file_id')
      .notNull()
      .references(() => dossierDeNominationPm.id, {
        onDelete: 'cascade',
        onUpdate: 'no action',
      }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.versionId, t.userId, t.nominationFileId] }),
  }),
);

export const drizzleNominationFileToReporterRelations = relations(
  drizzleNominationFileToReporterPm,
  ({ one }) => ({
    user: one(users, {
      fields: [drizzleNominationFileToReporterPm.userId],
      references: [users.id],
    }),
    nominationFile: one(dossierDeNominationPm, {
      fields: [drizzleNominationFileToReporterPm.nominationFileId],
      references: [dossierDeNominationPm.id],
    }),
    version: one(affectationPm, {
      fields: [drizzleNominationFileToReporterPm.versionId],
      references: [affectationPm.id],
    }),
  }),
);
