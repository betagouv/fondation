import { TypeDeSaisine } from 'src/nominations-context/business-logic/models/type-de-saisine';
import {
  DossierDeNominationDto,
  DossierDeNominationService,
} from 'src/reports-context/business-logic/gateways/services/dossier-de-nomination.service';
import { SessionService } from 'src/reports-context/business-logic/gateways/services/session.service';
import { DossierDeNomination } from 'src/reports-context/business-logic/models/dossier-de-nomination';

export class DossierDeNominationTranslator {
  constructor(
    private readonly dossierDeNominationService: DossierDeNominationService,
    private readonly sessionService: SessionService,
  ) {}

  async dossierDeNomination(
    dossierDeNominationId: string,
  ): Promise<DossierDeNomination> {
    const dossierDeNomination =
      await this.dossierDeNominationService.dossierDeNomination(
        dossierDeNominationId,
      );
    const session = await this.session(dossierDeNomination);

    return DossierDeNomination.créer({
      dossierDeNominationId: dossierDeNomination.id,
      nomSession: session.name,
      nomAspirant: this.nomAspirant(dossierDeNomination),
    });
  }

  private nomAspirant(
    dossierDeNomination: DossierDeNominationDto<TypeDeSaisine>,
  ) {
    if (
      'grade' in dossierDeNomination.content &&
      'rank' in dossierDeNomination.content
    ) {
      return dossierDeNomination.content.name;
    }

    throw new Error(
      'Nom aspirant non trouvé. Type de saisine non pris en charge ?',
    );
  }

  private async session(dossierDeNomination: DossierDeNominationDto) {
    const session = await this.sessionService.session(
      dossierDeNomination.sessionId,
    );
    if (!session) {
      throw new Error(
        `Session with id ${dossierDeNomination.sessionId} not found`,
      );
    }
    return session;
  }
}
