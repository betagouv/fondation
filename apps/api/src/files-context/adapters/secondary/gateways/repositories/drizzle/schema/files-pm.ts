import { sql } from 'drizzle-orm';
import { timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { filesStorageProviderEnum } from './enums.drizzle';
import { filesContextSchema } from './schema';

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
