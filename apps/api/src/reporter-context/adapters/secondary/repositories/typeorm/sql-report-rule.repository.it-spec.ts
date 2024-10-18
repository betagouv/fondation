import { ReportRule } from 'src/reporter-context/business-logic/models/report-rules';
import { ReportRuleBuilder } from 'src/reporter-context/business-logic/models/report-rules.builder';
import { ReportBuilder } from 'src/reporter-context/business-logic/models/report.builder';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { clearDB } from 'test/docker-postgresql-manager';
import { ormConfigTest } from 'test/orm-config.test';
import { DataSource } from 'typeorm';
import { ReportPm } from './entities/report-pm';
import { ReportRulePm } from './entities/report-rule-pm';
import { SqlReportRuleRepository } from './sql-report-rule.repository';
import { NominationFileReport } from 'src/reporter-context/business-logic/models/nomination-file-report';
import { TypeOrmTransactionPerformer } from 'src/shared-kernel/adapters/secondary/providers/typeOrmTransactionPerformer';
import { TransactionPerformer } from 'src/shared-kernel/business-logic/gateways/providers/transactionPerformer';

describe('SQL Report Rule Repository', () => {
  let dataSource: DataSource;
  let sqlReportRuleRepository: SqlReportRuleRepository;
  let aReport: NominationFileReport;
  let transactionPerformer: TransactionPerformer;

  beforeAll(async () => {
    dataSource = new DataSource(ormConfigTest('src'));
    await dataSource.initialize();
  });

  beforeEach(async () => {
    await clearDB(dataSource);
    sqlReportRuleRepository = new SqlReportRuleRepository();
    transactionPerformer = new TypeOrmTransactionPerformer(dataSource);

    aReport = new ReportBuilder()
      .withId('cd1619e2-263d-49b6-b928-6a04ee681133')
      .withDueDate(new DateOnly(2030, 1, 1))
      .withBirthDate(new DateOnly(1980, 1, 1))
      .build();
    await dataSource.getRepository(ReportPm).save(ReportPm.fromDomain(aReport));
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('saves a report rule', async () => {
    const aReportRule = new ReportRuleBuilder()
      .withId('cd1619e2-263d-49b6-b928-6a04ee681132')
      .withReportId(aReport.id)
      .build();

    await transactionPerformer.perform(
      sqlReportRuleRepository.save(aReportRule),
    );

    const existingReports = await dataSource.getRepository(ReportRulePm).find();
    const aReportRuleSnapshot = aReportRule.toSnapshot();
    expect(existingReports).toEqual([
      new ReportRulePm(
        aReportRuleSnapshot.id,
        aReportRuleSnapshot.ruleGroup,
        aReportRuleSnapshot.ruleName,
        aReportRuleSnapshot.preValidated,
        aReportRuleSnapshot.validated,
        aReportRuleSnapshot.comment,
        aReportRuleSnapshot.reportId,
      ),
    ]);
  });

  it('retrieves a report rule by id', async () => {
    const aReportRule = new ReportRuleBuilder()
      .withId('cd1619e2-263d-49b6-b928-6a04ee681132')
      .withReportId(aReport.id)
      .build();
    const aReportRuleSnapshot = aReportRule.toSnapshot();
    await dataSource
      .getRepository(ReportRulePm)
      .save(
        new ReportRulePm(
          aReportRuleSnapshot.id,
          aReportRuleSnapshot.ruleGroup,
          aReportRuleSnapshot.ruleName,
          aReportRuleSnapshot.preValidated,
          aReportRuleSnapshot.validated,
          aReportRuleSnapshot.comment,
          aReportRuleSnapshot.reportId,
        ),
      );

    const savedReport = await transactionPerformer.perform(
      sqlReportRuleRepository.byId(aReportRuleSnapshot.id),
    );

    expect(savedReport).toEqual<ReportRule>(aReportRule);
  });
});
