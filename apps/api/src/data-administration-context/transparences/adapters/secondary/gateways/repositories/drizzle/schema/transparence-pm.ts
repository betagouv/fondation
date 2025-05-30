import { sql } from 'drizzle-orm';
import { jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
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
    nominationFiles: jsonb('nomination_files').array().notNull(),
  },
);
