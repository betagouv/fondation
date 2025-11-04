import { Magistrat } from 'shared-models';
import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { z } from 'zod';
import { AffectationsDossiersDeNominations } from '../affectation';
import { DomainRegistry } from '../domain-registry';
import { TypeDeSaisine } from 'shared-models';

export type AffectationRapporteursModifiéeEventPayload = {
  id: string;
  sessionId: string;
  typeDeSaisine: TypeDeSaisine;
  formation: Magistrat.Formation;
  affectationsDossiersDeNominations: AffectationsDossiersDeNominations[];
};

export const affectationRapporteursModifiéeEventPayloadSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  typeDeSaisine: z.enum(TypeDeSaisine),
  formation: z.enum(Magistrat.Formation),
  affectationsDossiersDeNominations: z
    .object({
      dossierDeNominationId: z.string(),
      rapporteurIds: z.string().array(),
    })
    .array(),
}) satisfies z.ZodType<AffectationRapporteursModifiéeEventPayload>;

export class AffectationRapporteursModifiéeEvent extends DomainEvent<AffectationRapporteursModifiéeEventPayload> {
  readonly name = 'AFFECTATION_RAPPORTEURS_MODIFIEE';

  private constructor(
    id: string,
    payload: AffectationRapporteursModifiéeEventPayload,
    currentDate: Date,
  ) {
    super(
      id,
      AffectationRapporteursModifiéeEvent.name,
      affectationRapporteursModifiéeEventPayloadSchema.parse(payload),
      currentDate,
    );
  }

  static create(payload: AffectationRapporteursModifiéeEventPayload) {
    const id = DomainRegistry.uuidGenerator().generate();
    const currentDate = DomainRegistry.dateTimeProvider().now();
    return new AffectationRapporteursModifiéeEvent(id, payload, currentDate);
  }
}
