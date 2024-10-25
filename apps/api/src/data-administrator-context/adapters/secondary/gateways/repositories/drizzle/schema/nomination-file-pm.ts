import { sql } from 'drizzle-orm';
import { integer, jsonb, timestamp, uuid } from 'drizzle-orm/pg-core';
import { dataAdministrationContextSchema } from './nomination-file-schema.drizzle';

export const nominationFiles = dataAdministrationContextSchema.table(
  'nomination_files',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    rowNumber: integer('row_number').notNull(),
    reportId: uuid('report_id'),
    content: jsonb('content').notNull(),
  },
);
