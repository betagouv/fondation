import { TypeDeSaisine } from 'shared-models';
import { DossierDeNominationContent } from 'shared-models/models/session/dossier-de-nomination-content';
import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { z } from 'zod';
import { DomainRegistry } from '../../../../sessions/business-logic/models/domain-registry';

export type NouveauDossierDeNominationEventPayload<
  S extends TypeDeSaisine | unknown = unknown,
> = {
  dossierDeNominationId: string;
  sessionId: string;
  nominationFileImportedId: string;
  content: DossierDeNominationContent<S>;
};

export const nouveauDossierDeNominationEventPayloadSchema = z.object({
  dossierDeNominationId: z.string(),
  sessionId: z.string(),
  nominationFileImportedId: z.string(),
  content: z.record(z.string(), z.unknown()),
}) satisfies z.ZodType<NouveauDossierDeNominationEventPayload>;

export class NouveauDossierDeNominationEvent<
  S extends TypeDeSaisine | unknown = unknown,
> extends DomainEvent<NouveauDossierDeNominationEventPayload<S>> {
  readonly name = 'NOUVEAU_DOSSIER_DE_NOMINATION';

  private constructor(
    id: string,
    payload: NouveauDossierDeNominationEventPayload<S>,
    currentDate: Date,
  ) {
    nouveauDossierDeNominationEventPayloadSchema.parse(payload);
    super(id, NouveauDossierDeNominationEvent.name, payload, currentDate);
  }

  static create(payload: NouveauDossierDeNominationEventPayload) {
    const id = DomainRegistry.uuidGenerator().generate();
    const currentDate = DomainRegistry.dateTimeProvider().now();
    return new NouveauDossierDeNominationEvent(id, payload, currentDate);
  }
}
