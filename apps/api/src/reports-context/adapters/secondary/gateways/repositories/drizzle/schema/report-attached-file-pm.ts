import { sql } from 'drizzle-orm';
import { timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { reportsContextSchema } from './reports-context-schema.drizzle';

export const reportAttachedFiles = reportsContextSchema.table(
  'attached_files',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    reportId: uuid('report_id').notNull(),
    name: varchar('name').notNull(),
  },
);
