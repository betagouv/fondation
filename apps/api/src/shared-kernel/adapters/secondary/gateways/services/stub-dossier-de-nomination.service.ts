import {
  DossierDeNominationDto,
  DossierDeNominationService,
} from 'src/shared-kernel/business-logic/gateways/services/dossier-de-nomination.service';

export class StubDossierDeNominationService
  implements DossierDeNominationService
{
  stubDossier: DossierDeNominationDto;

  async dossierDeNomination(
    dossierDeNominationId: string,
  ): Promise<DossierDeNominationDto> {
    if (this.stubDossier.id !== dossierDeNominationId) {
      throw new Error('Dossier de nomination not found.');
    }
    return this.stubDossier;
  }
}
