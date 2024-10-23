import { relations } from 'drizzle-orm';
import { reports } from './report-pm';
import { reportRules } from './report-rule-pm';

export const reportsRelations = relations(reports, ({ many }) => ({
  rules: many(reportRules),
}));

export const reportRulesRelations = relations(reportRules, ({ one }) => ({
  report: one(reports, {
    fields: [reportRules.reportId],
    references: [reports.id],
  }),
}));
