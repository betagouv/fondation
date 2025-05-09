import { sql } from 'drizzle-orm';
import { integer, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { formationEnum } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';
import { nominationsContextSchema } from './nominations-context-schema.drizzle';
import { typeDeSaisineEnum } from './enums';

export const sessionPm = nominationsContextSchema.table('session', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  version: integer('version').notNull().default(1),
  name: text('name').notNull(),
  formations: formationEnum('formations').array().notNull(),
  typeDeSaisine: typeDeSaisineEnum('type_de_saisine').notNull(),
});
