import { relations, sql } from 'drizzle-orm';
import { pgSchema, text, timestamp, varchar, uuid } from 'drizzle-orm/pg-core';

export const identityAndAccessContextSchema = pgSchema(
  'identity_and_access_context',
);

export const roleEnum = identityAndAccessContextSchema.enum('role', [
  'MEMBRE_DU_SIEGE',
  'MEMBRE_DU_PARQUET',
  'MEMBRE_COMMUN',
  'ADJOINT_SECRETAIRE_GENERAL',
]);

export const genderEnum = identityAndAccessContextSchema.enum('gender', [
  'MALE',
  'FEMALE',
]);

export const fileTypeEnum = identityAndAccessContextSchema.enum('file_type', [
  'PIECE_JOINTE_TRANSPARENCE',
  'PIECE_JOINTE_TRANSPARENCE_POUR_PARQUET',
  'PIECE_JOINTE_TRANSPARENCE_POUR_SIEGE',
]);

export const files = identityAndAccessContextSchema.table('files', {
  fileId: uuid('file_id').primaryKey(),
  type: fileTypeEnum('type').notNull(),
});

export const sessions = identityAndAccessContextSchema.table('sessions', {
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(),
  invalidatedAt: timestamp('invalidated_at'),
  sessionId: uuid('session_id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id),
});

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
  gender: genderEnum().notNull(),
});

export const sessionsUsersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
}));
