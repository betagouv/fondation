import { sql } from 'drizzle-orm';
import { integer, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { SessionContent } from 'src/nominations-context/sessions/business-logic/models/session';
import { formationEnum } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';
import { typeDeSaisineEnum } from './enums';
import { nominationsContextSchema } from './nominations-context-schema.drizzle';

export const sessionPm = nominationsContextSchema.table('session', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  version: integer('version').notNull().default(1),
  name: text('name').notNull(),
  formation: formationEnum('formation').notNull(),
  typeDeSaisine: typeDeSaisineEnum('type_de_saisine').notNull(),
  sessionImportéeId: text('session_import_id').unique().notNull(),
  content: jsonb('content').$type<SessionContent>().notNull(),
});
