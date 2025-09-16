import { differenceInMonths } from 'date-fns';
import {
  allRulesMapV2,
  NominationFile,
  ReportRetrievalVM,
  RulesBuilder,
  Transparency,
  TypeDeSaisine,
} from 'shared-models';

import { DossierDeNominationSnapshot } from 'shared-models/models/session/dossier-de-nomination-content';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { UnionToIntersection } from 'type-fest';
import {
  ReportRetrievalQueried,
  ReportRetrievalQuery,
} from '../../gateways/queries/report-retrieval-vm.query';
import {
  DossierDeNominationService,
  PropositionDeNominationTransparenceDto,
} from '../../gateways/services/dossier-de-nomination.service';
import { TransparenceService } from '../../gateways/services/session.service';

const formatMonthsToYearsAndMonths = (months: number): string => {
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} mois`;
  }

  if (remainingMonths === 0) {
    return `${years} an${years > 1 ? 's' : ''}`;
  }

  return `${years} an${years > 1 ? 's' : ''} et ${remainingMonths} mois`;
};

export class RetrieveReportUseCase {
  constructor(
    private readonly reportRetrievalVMQuery: ReportRetrievalQuery,
    private readonly transparenceService: TransparenceService,
    private readonly dossierDeNominationService: DossierDeNominationService<TypeDeSaisine.TRANSPARENCE_GDS>,
    private readonly dateTimeProvider: DateTimeProvider,
  ) {}

  async execute(
    id: string,
    reporterId: string,
  ): Promise<ReportRetrievalVM | null> {
    const rapport = await this.reportRetrievalVMQuery.retrieveReport(
      id,
      reporterId,
    );
    if (!rapport) return null;

    const transparence = await this.transparenceService.session(
      rapport.sessionId,
    );
    if (!transparence)
      throw new Error(
        `Transparence non trouvée avec l'ID de session ${rapport.sessionId}`,
      );

    const dossierDeNomination =
      await this.dossierDeNominationService.dossierDeNomination(
        rapport.dossierDeNominationId,
      );

    if (!dossierDeNomination)
      throw new Error(
        `Dossier de nomination non trouvé avec l'ID ${rapport.dossierDeNominationId}`,
      );

    return {
      id: rapport.id,
      sessionId: rapport.sessionId,
      comment: rapport.comment,
      formation: rapport.formation,
      state: rapport.state,
      rules: WithPreValidatedRulesBuilder.fromQueriedRules(
        rapport.rules,
      ).build(),
      attachedFiles: rapport.files,
      transparency: transparence.name as Transparency,
      dateTransparence: transparence.content.dateTransparence,
      ...this.rapportFromDossierDeNomination(dossierDeNomination),
    };
  }

  private rapportFromDossierDeNomination(
    dossierDeNomination: DossierDeNominationSnapshot<TypeDeSaisine.TRANSPARENCE_GDS>,
  ): Pick<
    ReportRetrievalVM,
    | 'biography'
    | 'dueDate'
    | 'name'
    | 'birthDate'
    | 'grade'
    | 'currentPosition'
    | 'targettedPosition'
    | 'rank'
    | 'observers'
    | 'folderNumber'
    | 'dureeDuPoste'
  > {
    const datePriseDeFonctionPosteActuel = this.datePriseDeFonctionPosteActuel(
      dossierDeNomination.content,
    );

    const dureeDuPosteEnMois = datePriseDeFonctionPosteActuel
      ? differenceInMonths(
          this.dateTimeProvider.now(),
          DateOnly.fromJson(datePriseDeFonctionPosteActuel).toDate(),
        )
      : null;
    const dureeDuPoste = dureeDuPosteEnMois
      ? formatMonthsToYearsAndMonths(dureeDuPosteEnMois)
      : null;

    const version = dossierDeNomination.content.version;
    switch (version) {
      case undefined:
      case 1:
        return {
          dureeDuPoste,
          biography: dossierDeNomination.content.biography,
          dueDate: dossierDeNomination.content.dueDate,
          name: dossierDeNomination.content.name,
          birthDate: dossierDeNomination.content.birthDate,
          grade: dossierDeNomination.content.grade,
          currentPosition: dossierDeNomination.content.currentPosition,
          targettedPosition: dossierDeNomination.content.targettedPosition,
          rank: dossierDeNomination.content.rank,
          observers: dossierDeNomination.content.observers,
          folderNumber: dossierDeNomination.content.folderNumber,
        };
      case 2:
        return {
          dureeDuPoste,
          biography: dossierDeNomination.content.historique,
          dueDate: dossierDeNomination.content.dateEchéance,
          name: dossierDeNomination.content.nomMagistrat,
          birthDate: dossierDeNomination.content.dateDeNaissance,
          grade: dossierDeNomination.content.grade,
          currentPosition: dossierDeNomination.content.posteActuel,
          targettedPosition: dossierDeNomination.content.posteCible,
          rank: dossierDeNomination.content.rang,
          observers: dossierDeNomination.content.observants,
          folderNumber: dossierDeNomination.content.numeroDeDossier,
        };
      default:
        const _exhaustiveCheck: never = version;
        throw new Error(`Version de contenu non gérée: ${_exhaustiveCheck}`);
    }
  }

  private datePriseDeFonctionPosteActuel(
    content: PropositionDeNominationTransparenceDto['content'],
  ) {
    return content.datePriseDeFonctionPosteActuel;
  }
}

class WithPreValidatedRulesBuilder extends RulesBuilder {
  static fromQueriedRules(rules: ReportRetrievalQueried['rules']) {
    return new this(
      ({ ruleGroup, ruleName }) => ({
        ...(
          rules[ruleGroup] as UnionToIntersection<
            (typeof rules)[NominationFile.RuleGroup]
          >
        )[ruleName],
        preValidated: false,
      }),
      allRulesMapV2,
    );
  }
}
