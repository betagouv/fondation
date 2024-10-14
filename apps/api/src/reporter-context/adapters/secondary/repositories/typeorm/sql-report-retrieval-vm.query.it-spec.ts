import { clearDB } from 'test/docker-postgresql-manager';
import { ormConfigTest } from 'test/orm-config.test';
import { DataSource } from 'typeorm';
import { ReportPm } from './entities/report-pm';
import { NominationFileReport } from 'src/reporter-context/business-logic/models/nomination-file-report';
import { ReportBuilder } from 'src/reporter-context/business-logic/models/report.builder';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { ReportRetrievalVM } from 'src/reporter-context/business-logic/models/report-retrieval-vm';
import { SqlReportRetrievalVMQuery } from './sql-report-retrieval-vm.query';
import { ReportRule } from 'src/reporter-context/business-logic/models/report-rules';
import { ReportRuleBuilder } from 'src/reporter-context/business-logic/models/report-rules.builder';
import { ReportRulePm } from './entities/report-rule-pm';
import { NominationFile } from '@/shared-models';

describe('SQL Report Retrieval VM Query', () => {
  let dataSource: DataSource;
  let sqlReportRetrievalVMQuery: SqlReportRetrievalVMQuery;

  beforeAll(async () => {
    dataSource = new DataSource(ormConfigTest('src'));
    await dataSource.initialize();
  });

  beforeEach(async () => {
    await clearDB(dataSource);
    sqlReportRetrievalVMQuery = new SqlReportRetrievalVMQuery(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('throws an error if no report', async () => {
    expect(
      sqlReportRetrievalVMQuery.retrieveReport('unkwown-id'),
    ).rejects.toThrow();
  });

  describe('when there is a report', () => {
    let aReport: NominationFileReport;
    let aReportRule: ReportRule;

    beforeEach(async () => {
      aReport = new ReportBuilder()
        .withId('cd1619e2-263d-49b6-b928-6a04ee681132')
        .withDueDate(new DateOnly(2030, 10, 1))
        .withBirthDate(new DateOnly(1980, 1, 1))
        .build();
      await dataSource
        .getRepository(ReportPm)
        .save(ReportPm.fromDomain(aReport));

      aReportRule = await givenSomeRuleExists(aReport.id);
    });

    it('retrieves a report', async () => {
      const aReportRuleSnapshot = aReportRule.toSnapshot();
      const expectedRules = {
        [aReportRuleSnapshot.ruleGroup]: {
          [aReportRuleSnapshot.ruleName]: {
            preValidated: aReportRuleSnapshot.preValidated,
            validated: aReportRuleSnapshot.validated,
            comment: aReportRuleSnapshot.comment,
          },
        },
      } as unknown as NominationFile.Rules;
      expect(
        await sqlReportRetrievalVMQuery.retrieveReport(aReport.id),
      ).toEqual<ReportRetrievalVM>({
        id: aReport.id,
        name: aReport.name,
        dueDate: {
          year: 2030,
          month: 10,
          day: 1,
        },
        biography: aReport.biography,
        birthDate: {
          year: 1980,
          month: 1,
          day: 1,
        },
        state: aReport.state,
        formation: aReport.formation,
        transparency: aReport.transparency,
        grade: aReport.grade,
        targettedPosition: aReport.targettedPosition,
        comments: aReport.comment,
        rules: expectedRules,
      });
    });
  });

  describe('when there is a report with empty information', () => {
    let aReport: NominationFileReport;
    let aReportRule: ReportRule;

    beforeEach(async () => {
      aReport = new ReportBuilder()
        .withId('cd1619e2-263d-49b6-b928-6a04ee681132')
        .withDueDate(null)
        .withComment(null)
        .build();
      await dataSource
        .getRepository(ReportPm)
        .save(ReportPm.fromDomain(aReport));

      aReportRule = await givenSomeRuleExists(aReport.id);
    });

    it('retrieves with empty values', async () => {
      const aReportRuleSnapshot = aReportRule.toSnapshot();
      const expectedRules = {
        [aReportRuleSnapshot.ruleGroup]: {
          [aReportRuleSnapshot.ruleName]: {
            preValidated: aReportRuleSnapshot.preValidated,
            validated: aReportRuleSnapshot.validated,
            comment: aReportRuleSnapshot.comment,
          },
        },
      } as unknown as NominationFile.Rules;
      expect(
        await sqlReportRetrievalVMQuery.retrieveReport(aReport.id),
      ).toEqual<ReportRetrievalVM>({
        id: aReport.id,
        name: aReport.name,
        dueDate: null,
        biography: aReport.biography,
        birthDate: aReport.birthDate.toViewModel(),
        state: aReport.state,
        formation: aReport.formation,
        transparency: aReport.transparency,
        grade: aReport.grade,
        targettedPosition: aReport.targettedPosition,
        comments: null,
        rules: expectedRules,
      });
    });
  });

  const givenSomeRuleExists = async (reportId: string) => {
    const aReportRule = new ReportRuleBuilder()
      .withId('da1619e2-263d-49b6-b928-6a04ee681132')
      .withReportId(reportId)
      .build();
    await dataSource
      .getRepository(ReportRulePm)
      .save(ReportRulePm.fromDomain(aReportRule));
    return aReportRule;
  };
});
