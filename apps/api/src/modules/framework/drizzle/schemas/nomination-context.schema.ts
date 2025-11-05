import { relations, sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { users } from './identity-and-access-context.schema';
import { formationEnum } from './shared-kernel.schema';

import { StatutAffectation } from 'src/nominations-context/sessions/business-logic/models/affectation';

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
    affectationsDossiersDeNominations: jsonb(
      'affectations_dossiers_de_nominations',
    )
      .array()
      .notNull(),
  },
  (table) => ({
    sessionVersionUnique: uniqueIndex().on(table.sessionId, table.version),
    oneBrouillonPerSessionIdx: index('idx_one_brouillon_per_session')
      .on(table.sessionId)
      .where(sql`${table.statut} = 'BROUILLON'`),
  }),
);

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

export const drizzlePrioriteEnum = nominationsContextSchema.enum(
  'priorite_enum',
  ['ETOILE', 'OUTRE_MER', 'PROFILE'],
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
    content: jsonb('content').notNull(),
    priority: drizzlePrioriteEnum(),
  },
);

export const drizzleDossierRapporteur = nominationsContextSchema.table(
  'dossier_rapporteur',
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    dossierId: uuid()
      .notNull()
      .references(() => dossierDeNominationPm.id, {
        onDelete: 'cascade',
      }),
    versionId: uuid()
      .notNull()
      .references(() => affectationPm.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    userIdx: index().on(t.userId),
    primaryKey: primaryKey({ columns: [t.dossierId, t.userId, t.versionId] }),
  }),
);

export const drizzleDossierRapporteurRelations = relations(
  drizzleDossierRapporteur,
  ({ one }) => ({
    dossierDeNomination: one(dossierDeNominationPm, {
      fields: [drizzleDossierRapporteur.dossierId],
      references: [dossierDeNominationPm.id],
    }),
    user: one(users, {
      fields: [drizzleDossierRapporteur.userId],
      references: [users.id],
    }),
    version: one(affectationPm, {
      fields: [drizzleDossierRapporteur.versionId],
      references: [affectationPm.id],
    }),
  }),
);

export const drizzleDossierDeNominationRelations = relations(
  dossierDeNominationPm,
  ({ many }) => ({ rapporteurs: many(drizzleDossierRapporteur) }),
);

export const drizzleAffectationRelations = relations(
  affectationPm,
  ({ many }) => ({ rapporteurs: many(drizzleDossierRapporteur) }),
);
