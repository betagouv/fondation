import { TypeDeSaisine } from 'shared-models';
import { DossierDeNomination } from 'src/reports-context/business-logic/models/dossier-de-nomination';
import {
  DossierDeNominationDto,
  DossierDeNominationService,
} from 'src/shared-kernel/business-logic/gateways/services/dossier-de-nomination.service';
import { SessionService } from 'src/shared-kernel/business-logic/gateways/services/session.service';

export class DossierDeNominationTranslator {
  constructor(
    private readonly dossierDeNominationService: DossierDeNominationService<TypeDeSaisine>,
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
      nomAspirant: this.nomAspirant(dossierDeNomination, session.typeDeSaisine),
    });
  }

  private nomAspirant(
    dossierDeNomination: DossierDeNominationDto<TypeDeSaisine>,
    typeDeSaisine: TypeDeSaisine,
  ) {
    switch (typeDeSaisine) {
      case TypeDeSaisine.TRANSPARENCE_GDS: {
        const version = dossierDeNomination.content.version;

        switch (version) {
          case undefined:
          case 1:
            return dossierDeNomination.content.name;
          case 2:
            return dossierDeNomination.content.nomMagistrat;
          default:
            const _exhaustiveCheck: never = version;
            throw new Error(
              `Version de proposition de nomination inconnue: ${_exhaustiveCheck}`,
            );
        }
      }
      default:
        const _exhaustiveCheck: never = typeDeSaisine;
        throw new Error(
          `Type de saisine inconnu: ${_exhaustiveCheck}. Nom aspirant non trouvé.`,
        );
    }
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
