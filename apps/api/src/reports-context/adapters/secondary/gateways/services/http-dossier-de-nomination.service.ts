import { NominationsContextRestContract } from 'shared-models';
import { DossierDeNominationService } from 'src/reports-context/business-logic/gateways/services/dossier-de-nomination.service';
import { BoundedContextHttpClient } from 'src/shared-kernel/adapters/secondary/gateways/providers/bounded-context-htttp-client';

export class HttpDossierDeNominationService
  implements DossierDeNominationService
{
  constructor(
    private readonly httpClient: BoundedContextHttpClient<NominationsContextRestContract>,
  ) {}

  async dossierDeNomination(dossierId: string) {
    return this.httpClient.fetch<'dossierDeNominationSnapshot'>({
      method: 'GET',
      params: { dossierId },
      path: 'dossier-de-nomination/snapshot/by-id/:dossierId',
    });
  }
}
