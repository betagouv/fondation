import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { z } from 'zod';
import { DomainRegistry } from '../domain-registry';
import { DossierDeNominationContent } from '../dossier-de-nomination';

export type NouveauDossierDeNominationEventPayload = {
  dossierDeNominationId: string;
  sessionId: string;
  content: DossierDeNominationContent;
};

export const nouveauDossierDeNominationEventPayloadSchema = z.object({
  dossierDeNominationId: z.string(),
  sessionId: z.string(),
  content: z.record(z.unknown()),
}) satisfies z.ZodType<NouveauDossierDeNominationEventPayload>;

export class NouveauDossierDeNominationEvent extends DomainEvent<NouveauDossierDeNominationEventPayload> {
  readonly name = 'NOUVEAU_DOSSIER_DE_NOMINATION';

  private constructor(
    id: string,
    payload: NouveauDossierDeNominationEventPayload,
    currentDate: Date,
  ) {
    super(id, NouveauDossierDeNominationEvent.name, payload, currentDate);
  }

  static create(payload: NouveauDossierDeNominationEventPayload) {
    const id = DomainRegistry.uuidGenerator().generate();
    const currentDate = DomainRegistry.dateTimeProvider().now();
    return new NouveauDossierDeNominationEvent(id, payload, currentDate);
  }
}
