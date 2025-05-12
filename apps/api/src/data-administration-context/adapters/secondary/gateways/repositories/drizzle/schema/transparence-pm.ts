import { jsonb, timestamp, uuid } from 'drizzle-orm/pg-core';
import { dataAdministrationContextSchema } from './nomination-file-schema.drizzle';
import {
  formationEnum,
  transparencyEnum,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';
import { sql } from 'drizzle-orm';

export const transparencesPm = dataAdministrationContextSchema.table(
  'transparences',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: transparencyEnum('name').unique().notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    formations: formationEnum('formations').array().notNull(),
    nominationFiles: jsonb('nomination_files').array().notNull(),
  },
);
