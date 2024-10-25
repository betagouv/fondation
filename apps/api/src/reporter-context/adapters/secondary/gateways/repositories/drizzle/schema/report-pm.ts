import { sql } from 'drizzle-orm';
import { date, text, uuid, varchar } from 'drizzle-orm/pg-core';
import {
  formationEnum,
  gradeEnum,
  reportStateEnum,
  transparencyEnum,
} from './enums.drizzle';
import { reportsContextSchema } from './reports-context-schema.drizzle';
import { NominationFile } from 'shared-models';

export const reports = reportsContextSchema.table('reports', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  biography: text('biography'),
  dueDate: date('due_date'),
  name: varchar('name').notNull(),
  birthDate: date('birth_date').notNull(),
  state: reportStateEnum('state')
    .notNull()
    .default(NominationFile.ReportState.NEW),
  formation: formationEnum('formation').notNull(),
  transparency: transparencyEnum('transparency').notNull(),
  grade: gradeEnum('grade').notNull(),
  currentPosition: varchar('current_position').notNull(),
  targettedPosition: varchar('targetted_position').notNull(),
  comment: text('comment'),
  rank: varchar('rank').notNull(),
});
