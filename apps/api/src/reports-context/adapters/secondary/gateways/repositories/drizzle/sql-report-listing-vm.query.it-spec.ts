import { ReportListingVM } from 'shared-models';
import { NominationFileReport } from 'src/reports-context/business-logic/models/nomination-file-report';
import { ReportBuilder } from 'src/reports-context/business-logic/models/report.builder';
import { drizzleConfigForTest } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-config';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { clearDB } from 'test/docker-postgresql-manager';
import { reports } from './schema/report-pm';
import { SqlNominationFileReportRepository } from './sql-nomination-file-report.repository';
import { SqlReportListingVMQuery } from './sql-report-listing-vm.query';
import {
  DrizzleDb,
  getDrizzleInstance,
} from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';

describe('SQL Report Listing VM Query', () => {
  let sqlReportListingVMRepository: SqlReportListingVMQuery;
  let db: DrizzleDb;

  beforeAll(() => {
    db = getDrizzleInstance(drizzleConfigForTest);
  });

  beforeEach(async () => {
    await clearDB(db);
    sqlReportListingVMRepository = new SqlReportListingVMQuery(db);
  });

  afterAll(async () => {
    await db.$client.end();
  });

  it('returns an empty list if no reports', async () => {
    const result = await sqlReportListingVMRepository.listReports();
    expect(result).toEqual({
      data: [],
    });
  });

  describe('when there is a report', () => {
    let aReport: NominationFileReport;

    beforeEach(async () => {
      aReport = new ReportBuilder()
        .with('id', 'cd1619e2-263d-49b6-b928-6a04ee681132')
        .with('nominationFileId', 'ca1619e2-263d-49b6-b928-6a04ee681138')
        .with('dueDate', new DateOnly(2030, 10, 1))
        .build();

      const reportRow = SqlNominationFileReportRepository.mapToDb(aReport);
      await db.insert(reports).values(reportRow).execute();
    });

    it('list a report', async () => {
      const result = await sqlReportListingVMRepository.listReports();
      expect(result).toEqual<ReportListingVM>({
        data: [
          {
            id: aReport.id,
            folderNumber: aReport.folderNumber,
            state: aReport.state,
            dueDate: aReport.dueDate?.toJson() || null,
            formation: aReport.formation,
            name: aReport.name,
            reporterName: aReport.reporterName,
            transparency: aReport.transparency,
            grade: aReport.grade,
            targettedPosition: aReport.targettedPosition,
            observersCount: aReport.observers?.length || 0,
          },
        ],
      });
    });
  });
});
