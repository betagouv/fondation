import { relations, sql } from 'drizzle-orm';
import {
  date,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { filesPm } from './file-context.schema';
import { formationEnum } from './shared-kernel.schema';
import { users } from './identity-and-access-context.schema';

export const dataAdministrationContextSchema = pgSchema(
  'data_administration_context',
);

export const nominationFiles = dataAdministrationContextSchema.table(
  'nomination_files',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    rowNumber: integer('row_number').notNull(),
    content: jsonb('content').notNull(),
  },
);

export const transparenceFilesPm = dataAdministrationContextSchema.table(
  'transparence_files',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    transparenceId: uuid('transparence_id')
      .notNull()
      .references(() => transparencesPm.id),
    fileId: uuid('file_id')
      .notNull()
      .references(() => filesPm.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
);

export const transparencesPm = dataAdministrationContextSchema.table(
  'transparences',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    formation: formationEnum('formation').notNull(),
    dateTransparence: timestamp('date_transparence').notNull(),
    dateEchéance: timestamp('date_echeance'),
    datePriseDePosteCible: timestamp('date_prise_de_poste'),
    dateClôtureDélaiObservation: timestamp(
      'date_cloture_delai_observation',
    ).notNull(),
    nominationFiles: jsonb('nomination_files').array().notNull(),
  },
  (t) => ({
    unique_name_formation_and_date: unique().on(
      t.name,
      t.formation,
      t.dateTransparence,
    ),
  }),
);

export const drizzleJurisdiction = dataAdministrationContextSchema.table(
  'jurisdictions',
  {
    codejur: text().notNull().primaryKey(),
    type_jur: text().notNull(),
    adr1: text(),
    adr2: text(),
    arrondissement: text(),
    codepos: text(),
    date_suppression: date({ mode: 'date' }),
    libelle: text(),
    ressort: text(),
    ville_jur: text(),
    ville: text(),
  },
);

export const drizzleMemberRule = dataAdministrationContextSchema.table(
  'member_rules',
  {
    userId: uuid()
      .notNull()
      .references(() => users.id, {
        onDelete: 'cascade',
        onUpdate: 'no action',
      }),
    excludedJurisdiction: text()
      .notNull()
      .references(() => drizzleJurisdiction.codejur, {
        onDelete: 'cascade',
        onUpdate: 'no action',
      }),
  },
  (t) => ({
    primaryKey: primaryKey({ columns: [t.userId, t.excludedJurisdiction] }),
  }),
);

export const drizzleMemberRuleRelations = relations(
  drizzleMemberRule,
  ({ one }) => ({
    user: one(users, {
      fields: [drizzleMemberRule.userId],
      references: [users.id],
    }),
    jurisdiction: one(drizzleJurisdiction, {
      fields: [drizzleMemberRule.excludedJurisdiction],
      references: [drizzleJurisdiction.codejur],
    }),
  }),
);
