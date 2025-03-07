import { ReportListingVM } from 'shared-models';
import { NominationFileReportSnapshot } from 'src/reports-context/business-logic/models/nomination-file-report';
import { ReportBuilder } from 'src/reports-context/business-logic/models/report.builder';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import {
  GivenSomeReports,
  givenSomeReportsFactory,
} from 'test/bounded-contexts/reports';
import { clearDB } from 'test/docker-postgresql-manager';
import { SqlReportListingQuery } from './sql-report-listing-vm.query';

describe('SQL Report Listing VM Query', () => {
  let sqlReportListingVMRepository: SqlReportListingQuery;
  let db: DrizzleDb;
  let givenSomeReports: GivenSomeReports;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
    givenSomeReports = givenSomeReportsFactory(db);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlReportListingVMRepository = new SqlReportListingQuery(db);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('returns an empty list if no reports', async () => {
    const result = await sqlReportListingVMRepository.listReports(
      'bb8b1056-9573-4b9d-8161-d8e2b8fee462',
    );
    expect(result).toEqual({
      data: [],
    });
  });

  describe('when there is a report', () => {
    let aReport: NominationFileReportSnapshot;
    let anotherReport: NominationFileReportSnapshot;

    beforeEach(async () => {
      aReport = new ReportBuilder('uuid')
        .with('dueDate', new DateOnly(2030, 10, 1))
        .with('observers', ['observer1'])
        .build();

      anotherReport = new ReportBuilder()
        .with('id', 'cd1619e2-263d-49b6-b928-6a04ee681133')
        .with('reporterId', 'ad1619e2-263d-49b6-b928-6a04ee681133')
        .with('nominationFileId', 'ca1619e2-263d-49b6-b928-6a04ee681139')
        .with('dueDate', new DateOnly(2040, 5, 1))
        .build();

      await givenSomeReports(aReport, anotherReport);
    });

    it('lists reports owned by a reporter', async () => {
      const result = await sqlReportListingVMRepository.listReports(
        aReport.reporterId!,
      );
      expect(result).toEqual<ReportListingVM>({
        data: [
          {
            id: aReport.id,
            folderNumber: aReport.folderNumber,
            state: aReport.state,
            dueDate: {
              year: 2030,
              month: 10,
              day: 1,
            },
            formation: aReport.formation,
            name: aReport.name,
            transparency: aReport.transparency,
            grade: aReport.grade,
            targettedPosition: aReport.targettedPosition,
            observersCount: 1,
          },
        ],
      });
    });
  });
});
