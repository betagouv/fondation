import { sql } from 'drizzle-orm';
import { jsonb, timestamp, uuid } from 'drizzle-orm/pg-core';
import { nominationsContextSchema } from './nominations-context-schema.drizzle';

export const dossierDeNominationPm = nominationsContextSchema.table(
  'dossier_de_nomination',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    sessionId: uuid('session_id').notNull(),
    dossierDeNominationImportéId: uuid(
      'dossier_de_nomination_importe_id',
    ).notNull(),
    content: jsonb('content').notNull(),
  },
);
