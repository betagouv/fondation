import { Magistrat } from 'shared-models';
import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { z } from 'zod';
import { DomainRegistry } from '../domain-registry';
import { NominationFileReportSnapshot } from '../nomination-file-report';

export type RapportTransparenceCrééEventPayload = {
  id: string;
  createdAt: Date;
  dossierDeNominationId: string;
  sessionId: string;
  reporterId: string;
  formation: Magistrat.Formation;
};

export const rapportTransparenceCrééEventPayloadSchema = z.object({
  id: z.string(),
  createdAt: z.date(),
  dossierDeNominationId: z.string(),
  sessionId: z.string(),
  reporterId: z.string(),
  formation: z.nativeEnum(Magistrat.Formation),
}) satisfies z.ZodType<RapportTransparenceCrééEventPayload>;

export class RapportTransparenceCrééEvent extends DomainEvent<RapportTransparenceCrééEventPayload> {
  readonly name = 'RAPPORT_TRANSPARENCE_CREE';

  private constructor(
    id: string,
    payload: RapportTransparenceCrééEventPayload,
    occurredOn: Date,
  ) {
    super(
      id,
      RapportTransparenceCrééEvent.name,
      rapportTransparenceCrééEventPayloadSchema.parse(payload),
      occurredOn,
    );
  }

  static fromRapportSnapshot(snapshot: NominationFileReportSnapshot) {
    return RapportTransparenceCrééEvent.créer({
      id: snapshot.id,
      createdAt: snapshot.createdAt,
      dossierDeNominationId: snapshot.dossierDeNominationId,
      sessionId: snapshot.sessionId,
      reporterId: snapshot.reporterId,
      formation: snapshot.formation,
    });
  }

  private static créer(payload: RapportTransparenceCrééEventPayload) {
    const id = DomainRegistry.uuidGenerator().generate();
    const occurredOn = DomainRegistry.dateTimeProvider().now();
    return new RapportTransparenceCrééEvent(id, payload, occurredOn);
  }
}
