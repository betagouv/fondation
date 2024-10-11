import { ReportRuleBuilder } from 'src/reporter-context/business-logic/models/report-rules.builder';
import { clearDB } from 'test/docker-postgresql-manager';
import { ormConfigTest } from 'test/orm-config.test';
import { DataSource } from 'typeorm';
import { ReportRulePm } from './entities/report-rule-pm';
import { SqlReportRuleRepository } from './sql-report-rule.repository';
import { ReportPm } from './entities/report-pm';
import { ReportState } from 'src/reporter-context/business-logic/models/enums/report-state.enum';
import { Formation } from 'src/reporter-context/business-logic/models/enums/formation.enum';
import { Transparency } from 'src/reporter-context/business-logic/models/enums/transparency.enum';
import { Grade } from 'src/reporter-context/business-logic/models/enums/grade.enum';
import { ReportRule } from 'src/reporter-context/business-logic/models/report-rules';

describe('SQL Report Rule Repository', () => {
  let dataSource: DataSource;
  let sqlReportRuleRepository: SqlReportRuleRepository;

  beforeAll(async () => {
    dataSource = new DataSource(ormConfigTest('src'));
    await dataSource.initialize();
  });

  beforeEach(async () => {
    await clearDB(dataSource);
    sqlReportRuleRepository = new SqlReportRuleRepository(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('saves a report rule', async () => {
    const report = await dataSource
      .getRepository(ReportPm)
      .save(
        new ReportPm(
          'cd1619e2-263d-49b6-b928-6a04ee681133',
          'biography',
          new Date(2030, 1, 1),
          'name',
          new Date(1980, 1, 1),
          ReportState.NEW,
          Formation.PARQUET,
          Transparency.MARCH_2025,
          Grade.I,
          'targettedPosition',
          'comments',
        ),
      );
    const aReportRule = new ReportRuleBuilder()
      .withId('cd1619e2-263d-49b6-b928-6a04ee681132')
      .withReportId(report.id)
      .build();

    await sqlReportRuleRepository.save(aReportRule);

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

    const savedReport = await sqlReportRuleRepository.byId(
      aReportRuleSnapshot.id,
    );
    expect(savedReport).toEqual<ReportRule>(aReportRule);
  });
});
