import { and, eq } from 'drizzle-orm';
import { NominationFile } from 'shared-models';
import { ReportRuleRepository } from 'src/reports-context/business-logic/gateways/repositories/report-rule.repository';
import {
  ReportRule,
  ReportRuleSnapshot,
} from 'src/reports-context/business-logic/models/report-rules';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { buildConflictUpdateColumns } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-sql-preparation';
import { reportRules } from './schema/report-rule-pm';

export class SqlReportRuleRepository implements ReportRuleRepository {
  byName(
    reportId: string,
    ruleGroup: NominationFile.RuleGroup,
    ruleName: NominationFile.RuleName,
  ): DrizzleTransactionableAsync<ReportRule | null> {
    return async (trx) => {
      const result = await trx
        .select()
        .from(reportRules)
        .where(
          and(
            eq(reportRules.reportId, reportId),
            eq(reportRules.ruleGroup, ruleGroup),
            eq(reportRules.ruleName, ruleName),
          ),
        )
        .limit(1)
        .execute();

      if (result.length === 0) return null;
      const row = result[0];
      if (!row) return null;

      return this.toDomain(row);
    };
  }
  byId(id: string): DrizzleTransactionableAsync<ReportRule | null> {
    return async (trx) => {
      const result = await trx
        .select()
        .from(reportRules)
        .where(eq(reportRules.id, id))
        .limit(1)
        .execute();

      if (result.length === 0) return null;
      const row = result[0];
      if (!row) return null;

      const reportRuleSnapshot = {
        id: row.id,
        createdAt: row.createdAt,
        ruleGroup: row.ruleGroup,
        ruleName: row.ruleName,
        validated: row.validated,
        reportId: row.reportId,
      };
      return ReportRule.fromSnapshot(reportRuleSnapshot);
    };
  }

  save(reportRule: ReportRule): DrizzleTransactionableAsync<void> {
    return async (trx) => {
      const reportRuleRow = SqlReportRuleRepository.mapToDb(reportRule);
      await trx
        .insert(reportRules)
        .values(reportRuleRow)
        .onConflictDoUpdate({
          target: reportRules.id,
          set: buildConflictUpdateColumns(reportRules, ['validated']),
        })
        .execute();
    };
  }

  static mapToDb(rule: ReportRule): typeof reportRules.$inferInsert {
    return SqlReportRuleRepository.mapSnapshotToDb(rule.toSnapshot());
  }

  static mapSnapshotToDb(
    reportSnapshot: ReportRuleSnapshot,
  ): typeof reportRules.$inferInsert {
    return reportSnapshot;
  }

  toDomain(reportRule: typeof reportRules.$inferSelect): ReportRule {
    return ReportRule.fromSnapshot(reportRule);
  }
}
