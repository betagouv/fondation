import { sql } from 'drizzle-orm';
import {
  integer,
  jsonb,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

import { filesPm } from './file-context.schema';
import { formationEnum } from './shared-kernel.schema';

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
