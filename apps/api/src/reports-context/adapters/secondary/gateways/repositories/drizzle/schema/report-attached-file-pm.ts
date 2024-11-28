import { primaryKey, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { reportsContextSchema } from './reports-context-schema.drizzle';

export const reportAttachedFiles = reportsContextSchema.table(
  'attached_files',
  {
    createdAt: timestamp('created_at').notNull().defaultNow(),
    reportId: uuid('report_id').notNull(),
    name: varchar('name').notNull(),
    fileId: varchar('file_id').notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.reportId, table.name] }),
  }),
);
