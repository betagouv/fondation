import { NominationFile, ReportRetrievalVM } from 'shared-models';
import { NominationFileReport } from 'src/reports-context/business-logic/models/nomination-file-report';
import { ReportRetrievalVMBuilder } from 'src/reports-context/business-logic/models/report-retrieval-vm.builder';
import { ReportRule } from 'src/reports-context/business-logic/models/report-rules';
import { ReportRuleBuilder } from 'src/reports-context/business-logic/models/report-rules.builder';
import { ReportBuilder } from 'src/reports-context/business-logic/models/report.builder';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { clearDB } from 'test/docker-postgresql-manager';
import { reports } from './schema/report-pm';
import { reportRules } from './schema/report-rule-pm';
import { SqlReportRetrievalVMQuery } from './sql-report-retrieval-vm.query';
import { SqlNominationFileReportRepository } from './sql-nomination-file-report.repository'; // For mapping functions
import { SqlReportRuleRepository } from './sql-report-rule.repository'; // For mapping functions
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';

describe('SQL Report Retrieval VM Query', () => {
  let db: DrizzleDb;
  let sqlReportRetrievalVMQuery: SqlReportRetrievalVMQuery;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlReportRetrievalVMQuery = new SqlReportRetrievalVMQuery(db);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('throws an error if no report', async () => {
    await expect(
      sqlReportRetrievalVMQuery.retrieveReport('unknown-id'),
    ).rejects.toThrow();
  });

  describe('when there is a report', () => {
    let aReport: NominationFileReport;
    let aReportRule: ReportRule;

    beforeEach(async () => {
      aReport = new ReportBuilder()
        .with('id', 'cd1619e2-263d-49b6-b928-6a04ee681132')
        .with('nominationFileId', 'ca1619e2-263d-49b6-b928-6a04ee681138')
        .with('dueDate', new DateOnly(2030, 10, 1))
        .with('birthDate', new DateOnly(1980, 1, 1))
        .build();
      // Insert the report into the database
      const reportRow = SqlNominationFileReportRepository.mapToDb(aReport);
      await db.insert(reports).values(reportRow).execute();

      aReportRule = await givenSomeRuleExists(aReport.id);
    });

    it('retrieves a report', async () => {
      const expectedRules = prepareExpectedRules(aReportRule);
      const result = await sqlReportRetrievalVMQuery.retrieveReport(aReport.id);
      expect(result).toEqual<ReportRetrievalVM>(
        ReportRetrievalVMBuilder.fromWriteModel(aReport)
          .with('rules', expectedRules)
          .build(),
      );
    });
  });

  describe('when there is a report with empty information', () => {
    let aReport: NominationFileReport;
    let aReportRule: ReportRule;

    beforeEach(async () => {
      aReport = new ReportBuilder()
        .with('id', 'cd1619e2-263d-49b6-b928-6a04ee681132')
        .with('nominationFileId', 'ca1619e2-263d-49b6-b928-6a04ee681138')
        .with('dueDate', null)
        .with('comment', null)
        .build();
      // Insert the report into the database
      const reportRow = SqlNominationFileReportRepository.mapToDb(aReport);
      await db.insert(reports).values(reportRow).execute();

      aReportRule = await givenSomeRuleExists(aReport.id);
    });

    it('retrieves with empty values', async () => {
      const expectedRules = prepareExpectedRules(aReportRule);
      const result = await sqlReportRetrievalVMQuery.retrieveReport(aReport.id);
      expect(result).toEqual(
        ReportRetrievalVMBuilder.fromWriteModel(aReport)
          .with('dueDate', null)
          .with('comment', null)
          .with('rules', expectedRules)
          .build(),
      );
    });
  });

  const prepareExpectedRules = (reportRule: ReportRule) => {
    const reportRuleSnapshot = reportRule.toSnapshot();
    const ruleValue: NominationFile.RuleValue = {
      id: reportRuleSnapshot.id,
      preValidated: reportRuleSnapshot.preValidated,
      validated: reportRuleSnapshot.validated,
      comment: reportRuleSnapshot.comment,
    };
    return {
      [reportRuleSnapshot.ruleGroup]: {
        [reportRuleSnapshot.ruleName]: ruleValue,
      },
    } as NominationFile.Rules;
  };

  const givenSomeRuleExists = async (reportId: string) => {
    const aReportRule = new ReportRuleBuilder()
      .with('id', 'da1619e2-263d-49b6-b928-6a04ee681132')
      .with('reportId', reportId)
      .build();

    // Insert the report rule into the database
    const ruleRow = SqlReportRuleRepository.mapToDb(aReportRule);
    await db.insert(reportRules).values(ruleRow).execute();

    return aReportRule;
  };
});
