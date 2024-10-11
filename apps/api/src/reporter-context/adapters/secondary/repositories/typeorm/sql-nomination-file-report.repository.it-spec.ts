import { ReportBuilder } from 'src/reporter-context/business-logic/models/report.builder';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { clearDB } from 'test/docker-postgresql-manager';
import { ormConfigTest } from 'test/orm-config.test';
import { DataSource } from 'typeorm';
import { ReportPm } from './entities/report-pm';
import { SqlNominationFileReportRepository } from './sql-nomination-file-report.repository';

describe('SQL Nomination File Report Repository', () => {
  let dataSource: DataSource;
  let sqlNominationFileReportRepository: SqlNominationFileReportRepository;

  beforeAll(async () => {
    dataSource = new DataSource(ormConfigTest('src'));
    await dataSource.initialize();
  });

  beforeEach(async () => {
    await clearDB(dataSource);
    sqlNominationFileReportRepository = new SqlNominationFileReportRepository(
      dataSource,
    );
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('saves a report', async () => {
    await sqlNominationFileReportRepository.save(aReport);
    const existingReports = await dataSource.getRepository(ReportPm).find();
    expect(existingReports).toEqual([
      new ReportPm(
        aReport.id,
        aReport.biography,
        aReport.dueDate!.toDate(),
        aReport.name,
        aReport.birthDate.toDate(),
        aReport.state,
        aReport.formation,
        aReport.transparency,
        aReport.grade,
        aReport.targettedPosition,
        aReport.comments,
      ),
    ]);
  });

  const aReport = new ReportBuilder()
    .withId('cd1619e2-263d-49b6-b928-6a04ee681132')
    .withDueDate(new DateOnly(2030, 10, 1))
    .withBirthDate(new DateOnly(1980, 10, 1))
    .build();
});
