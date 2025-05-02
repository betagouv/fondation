import { jsonb, timestamp } from 'drizzle-orm/pg-core';
import { dataAdministrationContextSchema } from './nomination-file-schema.drizzle';
import {
  formationEnum,
  transparencyEnum,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';

export const transparencesPm = dataAdministrationContextSchema.table(
  'transparences',
  {
    id: transparencyEnum('id').primaryKey().notNull(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    formations: formationEnum('formations').array().notNull(),
    nominationFiles: jsonb('nomination_files_ids').array().notNull(),
  },
);
