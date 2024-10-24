import { eq } from 'drizzle-orm';
import { ReportRuleRepository } from 'src/reporter-context/business-logic/gateways/repositories/report-rule.repository';
import { ReportRule } from 'src/reporter-context/business-logic/models/report-rules';
import { DrizzleTransactionableAsync } from 'src/shared-kernel/adapters/secondary/providers/drizzle-transaction-performer';
import { buildConflictUpdateColumns } from 'src/shared-kernel/adapters/secondary/repositories/drizzle/drizzle-sql-preparation';
import { reportRules } from './schema/report-rule-pm';

export class SqlReportRuleRepository implements ReportRuleRepository {
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
        ruleGroup: row.ruleGroup,
        ruleName: row.ruleName,
        preValidated: row.preValidated,
        validated: row.validated,
        comment: row.comment,
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
          set: buildConflictUpdateColumns(reportRules, [
            'preValidated',
            'validated',
            'comment',
          ]),
        })
        .execute();
    };
  }

  static mapToDb(rule: ReportRule): typeof reportRules.$inferInsert {
    const ruleSnapshot = rule.toSnapshot();

    return {
      id: ruleSnapshot.id,
      reportId: ruleSnapshot.reportId,
      ruleGroup: ruleSnapshot.ruleGroup,
      ruleName: ruleSnapshot.ruleName,
      preValidated: ruleSnapshot.preValidated,
      validated: ruleSnapshot.validated,
      comment: ruleSnapshot.comment,
    };
  }
}
