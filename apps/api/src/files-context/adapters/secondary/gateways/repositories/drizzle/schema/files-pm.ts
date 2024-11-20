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
  storageProvider: filesStorageProviderEnum('storage_provider').notNull(),
  uri: varchar('uri').notNull(),
});
