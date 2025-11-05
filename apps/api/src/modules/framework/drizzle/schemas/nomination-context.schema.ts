import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { StatutAffectation } from 'src/nominations-context/sessions/business-logic/models/affectation';
import { formationEnum } from './shared-kernel.schema';

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
    sessionVersionIdx: index('idx_affectation_session_version').on(
      table.sessionId,
      table.version,
    ),
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
  },
);
