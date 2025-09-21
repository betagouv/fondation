import { ReportListingVM, TypeDeSaisine } from 'shared-models';
import {
  DossierDeNominationService,
  PropositionDeNominationTransparenceDto,
} from '../../../../shared-kernel/business-logic/gateways/services/dossier-de-nomination.service';
import { TransparenceService } from '../../../../shared-kernel/business-logic/gateways/services/session.service';
import { ReportListingQuery } from '../../gateways/queries/report-listing-vm.query';

export class ListReportsUseCase {
  constructor(
    private readonly reportListingVMRepository: ReportListingQuery,
    private readonly dossierDeNominationService: DossierDeNominationService<TypeDeSaisine.TRANSPARENCE_GDS>,
    private readonly transparenceService: TransparenceService,
  ) {}

  async execute(reporterId: string): Promise<ReportListingVM> {
    const rapports =
      await this.reportListingVMRepository.listReports(reporterId);

    const rapportsAvecDossiersPromises = rapports.map(async (reportQueried) => {
      const dossier = await this.dossierDeNominationService.dossierDeNomination(
        reportQueried.dossierDeNominationId,
      );

      const session = await this.transparenceService.session(
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
        sessionId: session.id,
        sessionImportId: session.sessionImportéeId,
        transparency: session.name,
        dateTransparence: session.content.dateTransparence,
        state: reportQueried.state,
        formation: reportQueried.formation,
        ...this.rapportFromPropositionDeNomination(dossier),
      })),
    };

    return rapportsVM;
  }

  private rapportFromPropositionDeNomination(
    proposition: PropositionDeNominationTransparenceDto,
  ): Pick<
    ReportListingVM['data'][number],
    | 'folderNumber'
    | 'dueDate'
    | 'name'
    | 'grade'
    | 'targettedPosition'
    | 'observersCount'
  > {
    const version = proposition.content.version;

    switch (version) {
      case undefined:
      case 1:
        return {
          folderNumber: proposition.content.folderNumber,
          dueDate: proposition.content.dueDate,
          name: proposition.content.name,
          grade: proposition.content.grade,
          targettedPosition: proposition.content.targettedPosition,
          observersCount: proposition.content.observers?.length ?? 0,
        };
      case 2:
        return {
          folderNumber: proposition.content.numeroDeDossier,
          dueDate: proposition.content.dateEchéance,
          name: proposition.content.nomMagistrat,
          grade: proposition.content.grade,
          targettedPosition: proposition.content.posteCible,
          observersCount: proposition.content.observants?.length ?? 0,
        };
    }
  }
}
