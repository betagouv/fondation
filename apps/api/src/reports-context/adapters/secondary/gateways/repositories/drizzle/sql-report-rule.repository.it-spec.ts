import { NominationFileReportSnapshot } from 'src/reports-context/business-logic/models/nomination-file-report';
import { ReportRule } from 'src/reports-context/business-logic/models/report-rules';
import { ReportRuleBuilder } from 'src/reports-context/business-logic/models/report-rules.builder';
import { ReportBuilder } from 'src/reports-context/business-logic/models/report.builder';
import { DrizzleTransactionPerformer } from 'src/shared-kernel/adapters/secondary/gateways/providers/drizzle-transaction-performer';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transaction-performer';
import { clearDB } from 'test/docker-postgresql-manager';
import { reports } from './schema/report-pm';
import { reportRules } from './schema/report-rule-pm';
import { SqlReportRuleRepository } from './sql-report-rule.repository';
import { SqlReportRepository } from './sql-report.repository';

describe('SQL Report Rule Repository', () => {
  let db: DrizzleDb;
  let sqlReportRuleRepository: SqlReportRuleRepository;
  let aReport: NominationFileReportSnapshot;
  let transactionPerformer: TransactionPerformer;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlReportRuleRepository = new SqlReportRuleRepository();
    transactionPerformer = new DrizzleTransactionPerformer(db);

    aReport = new ReportBuilder('uuid').build();
    const reportRow = SqlReportRepository.mapSnapshotToDb(aReport);
    await db.insert(reports).values(reportRow).execute();
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('saves a report rule', async () => {
    const aReportRuleSnapshot = new ReportRuleBuilder('uuid')
      .with('reportId', aReport.id)
      .build();
    const aReportRule = ReportRule.fromSnapshot(aReportRuleSnapshot);

    await transactionPerformer.perform(
      sqlReportRuleRepository.save(aReportRule),
    );

    const existingRules = await db.select().from(reportRules).execute();
    expect(existingRules).toEqual([
      SqlReportRuleRepository.mapToDb(aReportRule),
    ]);
  });

  it('retrieves a report rule by id', async () => {
    const aReportRuleSnapshot = new ReportRuleBuilder('uuid')
      .with('reportId', aReport.id)
      .build();
    const aReportRule = ReportRule.fromSnapshot(aReportRuleSnapshot);

    const ruleRow = SqlReportRuleRepository.mapToDb(aReportRule);
    await db.insert(reportRules).values(ruleRow).execute();

    const savedReportRule = await transactionPerformer.perform(
      sqlReportRuleRepository.byId(aReportRuleSnapshot.id),
    );

    expect(savedReportRule).toEqual<ReportRule>(aReportRule);
  });
});
