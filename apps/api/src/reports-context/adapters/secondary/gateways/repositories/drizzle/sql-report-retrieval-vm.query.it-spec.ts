import { NominationFile } from 'shared-models';
import { ReportRetrievalQueried } from 'src/reports-context/business-logic/gateways/queries/report-retrieval-vm.query';
import { NominationFileReportSnapshot } from 'src/reports-context/business-logic/models/nomination-file-report';
import { ReportAttachedFileBuilder } from 'src/reports-context/business-logic/models/report-attached-file.builder';
import { ReportRetrievalBuilder } from 'src/reports-context/business-logic/models/report-retrieval-vm.builder';
import {
  ReportRule,
  ReportRuleSnapshot,
} from 'src/reports-context/business-logic/models/report-rules';
import { ReportRuleBuilder } from 'src/reports-context/business-logic/models/report-rules.builder';
import { ReportBuilder } from 'src/reports-context/business-logic/models/report.builder';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { clearDB } from 'test/docker-postgresql-manager';
import { reports } from './schema/report-pm';
import { reportRules } from './schema/report-rule-pm';
import { SqlReportRetrievalQuery } from './sql-report-retrieval-vm.query';
import { SqlReportRuleRepository } from './sql-report-rule.repository';
import { SqlReportRepository } from './sql-report.repository';
import {
  GivenSomeReports,
  givenSomeReportsFactory,
} from 'test/bounded-contexts/reports';

describe('SQL Report Retrieval VM Query', () => {
  let db: DrizzleDb;
  let sqlReportRetrievalVMQuery: SqlReportRetrievalQuery;
  let givenSomeReports: GivenSomeReports;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
    givenSomeReports = givenSomeReportsFactory(db);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlReportRetrievalVMQuery = new SqlReportRetrievalQuery(db);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('throws an error if no report', async () => {
    await expect(
      sqlReportRetrievalVMQuery.retrieveReport('unknown-id', 'reporter-id'),
    ).rejects.toThrow();
  });

  describe('when there is a report', () => {
    it('retrieves a report', async () => {
      const aReport = new ReportBuilder('uuid')
        .with('dueDate', new DateOnly(2030, 10, 1))
        .with('observers', ['observer1'])
        .build();
      await givenSomeReports(aReport);
      const aReportRuleSnapshot = await givenSomeRule(aReport.id);

      const result = await sqlReportRetrievalVMQuery.retrieveReport(
        aReport.id,
        aReport.reporterId!,
      );

      expect(result).toEqual<ReportRetrievalQueried>(
        ReportRetrievalBuilder.fromWriteSnapshot<ReportRetrievalQueried>(
          aReport,
        )
          .with('rules', prepareExpectedRules(aReportRuleSnapshot))
          .buildQueried(),
      );
    });

    it("doesn't return a report not owned by the reporter", async () => {
      const aReport = new ReportBuilder('uuid').build();
      const aReportNotOwned = new ReportBuilder('uuid')
        .with('id', 'cd1619e2-263d-49b6-b928-6a04ee681133')
        .with('reporterId', 'ad1619e2-263d-49b6-b928-6a04ee681133')
        .with('nominationFileId', 'ca1619e2-263d-49b6-b928-6a04ee681139')
        .with('dueDate', new DateOnly(2040, 5, 1))
        .build();
      await givenSomeReports(aReport, aReportNotOwned);

      const result = await sqlReportRetrievalVMQuery.retrieveReport(
        aReportNotOwned.id,
        aReport.reporterId!,
      );

      expect(result).toBeNull();
    });

    it('retrieves a report with its file', async () => {
      const anAttachedFile = new ReportAttachedFileBuilder().build();
      const aReport = new ReportBuilder('uuid')
        .with('attachedFiles', [anAttachedFile])
        .build();
      await givenSomeReports(aReport);
      const aReportRuleSnapshot = await givenSomeRule(aReport.id);

      const result = await sqlReportRetrievalVMQuery.retrieveReport(
        aReport.id,
        aReport.reporterId!,
      );

      const aReportQueried: ReportRetrievalQueried =
        ReportRetrievalBuilder.fromWriteSnapshot<ReportRetrievalQueried>(
          aReport,
        )
          .with('files', [anAttachedFile])
          .with('rules', prepareExpectedRules(aReportRuleSnapshot))
          .buildQueried();
      expect(result).toEqual<ReportRetrievalQueried>(aReportQueried);
    });
  });

  describe('when there is a report with empty information', () => {
    let aReport: NominationFileReportSnapshot;
    let aReportRuleSnapshot: ReportRuleSnapshot;

    beforeEach(async () => {
      aReport = new ReportBuilder('uuid')
        .with('dueDate', null)
        .with('comment', null)
        .build();
      // Insert the report into the database
      const reportRow = SqlReportRepository.mapSnapshotToDb(aReport);
      await db.insert(reports).values(reportRow).execute();

      aReportRuleSnapshot = await givenSomeRule(aReport.id);
    });

    it('retrieves with empty values', async () => {
      const expectedRules = prepareExpectedRules(aReportRuleSnapshot);
      const result = await sqlReportRetrievalVMQuery.retrieveReport(
        aReport.id,
        aReport.reporterId!,
      );
      expect(result).toEqual<ReportRetrievalQueried>(
        ReportRetrievalBuilder.fromWriteSnapshot<ReportRetrievalQueried>(
          aReport,
        )
          .with('dueDate', null)
          .with('comment', null)
          .with('rules', expectedRules)
          .buildQueried(),
      );
    });
  });

  const prepareExpectedRules = (reportRuleSnapshot: ReportRuleSnapshot) => {
    const ruleValue: NominationFile.RuleValue = {
      id: reportRuleSnapshot.id,
      preValidated: reportRuleSnapshot.preValidated,
      validated: reportRuleSnapshot.validated,
    };
    return {
      [reportRuleSnapshot.ruleGroup]: {
        [reportRuleSnapshot.ruleName]: ruleValue,
      },
    } as NominationFile.Rules;
  };

  const givenSomeRule = async (reportId: string) => {
    const aReportRuleSnapshot = new ReportRuleBuilder()
      .with('id', 'da1619e2-263d-49b6-b928-6a04ee681132')
      .with('reportId', reportId)
      .build();

    // Insert the report rule into the database
    const ruleRow = SqlReportRuleRepository.mapToDb(
      ReportRule.fromSnapshot(aReportRuleSnapshot),
    );
    await db.insert(reportRules).values(ruleRow).execute();

    return aReportRuleSnapshot;
  };
});
