import { NominationFile, ReportRetrievalVM } from '@/shared-models';
import { ReportRetrievalVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-retrieval-vm.query';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { DataSource } from 'typeorm';
import { ReportPm } from './entities/report-pm';
import { ReportRulePm } from './entities/report-rule-pm';

export class SqlReportRetrievalVMQuery implements ReportRetrievalVMQuery {
  constructor(private readonly dataSource: DataSource) {}

  async retrieveReport(id: string): Promise<ReportRetrievalVM | null> {
    const reportRepository = this.dataSource.getRepository(ReportPm);

    // Fetch the report and its associated rules using a LEFT JOIN
    const reportWithRules = await reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect(ReportRulePm, 'rule', 'rule.reportId = report.id')
      .where('report.id = :id', { id })
      .getRawMany();

    if (!reportWithRules.length) {
      return null;
    }

    const reportData = reportWithRules[0];

    const rules: NominationFile.Rules = reportWithRules.reduce(
      (acc: NominationFile.Rules, row: any) => {
        const ruleGroup = row['rule_rule_group'] as NominationFile.RuleGroup;
        const ruleName = row['rule_rule_name'] as NominationFile.RuleName;
        if (!acc[ruleGroup]) {
          acc[ruleGroup] = {} as any;
        }

        (
          acc[ruleGroup] as Record<
            NominationFile.RuleName,
            NominationFile.RuleValue
          >
        )[ruleName] = {
          id: row['rule_id'],
          preValidated: row['rule_pre_validated'],
          validated: row['rule_validated'],
          comment: row['rule_comment'],
        };

        return acc;
      },
      {} as NominationFile.Rules,
    );

    const reportRetrievalVM: ReportRetrievalVM = {
      id: reportData['report_id'],
      biography: reportData['report_biography'],
      dueDate: reportData['report_due_date']
        ? DateOnly.fromDate(reportData['report_due_date']).toJson()
        : null,
      name: reportData['report_name'],
      birthDate: DateOnly.fromDate(reportData['report_birth_date']).toJson(),
      state: reportData['report_state'],
      formation: reportData['report_formation'],
      transparency: reportData['report_transparency'],
      grade: reportData['report_grade'],
      currentPosition: reportData['report_current_position'],
      targettedPosition: reportData['report_targetted_position'],
      comment: reportData['report_comments']
        ? reportData['report_comments']
        : null,
      rank: reportData['report_rank'],
      rules,
    };

    return reportRetrievalVM;
  }
}
