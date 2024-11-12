import { sql } from 'drizzle-orm';
import { boolean, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { ruleGroupEnum, ruleNameEnum } from './enums.drizzle';
import { reports } from './report-pm';
import { reportsContextSchema } from './reports-context-schema.drizzle';

export const reportRules = reportsContextSchema.table('report_rule', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  ruleGroup: ruleGroupEnum('rule_group').notNull(),
  ruleName: ruleNameEnum('rule_name').notNull(),
  preValidated: boolean('pre_validated').notNull(),
  validated: boolean('validated').notNull(),
  comment: text('comment'),
  reportId: uuid('report_id')
    .notNull()
    .references(() => reports.id),
});