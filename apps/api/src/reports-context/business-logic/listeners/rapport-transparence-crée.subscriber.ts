import { RapportTransparenceCrééEventPayload } from '../models/events/rapport-transparence-créé.event';
import {
  CréerAnalyseCommand,
  CréerAnalyseUseCase,
} from '../use-cases/création-analyse/créer-analyse.use-case';

export class RapportTransparenceCrééSubscriber {
  constructor(private readonly créerAnalyseUseCase: CréerAnalyseUseCase) {}

  async handle(payload: RapportTransparenceCrééEventPayload): Promise<void> {
    const command = new CréerAnalyseCommand(payload.id);
    await this.créerAnalyseUseCase.execute(command);
  }
}
