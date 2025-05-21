import {
  allRulesMapV2,
  NominationFile,
  ReportRetrievalVM,
  RulesBuilder,
  Transparency,
} from 'shared-models';
import {
  ReportRetrievalQueried,
  ReportRetrievalQuery,
} from '../../gateways/queries/report-retrieval-vm.query';
import { SessionService } from '../../gateways/services/session.service';
import { DossierDeNominationService } from '../../gateways/services/dossier-de-nomination.service';
import { TypeDeSaisine } from 'shared-models';
import { UnionToIntersection } from 'type-fest';

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

      attachedFiles: rapport.files,
    };
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
