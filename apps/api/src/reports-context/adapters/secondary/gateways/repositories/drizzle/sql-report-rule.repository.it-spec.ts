import { ReportRule } from 'src/reports-context/business-logic/models/report-rules';
import { ReportRuleBuilder } from 'src/reports-context/business-logic/models/report-rules.builder';
import { ReportBuilder } from 'src/reports-context/business-logic/models/report.builder';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { clearDB } from 'test/docker-postgresql-manager';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { reports } from './schema/report-pm';
import { reportRules } from './schema/report-rule-pm';
import { SqlReportRuleRepository } from './sql-report-rule.repository';
import { NominationFileReport } from 'src/reports-context/business-logic/models/nomination-file-report';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';
import { SqlNominationFileReportRepository } from './sql-nomination-file-report.repository';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';

describe('SQL Report Rule Repository', () => {
  let db: DrizzleDb;
  let sqlReportRuleRepository: SqlReportRuleRepository;
  let aReport: NominationFileReport;
  let transactionPerformer: TransactionPerformer;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlReportRuleRepository = new SqlReportRuleRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);

    aReport = new ReportBuilder()
      .withId('cd1619e2-263d-49b6-b928-6a04ee681133')
      .withNominationFileId('ca1619e2-263d-49b6-b928-6a04ee681138')
      .withDueDate(new DateOnly(2030, 1, 1))
      .withBirthDate(new DateOnly(1980, 1, 1))
      .build();

    const reportRow = SqlNominationFileReportRepository.mapToDb(aReport);
    await db.insert(reports).values(reportRow).execute();
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves a report rule', async () => {
    const aReportRule = new ReportRuleBuilder()
      .withId('cd1619e2-263d-49b6-b928-6a04ee681132')
      .withReportId(aReport.id)
      .build();

    await transactionPerformer.perform(
      sqlReportRuleRepository.save(aReportRule),
    );

    const existingRules = await db.select().from(reportRules).execute();
    expect(existingRules).toEqual([
      SqlReportRuleRepository.mapToDb(aReportRule),
    ]);
  });

  it('retrieves a report rule by id', async () => {
    const aReportRule = new ReportRuleBuilder()
      .withId('cd1619e2-263d-49b6-b928-6a04ee681132')
      .withReportId(aReport.id)
      .build();
    const aReportRuleSnapshot = aReportRule.toSnapshot();

    const ruleRow = SqlReportRuleRepository.mapToDb(aReportRule);
    await db.insert(reportRules).values(ruleRow).execute();

    const savedReportRule = await transactionPerformer.perform(
      sqlReportRuleRepository.byId(aReportRuleSnapshot.id),
    );

    expect(savedReportRule).toEqual<ReportRule>(aReportRule);
  });
});
