import { sql } from 'drizzle-orm';
import { jsonb, timestamp, uuid } from 'drizzle-orm/pg-core';
import { formationEnum } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';
import { nominationsContextSchema } from './nominations-context-schema.drizzle';

export const affectationPm = nominationsContextSchema.table('affectation', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  sessionId: uuid('session_id').notNull(),
  formation: formationEnum('formation').notNull(),
  affectationsDossiersDeNominations: jsonb(
    'affectations_dossiers_de_nominations',
  )
    .array()
    .notNull(),
});
