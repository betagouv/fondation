import { and, eq, sql } from 'drizzle-orm';
import { NominationFile } from 'shared-models';
import {
  ReportRetrievalQueried,
  ReportRetrievalQuery,
} from 'src/reports-context/business-logic/gateways/queries/report-retrieval-vm.query';
import { attachedFilesValidationSchema } from 'src/reports-context/business-logic/models/report-attached-files';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { reports } from './schema/report-pm'; // Drizzle ORM table definition
import { reportRules } from './schema/report-rule-pm'; // Drizzle ORM table definition

export class SqlReportRetrievalQuery implements ReportRetrievalQuery {
  constructor(private readonly db: DrizzleDb) {}

  async retrieveReport(
    id: string,
    reporterId: string,
  ): Promise<ReportRetrievalQueried | null> {
    const reportWithRules = await this.db
      .select({
        reportId: reports.id,
        folderNumber: reports.folderNumber,
        biography: reports.biography,
        dueDate: reports.dueDate,
        name: reports.name,
        birthDate: reports.birthDate,
        state: reports.state,
        formation: reports.formation,
        transparency: reports.transparency,
        grade: reports.grade,
        currentPosition: reports.currentPosition,
        targettedPosition: reports.targettedPosition,
        comment: reports.comment,
        rank: reports.rank,
        observers: reports.observers,
        observersCount: sql<number>`COALESCE(array_length(${reports.observers}, 1), 0)`,
        files: reports.attachedFiles,
        // Rule fields
        ruleId: reportRules.id,
        ruleGroup: reportRules.ruleGroup,
        ruleName: reportRules.ruleName,
        preValidated: reportRules.preValidated,
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
    const rules: NominationFile.Rules = reportWithRules.reduce(
      (acc: NominationFile.Rules, row) => {
        const ruleGroup = row.ruleGroup as NominationFile.RuleGroup;
        const ruleName = row.ruleName as NominationFile.RuleName;

        if (!ruleGroup || !ruleName) {
          return acc;
        }

        if (!acc[ruleGroup]) {
          acc[ruleGroup] = {} as any;
        }

        (
          acc[ruleGroup] as Record<
            NominationFile.RuleName,
            NominationFile.RuleValue
          >
        )[ruleName] = {
          id: row.ruleId,
          preValidated: row.preValidated,
          validated: row.validated,
        };

        return acc;
      },
      {} as NominationFile.Rules,
    );

    const reportRetrieval: ReportRetrievalQueried = {
      id: reportData.reportId,
      folderNumber: reportData.folderNumber,
      biography: reportData.biography,
      dueDate: reportData.dueDate
        ? DateOnly.fromDbDateOnlyString(reportData.dueDate).toJson()
        : null,
      name: reportData.name,
      birthDate: DateOnly.fromDbDateOnlyString(reportData.birthDate).toJson(),
      state: reportData.state,
      formation: reportData.formation,
      transparency: reportData.transparency,
      grade: reportData.grade,
      currentPosition: reportData.currentPosition,
      targettedPosition: reportData.targettedPosition,
      comment: reportData.comment ? reportData.comment : null,
      rank: reportData.rank,
      observers: reportData.observers,
      rules,
      files: attachedFilesValidationSchema.parse(reportData.files),
    };

    return reportRetrieval;
  }
}
