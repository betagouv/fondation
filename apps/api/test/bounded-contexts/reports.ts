import { reports } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { SqlReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/sql-report.repository';
import { NominationFileReportSnapshot } from 'src/reports-context/business-logic/models/nomination-file-report';
import { ReportAttachedFilesSerialized } from 'src/reports-context/business-logic/models/report-attached-files';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';

export const givenSomeReportsFactory =
  (db: DrizzleDb) =>
  async (...someReports: NominationFileReportSnapshot[]) => {
    const someReportsRows = someReports.map(
      SqlReportRepository.mapSnapshotToDb,
    );
    await db.insert(reports).values(someReportsRows).execute();
  };

export type GivenSomeReports = ReturnType<typeof givenSomeReportsFactory>;

export const expectReportsInDbFactory =
  (db: DrizzleDb) =>
  async (...expectedReports: NominationFileReportSnapshot[]) => {
    const reportsInDb = await db.select().from(reports).execute();

    expect(reportsInDb).toEqual<
      (typeof reports.$inferSelect & {
        attachedFiles: ReportAttachedFilesSerialized;
      })[]
    >(
      expectedReports.map((expectedReport) => ({
        ...expectedReport,
      })),
    );
  };
export type ExpectReportsInDb = ReturnType<typeof expectReportsInDbFactory>;
