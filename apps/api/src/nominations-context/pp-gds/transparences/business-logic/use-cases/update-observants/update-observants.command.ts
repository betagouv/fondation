import { TransparenceXlsxObservantsImportésEventPayload } from 'src/data-administration-context/transparence-xlsx/business-logic/models/events/transparence-xlsx-observants-importés.event';

export class UpdateObservantsCommand {
  constructor(
    public readonly transparenceId: string,
    public readonly dossiersDeNominations: TransparenceXlsxObservantsImportésEventPayload['dossiersDeNominations'],
  ) {}

  static create(payload: TransparenceXlsxObservantsImportésEventPayload) {
    return new UpdateObservantsCommand(
      payload.transparenceId,
      payload.dossiersDeNominations,
    );
  }
}
