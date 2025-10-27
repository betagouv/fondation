import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';
import { StatutAffectation } from 'src/nominations-context/sessions/business-logic/models/affectation';
import { formationEnum } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';
import { statutAffectationEnum } from './enums';
import { nominationsContextSchema } from './nominations-context-schema.drizzle';

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
    sessionVersionUnique: unique().on(table.sessionId, table.version),
    sessionVersionIdx: index('idx_affectation_session_version').on(
      table.sessionId,
      table.version,
    ),
    oneBrouillonPerSessionIdx: index('idx_one_brouillon_per_session')
      .on(table.sessionId)
      .where(sql`${table.statut} = 'BROUILLON'`),
  }),
);
