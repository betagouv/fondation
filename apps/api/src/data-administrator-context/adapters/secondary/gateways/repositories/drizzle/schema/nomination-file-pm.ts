import { sql } from 'drizzle-orm';
import { integer, jsonb, uuid } from 'drizzle-orm/pg-core';
import { dataAdministrationContextSchema } from './nomination-file-schema.drizzle';

export const nominationFiles = dataAdministrationContextSchema.table(
  'nomination_files',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    rowNumber: integer('row_number').notNull(),
    reportId: uuid('report_id'),
    content: jsonb('content').notNull(),
  },
);
