import { ReportListingVM } from 'shared-models';
import { ReportListingQuery } from '../../gateways/queries/report-listing-vm.query';
import { DossierDeNominationService } from '../../gateways/services/dossier-de-nomination.service';
import { TypeDeSaisine } from 'src/nominations-context/business-logic/models/type-de-saisine';
import { SessionService } from '../../gateways/services/session.service';

export class ListReportsUseCase {
  constructor(
    private readonly reportListingVMRepository: ReportListingQuery,
    private readonly dossierDeNominationService: DossierDeNominationService<TypeDeSaisine.TRANSPARENCE_GDS>,
    private readonly sessionService: SessionService,
  ) {}

  async execute(
    reporterId: string,
    sessionId: string,
  ): Promise<ReportListingVM> {
    const session = await this.sessionService.session(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }
    const rapports =
      await this.reportListingVMRepository.listReports(reporterId);

    const rapportsAvecDossiersPromises = rapports.map(async (reportQueried) => {
      const dossier = await this.dossierDeNominationService.dossierDeNomination(
        reportQueried.dossierDeNominationId,
      );

      return {
        dossier,
        reportQueried,
      };
    });
    const dossierDeNomination = await Promise.all(rapportsAvecDossiersPromises);

    const rapportsVM: ReportListingVM = {
      data: dossierDeNomination.map(({ dossier, reportQueried }) => ({
        id: reportQueried.id,
        transparency: session.name,
        state: reportQueried.state,
        formation: reportQueried.formation,
        folderNumber: dossier.content.folderNumber,
        dueDate: dossier.content.dueDate,
        name: dossier.content.name,
        grade: dossier.content.grade,
        targettedPosition: dossier.content.targettedPosition,
      })),
    };

    return rapportsVM;
  }
}
