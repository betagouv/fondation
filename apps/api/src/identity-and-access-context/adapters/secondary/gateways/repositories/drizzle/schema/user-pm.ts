import { sql } from 'drizzle-orm';
import { uuid, varchar, text } from 'drizzle-orm/pg-core';
import { roleEnum } from './enums.drizzle';
import { identityAndAccessContextSchema } from './identity-and-access-context-schema.drizzle';

export const users = identityAndAccessContextSchema.table('users', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  firstName: varchar('first_name').notNull(),
  lastName: varchar('last_name').notNull(),
  role: roleEnum('role').notNull(),
  email: varchar('email').notNull(),
  password: text('password').notNull(),
});
