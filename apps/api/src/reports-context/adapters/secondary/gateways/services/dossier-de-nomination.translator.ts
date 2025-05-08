import { TypeDeSaisine } from 'src/nominations-context/business-logic/models/type-de-saisine';
import { DossierDeNominationService } from 'src/reports-context/business-logic/gateways/services/dossier-de-nomination.service';
import { DossierDeNominationTransparence } from 'src/reports-context/business-logic/models/dossier-de-nomination-transparence';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';

export class DossierDeNominationTranslator {
  constructor(
    private readonly dossierDeNominationService: DossierDeNominationService<TypeDeSaisine.TRANSPARENCE_GDS>,
  ) {}
  async dossierTransparence(
    dossierDeNominationId: string,
  ): Promise<DossierDeNominationTransparence> {
    const dossierDeNomination =
      await this.dossierDeNominationService.dossierDeNomination(
        dossierDeNominationId,
      );

    return DossierDeNominationTransparence.créer({
      dossierDeNominationId: dossierDeNomination.id,
      sessionId: dossierDeNomination.sessionId,
      folderNumber: dossierDeNomination.content.folderNumber,
      biography: dossierDeNomination.content.biography,
      dueDate: dossierDeNomination.content.dueDate
        ? DateOnly.fromJson(dossierDeNomination.content.dueDate)
        : null,
      name: dossierDeNomination.content.name,
      birthDate: DateOnly.fromJson(dossierDeNomination.content.birthDate),
      grade: dossierDeNomination.content.grade,
      currentPosition: dossierDeNomination.content.currentPosition,
      targettedPosition: dossierDeNomination.content.targettedPosition,
      rank: dossierDeNomination.content.rank,
      observers: dossierDeNomination.content.observers,
    });
  }
}
