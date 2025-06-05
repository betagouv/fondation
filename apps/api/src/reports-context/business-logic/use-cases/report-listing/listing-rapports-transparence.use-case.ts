import { Magistrat, ReportListingVM } from 'shared-models';
import { DateOnlyJson } from 'shared-models';
import { ReportListingQuery } from '../../gateways/queries/report-listing-vm.query';
import {
  DossierDeNominationService,
  PropositionDeNominationTransparenceDto,
} from '../../gateways/services/dossier-de-nomination.service';
import { TypeDeSaisine } from 'shared-models';
import { SessionService } from '../../gateways/services/session.service';

export class ListingRapportsTransparenceUseCase {
  constructor(
    private readonly reportListingVMRepository: ReportListingQuery,
    private readonly dossierDeNominationService: DossierDeNominationService<TypeDeSaisine.TRANSPARENCE_GDS>,
    private readonly sessionService: SessionService,
  ) {}

  async execute(
    nomTransparence: string,
    formation: Magistrat.Formation,
    dateTransparence: DateOnlyJson,
    reporterId: string,
  ): Promise<ReportListingVM> {
    // Récupérer la session basée sur les critères
    const session = await this.sessionService.sessionParCriteres(
      nomTransparence,
      formation,
      dateTransparence,
    );

    if (!session) {
      return { data: [] };
    }

    const rapports =
      await this.reportListingVMRepository.listReportsBySessionId(
        session.id,
        reporterId,
      );

    const rapportsAvecDossiersPromises = rapports.map(async (reportQueried) => {
      const dossier = await this.dossierDeNominationService.dossierDeNomination(
        reportQueried.dossierDeNominationId,
      );

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
