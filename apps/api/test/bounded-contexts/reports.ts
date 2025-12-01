import { randomUUID } from 'node:crypto';

import {
  dossierDeNominationPm,
  sessionPm,
} from 'src/modules/framework/drizzle/schemas';
import { SqlDossierDeNominationRepository } from 'src/nominations-context/dossier-de-nominations/adapters/primary/secondary/gateways/repositories/drizzle/sql-dossier-de-nomination.repository';
import { SqlSessionRepository } from 'src/nominations-context/sessions/adapters/secondary/gateways/repositories/drizzle/sql-session.repository';
import {
  stubDossier,
  stubSession,
} from 'src/reports-context/adapters/primary/nestjs/reports.controller.fixtures';
import { reports } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/schema';
import { SqlReportRepository } from 'src/reports-context/adapters/secondary/gateways/repositories/drizzle/sql-report.repository';
import { NominationFileReportSnapshot } from 'src/reports-context/business-logic/models/nomination-file-report';
import { ReportAttachedFilesSerialized } from 'src/reports-context/business-logic/models/report-attached-files';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';

export const givenSomeReportsFactory =
  (db: DrizzleDb) =>
  (...someReports: NominationFileReportSnapshot[]) =>
    db.transaction(async (tx) => {
      for (const report of someReports) {
        await tx
          .insert(sessionPm)
          .values(
            SqlSessionRepository.mapSnapshotToDb({
              ...stubSession,
              sessionImportéeId: randomUUID(),
              id: report.sessionId,
            }),
          )
          .onConflictDoNothing({ target: sessionPm.id });

        await tx
          .insert(dossierDeNominationPm)
          .values(
            SqlDossierDeNominationRepository.mapSnapshotToDb({
              ...stubDossier,
              nominationFileImportedId: randomUUID(),
              sessionId: report.sessionId,
              id: report.dossierDeNominationId,
            }),
          )
          .onConflictDoNothing({ target: dossierDeNominationPm.id });

        await tx
          .insert(reports)
          .values(SqlReportRepository.mapSnapshotToDb(report))
          .execute();
      }
    });

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
