import { and, eq } from 'drizzle-orm';
import { NominationFile } from 'shared-models';
import {
  ReportRetrievalQueried,
  ReportRetrievalQuery,
} from 'src/reports-context/business-logic/gateways/queries/report-retrieval-vm.query';
import { attachedFilesValidationSchema } from 'src/reports-context/business-logic/models/report-attached-files';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { reports } from './schema/report-pm';
import { reportRules } from './schema/report-rule-pm';

type RuleValue = Omit<NominationFile.RuleValue, 'preValidated'>;

export class SqlReportRetrievalQuery implements ReportRetrievalQuery {
  constructor(private readonly db: DrizzleDb) {}

  async retrieveReport(
    id: string,
    reporterId: string,
  ): Promise<ReportRetrievalQueried | null> {
    const reportWithRules = await this.db
      .select({
        reportId: reports.id,
        dossierDeNominationId: reports.nominationFileId,
        sessionId: reports.sessionId,
        state: reports.state,
        formation: reports.formation,
        comment: reports.comment,
        files: reports.attachedFiles,
        // Rule fields
        ruleId: reportRules.id,
        ruleGroup: reportRules.ruleGroup,
        ruleName: reportRules.ruleName,
        validated: reportRules.validated,
      })
      .from(reports)
      .innerJoin(reportRules, eq(reportRules.reportId, reports.id))
      .where(and(eq(reports.id, id), eq(reports.reporterId, reporterId)))
      .execute();

    if (!reportWithRules.length) {
      return null;
    }

    const reportData = reportWithRules[0];
    if (!reportData) {
      return null;
    }
    const rules: NominationFile.Rules<RuleValue> = reportWithRules.reduce(
      (acc: NominationFile.Rules<RuleValue>, row) => {
        const ruleGroup = row.ruleGroup as NominationFile.RuleGroup;
        const ruleName = row.ruleName as NominationFile.RuleName;

        if (!ruleGroup || !ruleName) {
          return acc;
        }

        if (!acc[ruleGroup]) {
          acc[ruleGroup] = {} as any;
        }

        (acc[ruleGroup] as Record<NominationFile.RuleName, RuleValue>)[
          ruleName
        ] = {
          id: row.ruleId,
          validated: row.validated,
        };

        return acc;
      },
      {} as NominationFile.Rules<RuleValue>,
    );

    const reportRetrieval: ReportRetrievalQueried = {
      id: reportData.reportId,
      dossierDeNominationId: reportData.dossierDeNominationId,
      sessionId: reportData.sessionId,
      state: reportData.state,
      formation: reportData.formation,
      comment: reportData.comment ? reportData.comment : null,
      rules,
      files: attachedFilesValidationSchema.parse(reportData.files),
    };

    return reportRetrieval;
  }
}
