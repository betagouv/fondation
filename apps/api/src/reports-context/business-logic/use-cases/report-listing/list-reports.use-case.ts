import { ReportListingVM } from 'shared-models';
import { ReportListingQuery } from '../../gateways/queries/report-listing-vm.query';
import { DossierDeNominationService } from '../../gateways/services/dossier-de-nomination.service';
import { TypeDeSaisine } from 'shared-models';
import { SessionService } from '../../gateways/services/session.service';

export class ListReportsUseCase {
  constructor(
    private readonly reportListingVMRepository: ReportListingQuery,
    private readonly dossierDeNominationService: DossierDeNominationService<TypeDeSaisine.TRANSPARENCE_GDS>,
    private readonly sessionService: SessionService,
  ) {}

  async execute(reporterId: string): Promise<ReportListingVM> {
    const rapports =
      await this.reportListingVMRepository.listReports(reporterId);

    const rapportsAvecDossiersPromises = rapports.map(async (reportQueried) => {
      const dossier = await this.dossierDeNominationService.dossierDeNomination(
        reportQueried.dossierDeNominationId,
      );

      const session = await this.sessionService.session(
        reportQueried.sessionId,
      );
      if (!session) {
        throw new Error(`Session not found for ID: ${reportQueried.sessionId}`);
      }

      return {
        session,
        dossier,
        reportQueried,
      };
    });
    const dossierDeNomination = await Promise.all(rapportsAvecDossiersPromises);

    const rapportsVM: ReportListingVM = {
      data: dossierDeNomination.map(({ session, dossier, reportQueried }) => ({
        id: reportQueried.id,
        transparency: session.name,
        state: reportQueried.state,
        formation: reportQueried.formation,
        folderNumber: dossier.content.folderNumber,
        dueDate: dossier.content.dueDate,
        name: dossier.content.name,
        grade: dossier.content.grade,
        targettedPosition: dossier.content.targettedPosition,
        observersCount: dossier.content.observers?.length ?? 0,
      })),
    };

    return rapportsVM;
  }
}
