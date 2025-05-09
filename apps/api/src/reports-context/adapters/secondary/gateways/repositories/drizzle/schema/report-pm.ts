import { sql } from 'drizzle-orm';
import { integer, jsonb, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { NominationFile } from 'shared-models';
import { formationEnum } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/schema';
import { reportStateEnum } from './enums.drizzle';
import { reportsContextSchema } from './reports-context-schema.drizzle';

export const reports = reportsContextSchema.table('reports', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  reporterId: uuid('reporter_id').notNull(),
  nominationFileId: uuid('nomination_file_id').notNull(),
  sessionId: uuid('session_id').notNull(),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  state: reportStateEnum('state')
    .notNull()
    .default(NominationFile.ReportState.NEW),
  formation: formationEnum('formation').notNull(),
  comment: text('comment'),
  attachedFiles: jsonb('attached_files'),
});
