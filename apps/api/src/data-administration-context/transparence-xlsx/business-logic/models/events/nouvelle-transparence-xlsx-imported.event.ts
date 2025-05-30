import { DomainEvent } from 'src/shared-kernel/business-logic/models/domain-event';
import { DomainRegistry } from '../../../../transparences/business-logic/models/domain-registry';

export type NouvelleTransparenceXlsxImportedEventPayload = {
  transparenceId: string;
  filename: string;
  data: any[][];
};

export class NouvelleTransparenceXlsxImportedEvent extends DomainEvent<NouvelleTransparenceXlsxImportedEventPayload> {
  readonly name = 'NOUVELLE_TRANSPARENCE_XLSX_IMPORTED';

  constructor(
    id: string,
    payload: NouvelleTransparenceXlsxImportedEventPayload,
    currentDate: Date,
  ) {
    super(id, NouvelleTransparenceXlsxImportedEvent.name, payload, currentDate);
  }

  static create(payload: NouvelleTransparenceXlsxImportedEventPayload) {
    const id = DomainRegistry.uuidGenerator().generate();
    const currentDate = DomainRegistry.dateTimeProvider().now();
    return new NouvelleTransparenceXlsxImportedEvent(id, payload, currentDate);
  }
}
