import { sql } from 'drizzle-orm';
import { pgSchema, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const filesContextSchema = pgSchema('files_context');

export const filesStorageProviderEnum = filesContextSchema.enum(
  'storage_provider',
  ['SCALEWAY'],
);

export const filesPm = filesContextSchema.table('files', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  name: varchar('name').notNull(),
  bucket: varchar('bucket').notNull(),
  path: varchar('path').array(),
  storageProvider: filesStorageProviderEnum('storage_provider').notNull(),
});
