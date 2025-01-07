import { sql } from 'drizzle-orm';
import { timestamp, uuid } from 'drizzle-orm/pg-core';
import { identityAndAccessContextSchema } from './identity-and-access-context-schema.drizzle';
import { users } from './user-pm';

export const sessions = identityAndAccessContextSchema.table('sessions', {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  sessionId: uuid('session_id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
});
