import { ReportRetrievalVMQuery } from 'src/reporter-context/business-logic/gateways/queries/report-retrieval-vm.query';
import { NominationFileManagementRule } from 'src/reporter-context/business-logic/models/nomination-file-report';
import { ReportRetrievalVM } from 'src/reporter-context/business-logic/models/report-retrieval-vm';
import {
  NominationFileRuleGroup,
  NominationFileRules,
} from 'src/reporter-context/business-logic/models/report-rules';
import { DataSource } from 'typeorm';
import { ReportPm } from './entities/report-pm';
import { ReportRulePm } from './entities/report-rule-pm';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';

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

    const rules: NominationFileRules = reportWithRules.reduce(
      (acc: NominationFileRules, row: any) => {
        const ruleGroup = row['rule_rule_group'] as NominationFileRuleGroup;
        const ruleName = row['rule_rule_name'] as NominationFileManagementRule;

        if (!acc[ruleGroup]) {
          acc[ruleGroup] =
            {} as NominationFileRules[NominationFileRuleGroup.MANAGEMENT];
        }

        acc[ruleGroup][ruleName] = {
          preValidated: row['rule_pre_validated'],
          validated: row['rule_validated'],
          comment: row['rule_comment'],
        };

        return acc;
      },
      {} as NominationFileRules,
    );

    const reportRetrievalVM: ReportRetrievalVM = {
      id: reportData['report_id'],
      biography: reportData['report_biography'],
      dueDate: reportData['report_due_date']
        ? DateOnly.fromString(reportData['report_due_date']).toViewModel()
        : null,
      name: reportData['report_name'],
      birthDate: DateOnly.fromString(
        reportData['report_birth_date'],
      ).toViewModel(),
      state: reportData['report_state'],
      formation: reportData['report_formation'],
      transparency: reportData['report_transparency'],
      grade: reportData['report_grade'],
      targettedPosition: reportData['report_targetted_position'],
      comments: reportData['report_comments']
        ? reportData['report_comments']
        : null,
      rules: rules, // Processed rules
    };

    return reportRetrievalVM;
  }
}
