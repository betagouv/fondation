import { NominationFile } from 'shared-models';
import { ReportRetrievalQueried } from 'src/reports-context/business-logic/gateways/queries/report-retrieval-vm.query';
import { NominationFileReportSnapshot } from 'src/reports-context/business-logic/models/nomination-file-report';
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
import { reportAttachedFiles } from './schema';
import { reports } from './schema/report-pm';
import { reportRules } from './schema/report-rule-pm';
import { SqlReportRetrievalQuery } from './sql-report-retrieval-vm.query';
import { SqlReportRuleRepository } from './sql-report-rule.repository';
import { SqlReportRepository } from './sql-report.repository';

describe('SQL Report Retrieval VM Query', () => {
  let db: DrizzleDb;
  let sqlReportRetrievalVMQuery: SqlReportRetrievalQuery;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
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
      sqlReportRetrievalVMQuery.retrieveReport('unknown-id'),
    ).rejects.toThrow();
  });

  describe('when there is a report', () => {
    let aReport: NominationFileReportSnapshot;
    let aReportRuleSnapshot: ReportRuleSnapshot;

    beforeEach(async () => {
      aReport = new ReportBuilder()
        .with('id', 'cd1619e2-263d-49b6-b928-6a04ee681132')
        .with('nominationFileId', 'ca1619e2-263d-49b6-b928-6a04ee681138')
        .with('dueDate', new DateOnly(2030, 10, 1))
        .with('birthDate', new DateOnly(1980, 1, 1))

        .build();
      const reportRow = SqlReportRepository.mapSnapshotToDb(aReport);
      await db.insert(reports).values(reportRow).execute();

      aReportRuleSnapshot = await givenSomeRuleExists(aReport.id);
    });

    it('retrieves a report', async () => {
      const expectedRules = prepareExpectedRules(aReportRuleSnapshot);
      const result = await sqlReportRetrievalVMQuery.retrieveReport(aReport.id);
      expect(result).toEqual<ReportRetrievalQueried>(
        ReportRetrievalBuilder.fromWriteSnapshot<ReportRetrievalQueried>(
          aReport,
        )
          .with('rules', expectedRules)
          .buildQueried(),
      );
    });

    it('retrieves a report with its file', async () => {
      const fileName = 'file.txt';
      const expectedRules = prepareExpectedRules(aReportRuleSnapshot);
      await db
        .insert(reportAttachedFiles)
        .values({
          reportId: aReport.id,
          name: fileName,
        })
        .execute();

      const result = await sqlReportRetrievalVMQuery.retrieveReport(aReport.id);

      const aReportQueried: ReportRetrievalQueried =
        ReportRetrievalBuilder.fromWriteSnapshot<ReportRetrievalQueried>(
          aReport,
        )
          .with('rules', expectedRules)
          .with('attachedFileNames', [fileName])
          .buildQueried();
      expect(result).toEqual<ReportRetrievalQueried>(aReportQueried);
    });
  });

  describe('when there is a report with empty information', () => {
    let aReport: NominationFileReportSnapshot;
    let aReportRuleSnapshot: ReportRuleSnapshot;

    beforeEach(async () => {
      aReport = new ReportBuilder()
        .with('id', 'cd1619e2-263d-49b6-b928-6a04ee681132')
        .with('nominationFileId', 'ca1619e2-263d-49b6-b928-6a04ee681138')
        .with('dueDate', null)
        .with('comment', null)
        .build();
      // Insert the report into the database
      const reportRow = SqlReportRepository.mapSnapshotToDb(aReport);
      await db.insert(reports).values(reportRow).execute();

      aReportRuleSnapshot = await givenSomeRuleExists(aReport.id);
    });

    it('retrieves with empty values', async () => {
      const expectedRules = prepareExpectedRules(aReportRuleSnapshot);
      const result = await sqlReportRetrievalVMQuery.retrieveReport(aReport.id);
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
      comment: reportRuleSnapshot.comment,
    };
    return {
      [reportRuleSnapshot.ruleGroup]: {
        [reportRuleSnapshot.ruleName]: ruleValue,
      },
    } as NominationFile.Rules;
  };

  const givenSomeRuleExists = async (reportId: string) => {
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
