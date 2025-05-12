import { sql } from 'drizzle-orm';
import { jsonb, timestamp, uuid } from 'drizzle-orm/pg-core';
import { nominationsContextSchema } from './nominations-context-schema.drizzle';

export const préAnalysePm = nominationsContextSchema.table('pre_analyse', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  dossierDeNominationId: uuid('dossier_de_nomination_id').notNull(),
  règles: jsonb('regles').array().notNull(),
});
