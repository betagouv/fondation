import { Magistrat } from 'shared-models';
import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { z } from 'zod';
import {
  AffectationsDossiersDeNominations,
  AffectationSnapshot,
} from '../affectation';
import { DomainRegistry } from '../domain-registry';
import { TypeDeSaisine } from 'shared-models';

export type AffectationRapporteursCréeEventPayload = {
  id: string;
  sessionId: string;
  typeDeSaisine: TypeDeSaisine;
  formation: Magistrat.Formation;
  affectationsDossiersDeNominations: AffectationsDossiersDeNominations[];
};

export const affectationRapporteursCréeEventPayloadSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  typeDeSaisine: z.nativeEnum(TypeDeSaisine),
  formation: z.nativeEnum(Magistrat.Formation),
  affectationsDossiersDeNominations: z
    .object({
      dossierDeNominationId: z.string(),
      rapporteurIds: z.string().array().nonempty(),
    })
    .array()
    .nonempty(),
}) satisfies z.ZodType<AffectationRapporteursCréeEventPayload>;

export class AffectationRapporteursCréeEvent extends DomainEvent<AffectationRapporteursCréeEventPayload> {
  readonly name = 'AFFECTATION_RAPPORTEURS_CREE';

  private constructor(
    id: string,
    payload: AffectationRapporteursCréeEventPayload,
    currentDate: Date,
  ) {
    super(
      id,
      AffectationRapporteursCréeEvent.name,
      affectationRapporteursCréeEventPayloadSchema.parse(payload),
      currentDate,
    );
  }

  static create(payload: AffectationRapporteursCréeEventPayload) {
    const id = DomainRegistry.uuidGenerator().generate();
    const currentDate = DomainRegistry.dateTimeProvider().now();
    return new AffectationRapporteursCréeEvent(id, payload, currentDate);
  }

  static fromAffectationSnapshot(
    snapshot: AffectationSnapshot,
    typeDeSaisine: TypeDeSaisine,
  ) {
    return AffectationRapporteursCréeEvent.create({
      id: snapshot.id,
      sessionId: snapshot.sessionId,
      typeDeSaisine: typeDeSaisine,
      formation: snapshot.formation,
      affectationsDossiersDeNominations:
        snapshot.affectationsDossiersDeNominations,
    });
  }
}
