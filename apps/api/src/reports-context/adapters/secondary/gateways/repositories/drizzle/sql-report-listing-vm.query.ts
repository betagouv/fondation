import { eq } from 'drizzle-orm';
import { ReportListingQuery } from 'src/reports-context/business-logic/gateways/queries/report-listing-vm.query';
import { DrizzleDb } from 'src/shared-kernel/adapters/secondary/gateways/repositories/drizzle/config/drizzle-instance';
import { reports } from './schema/report-pm';

export class SqlReportListingQuery implements ReportListingQuery {
  constructor(private readonly db: DrizzleDb) {}

  async listReports(reporterId: string) {
    const reportsData = await this.db
      .select({
        id: reports.id,
        dossierDeNominationId: reports.dossierDeNominationId,
        sessionId: reports.sessionId,
        state: reports.state,
        formation: reports.formation,
      })
      .from(reports)
      .where(eq(reports.reporterId, reporterId))
      .execute();

    return reportsData;
  }

  async listReportsByDnId(dnId: string) {
    const reportsData = await this.db
      .select({
        id: reports.id,
        dossierDeNominationId: reports.dossierDeNominationId,
        sessionId: reports.sessionId,
        state: reports.state,
        formation: reports.formation,
      })
      .from(reports)
      .where(eq(reports.dossierDeNominationId, dnId))
      .execute();
    return reportsData;
  }
}
