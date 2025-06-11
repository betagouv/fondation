import { sql } from 'drizzle-orm';
import { jsonb, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { formationEnum } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';
import { dataAdministrationContextSchema } from './nomination-file-schema.drizzle';

export const transparencesPm = dataAdministrationContextSchema.table(
  'transparences',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: text('name').notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    formation: formationEnum('formation').notNull(),
    dateTransparence: timestamp('date_emission_gds').notNull(),
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
