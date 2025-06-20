import { TransparenceXlsxObservantsImportésEventPayload } from 'src/data-administration-context/transparence-xlsx/business-logic/models/events/transparence-xlsx-observants-importés.event';
import { UpdateObservantsCommand } from '../use-cases/update-observants/update-observants.command';
import { UpdateObservantsUseCase } from '../use-cases/update-observants/update-observants.use-case';

export class TransparenceXlsxObservantsImportésSubscriber {
  constructor(
    private readonly updateObservantsUseCase: UpdateObservantsUseCase,
  ) {}

  async handle(payload: TransparenceXlsxObservantsImportésEventPayload) {
    const command = UpdateObservantsCommand.create(payload);
    await this.updateObservantsUseCase.execute(command);
  }
}
