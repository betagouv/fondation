import { DossierDeNominationRestContrat } from 'shared-models/models/endpoints/nominations/dossier-de-nominations.endpoints';
import { DossierDeNominationService } from 'src/reports-context/business-logic/gateways/services/dossier-de-nomination.service';
import { BoundedContextHttpClient } from 'src/shared-kernel/adapters/secondary/gateways/providers/bounded-context-htttp-client';

export class HttpDossierDeNominationService
  implements DossierDeNominationService
{
  constructor(
    private readonly httpClient: BoundedContextHttpClient<DossierDeNominationRestContrat>,
  ) {}

  async dossierDeNomination(dossierId: string) {
    return this.httpClient.fetch<'dossierDeNominationSnapshot'>({
      method: 'GET',
      params: { dossierId },
      path: 'snapshot/by-id/:dossierId',
    });
  }
}
