import { clearDB } from 'test/docker-postgresql-manager';
import { ormConfigTest } from 'test/orm-config.test';
import { DataSource } from 'typeorm';
import { SqlReportListingVMRepository } from './sql-report-listing-vm.repository';
import { ReportPm } from './entities/report-pm';
import { NominationFileReport } from 'src/reporter-context/business-logic/models/nomination-file-report';
import { ReportBuilder } from 'src/reporter-context/business-logic/models/report.builder';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { ReportListingVM } from 'src/reporter-context/business-logic/models/reports-listing-vm';

describe('SQL Report Listing VM Repository', () => {
  let dataSource: DataSource;
  let sqlReportListingVMRepository: SqlReportListingVMRepository;

  beforeAll(async () => {
    dataSource = new DataSource(ormConfigTest('src'));
    await dataSource.initialize();
  });

  beforeEach(async () => {
    await clearDB(dataSource);
    sqlReportListingVMRepository = new SqlReportListingVMRepository(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('returns an empty list if no reports', async () => {
    expect(await sqlReportListingVMRepository.listReports()).toEqual({
      data: [],
    });
  });

  describe('when there is a report', () => {
    let aReport: NominationFileReport;

    beforeEach(async () => {
      aReport = new ReportBuilder()
        .withId('cd1619e2-263d-49b6-b928-6a04ee681132')
        .withDueDate(new DateOnly(2030, 10, 1))
        .build();
      await dataSource
        .getRepository(ReportPm)
        .save(ReportPm.fromDomain(aReport));
    });

    it('list a report', async () => {
      expect(
        await sqlReportListingVMRepository.listReports(),
      ).toEqual<ReportListingVM>({
        data: [
          {
            id: aReport.id,
            name: aReport.name,
            dueDate: '2030-10-01',
          },
        ],
      });
    });
  });
});
