import { ReportListItemQueriedWithReporter } from 'shared-models';
import { ReportListingQuery } from 'src/reports-context/business-logic/gateways/queries/report-listing-vm.query';
import { UserService } from 'src/shared-kernel/business-logic/gateways/services/user.service';

export class ListReportByDnIdUseCase {
  constructor(
    private readonly reportListingQuery: ReportListingQuery,
    private readonly httpUserService: UserService,
  ) {}

  async execute(dnId: string): Promise<ReportListItemQueriedWithReporter[]> {
    const rapports = await this.reportListingQuery.listReportsByDnId(dnId);
    return Promise.all(
      rapports.map(async (rapport) => {
        const reporter = await this.httpUserService.userWithId(
          rapport.reporterId,
        );
        return {
          ...rapport,
          name: `${reporter.lastName.toUpperCase()} ${reporter.firstName.toUpperCase()}`,
        };
      }),
    );
  }
}
