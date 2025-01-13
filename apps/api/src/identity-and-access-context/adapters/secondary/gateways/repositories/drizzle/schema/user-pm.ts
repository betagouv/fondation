import { sql } from 'drizzle-orm';
import { uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { roleEnum } from './enums.drizzle';
import { identityAndAccessContextSchema } from './identity-and-access-context-schema.drizzle';

export const users = identityAndAccessContextSchema.table('users', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name').notNull(),
  role: roleEnum('role').notNull(),
  email: varchar('email').notNull().unique(),
  password: text('password').notNull(),
});
