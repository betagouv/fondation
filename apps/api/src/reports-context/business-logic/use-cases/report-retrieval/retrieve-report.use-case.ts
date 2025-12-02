import { differenceInMonths } from 'date-fns';
import {
  allRulesMapV2,
  NominationFile,
  ReportRetrievalVM,
  RulesBuilder,
  Transparency,
  TypeDeSaisine,
} from 'shared-models';

import { DossierDeNominationSnapshot } from 'shared-models/models/session/dossier-de-nomination';
import { DateTimeProvider } from 'src/shared-kernel/business-logic/gateways/providers/date-time-provider';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { UnionToIntersection } from 'type-fest';
import {
  DossierDeNominationService,
  PropositionDeNominationTransparenceDto,
} from '../../../../shared-kernel/business-logic/gateways/services/dossier-de-nomination.service';
import { TransparenceService } from '../../../../shared-kernel/business-logic/gateways/services/session.service';
import {
  ReportRetrievalQueried,
  ReportRetrievalQuery,
} from '../../gateways/queries/report-retrieval-vm.query';

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
    private readonly dossierDeNominationService: DossierDeNominationService,
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
    dossierDeNomination: DossierDeNominationSnapshot,
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

    return {
      dureeDuPoste,
      biography: dossierDeNomination.content.biography,
      dueDate: dossierDeNomination.content.dueDate,
      name: dossierDeNomination.content.name,
      birthDate: dossierDeNomination.content.birthDate,
      grade: dossierDeNomination.content.grade,
      currentPosition: dossierDeNomination.content.currentPosition,
      targettedPosition: dossierDeNomination.content.targetedPosition,
      rank: dossierDeNomination.content.rank,
      observers: dossierDeNomination.content.observers,
      folderNumber: dossierDeNomination.content.folderNumber,
    };
  }

  private datePriseDeFonctionPosteActuel(
    content: PropositionDeNominationTransparenceDto['content'],
  ) {
    return content.lastPositionDate;
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
