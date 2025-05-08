import { DossierDeNominationSnapshot } from 'src/nominations-context/business-logic/models/dossier-de-nomination';
import { TypeDeSaisine } from 'src/nominations-context/business-logic/models/type-de-saisine';
import { DossierDeNominationService } from 'src/reports-context/business-logic/gateways/services/dossier-de-nomination.service';

export class StubDossierDeNominationService<S extends TypeDeSaisine>
  implements DossierDeNominationService<S>
{
  stubDossier: DossierDeNominationSnapshot<S>;

  async dossierDeNomination(
    dossierDeNominationId: string,
  ): Promise<DossierDeNominationSnapshot<S>> {
    if (this.stubDossier.id !== dossierDeNominationId) {
      throw new Error('Dossier de nomination not found.');
    }
    return this.stubDossier;
  }
}
