import { differenceInMonths } from 'date-fns';
import {
  allRulesMapV2,
  NominationFile,
  ReportRetrievalVM,
  RulesBuilder,
  Transparency,
  TypeDeSaisine,
} from 'shared-models';
import { DossierDeNominationSnapshot } from 'src/nominations-context/sessions/business-logic/models/dossier-de-nomination';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { UnionToIntersection } from 'type-fest';
import {
  ReportRetrievalQueried,
  ReportRetrievalQuery,
} from '../../gateways/queries/report-retrieval-vm.query';
import { DossierDeNominationService } from '../../gateways/services/dossier-de-nomination.service';
import { SessionService } from '../../gateways/services/session.service';

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
    private reportRetrievalVMQuery: ReportRetrievalQuery,
    private readonly sessionService: SessionService,
    private readonly dossierDeNominationService: DossierDeNominationService<TypeDeSaisine.TRANSPARENCE_GDS>,
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

    const transparence = await this.sessionService.session(rapport.sessionId);
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

    const datePriseDeFonctionPosteActuel = this.datePriseDeFonctionPosteActuel(
      dossierDeNomination.content,
    );
    const datePassageAuGrade = this.datePassageAuGrade(
      dossierDeNomination.content,
    );

    const dureeDuPosteEnMois =
      datePriseDeFonctionPosteActuel && datePassageAuGrade
        ? differenceInMonths(
            DateOnly.fromJson(datePassageAuGrade).toDate(),
            DateOnly.fromJson(datePriseDeFonctionPosteActuel).toDate(),
          )
        : null;

    return {
      id: rapport.id,
      comment: rapport.comment,
      formation: rapport.formation,
      state: rapport.state,
      rules: WithPreValidatedRulesBuilder.fromQueriedRules(
        rapport.rules,
      ).build(),
      transparency: transparence.name as Transparency,
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
      dureeDuPoste: dureeDuPosteEnMois
        ? formatMonthsToYearsAndMonths(dureeDuPosteEnMois)
        : null,
      attachedFiles: rapport.files,
    };
  }

  datePriseDeFonctionPosteActuel(
    content: DossierDeNominationSnapshot<TypeDeSaisine.TRANSPARENCE_GDS>['content'],
  ) {
    return content.version ? content.datePriseDeFonctionPosteActuel : null;
  }

  datePassageAuGrade(
    content: DossierDeNominationSnapshot<TypeDeSaisine.TRANSPARENCE_GDS>['content'],
  ) {
    return content.version ? content.datePassageAuGrade : null;
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
