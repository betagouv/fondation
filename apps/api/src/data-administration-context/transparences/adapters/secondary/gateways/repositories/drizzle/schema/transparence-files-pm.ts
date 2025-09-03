import { sql } from 'drizzle-orm';
import { timestamp, uuid } from 'drizzle-orm/pg-core';
import { filesPm } from 'src/files-context/adapters/secondary/gateways/repositories/drizzle/schema/files-pm';
import { dataAdministrationContextSchema } from './nomination-file-schema.drizzle';
import { transparencesPm } from './transparence-pm';

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
