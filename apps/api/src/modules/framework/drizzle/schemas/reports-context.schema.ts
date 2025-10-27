import { relations, sql } from 'drizzle-orm';
import {
  boolean,
  timestamp,
  uuid,
  integer,
  jsonb,
  pgEnum,
  pgSchema,
  text,
} from 'drizzle-orm/pg-core';
import { formationEnum } from './shared-kernel.schema';

export const reportsContextSchema = pgSchema('reports_context');

export const reportStateEnum = pgEnum('report_state', [
  'NEW',
  'IN_PROGRESS',
  'READY_TO_SUPPORT',
  'SUPPORTED',
]);

export const ruleGroupEnum = reportsContextSchema.enum('rule_group', [
  'management',
  'statutory',
  'qualitative',
]);

export const ruleNameEnum = reportsContextSchema.enum('rule_name', [
  'TRANSFER_TIME',
  'GETTING_GRADE_IN_PLACE',
  'JUDICIARY_ROLE_CHANGE_IN_SAME_RESSORT',
  'JUDICIARY_ROLE_CHANGE_IN_SAME_JURIDICTION',
  'GRADE_ON_SITE_AFTER_7_YEARS',
  'MINISTRY_OF_JUSTICE_IN_LESS_THAN_3_YEARS',
  'MINISTER_CABINET',
  'GRADE_REGISTRATION',
  'HH_WITHOUT_2_FIRST_GRADE_POSITIONS',
  'LEGAL_PROFESSION_IN_JUDICIAL_COURT_LESS_THAN_5_YEARS_AGO',
  'RETOUR_AVANT_5_ANS_DANS_FONCTION_SPECIALISEE_OCCUPEE_9_ANS',
  'NOMINATION_CA_AVANT_4_ANS',
  'CONFLICT_OF_INTEREST_PRE_MAGISTRATURE',
  'CONFLICT_OF_INTEREST_WITH_RELATIVE_PROFESSION',
  'EVALUATIONS',
  'DISCIPLINARY_ELEMENTS',
]);

export const reports = reportsContextSchema.table('reports', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  reporterId: uuid('reporter_id').notNull(),
  dossierDeNominationId: uuid('nomination_file_id').notNull(),
  sessionId: uuid('session_id').notNull(),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  state: reportStateEnum('state').notNull().default('NEW'),
  formation: formationEnum('formation').notNull(),
  comment: text('comment'),
  attachedFiles: jsonb('attached_files'),
});

export const reportRules = reportsContextSchema.table('report_rule', {
  id: uuid('id')
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  ruleGroup: ruleGroupEnum('rule_group').notNull(),
  ruleName: ruleNameEnum('rule_name').notNull(),
  validated: boolean('validated').notNull(),
  reportId: uuid('report_id')
    .notNull()
    .references(() => reports.id),
});

export const reportsRelations = relations(reports, ({ many }) => ({
  rules: many(reportRules),
}));

export const reportRulesRelations = relations(reportRules, ({ one }) => ({
  report: one(reports, {
    fields: [reportRules.reportId],
    references: [reports.id],
  }),
}));
