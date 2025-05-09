import { TypeDeSaisine } from 'src/nominations-context/business-logic/models/type-de-saisine';
import {
  DossierDeNominationDto,
  DossierDeNominationService,
} from 'src/reports-context/business-logic/gateways/services/dossier-de-nomination.service';

export class StubDossierDeNominationService<S extends TypeDeSaisine>
  implements DossierDeNominationService<S>
{
  stubDossier: DossierDeNominationDto<S>;

  async dossierDeNomination(
    dossierDeNominationId: string,
  ): Promise<DossierDeNominationDto<S>> {
    if (this.stubDossier.id !== dossierDeNominationId) {
      throw new Error('Dossier de nomination not found.');
    }
    return this.stubDossier;
  }
}
