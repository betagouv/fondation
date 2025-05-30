import { GdsTransparenceNominationFilesAddedEventPayload } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-nomination-files-added.event';
import { ImportNouveauxDossiersTransparenceCommand } from '../use-cases/import-nouveaux-dossiers-transparence/import-nouveaux-dossiers-transparence.command';
import { ImportNouveauxDossiersTransparenceUseCase } from '../use-cases/import-nouveaux-dossiers-transparence/import-nouveaux-dossiers-transparence.use-case';

export class GdsTransparenceNouveauxDossiersSubscriber {
  constructor(
    private readonly importNouveauxDossiersTransparenceUseCase: ImportNouveauxDossiersTransparenceUseCase,
  ) {}

  async handle(payload: GdsTransparenceNominationFilesAddedEventPayload) {
    const command = ImportNouveauxDossiersTransparenceCommand.create({
      transparenceId: payload.transparenceId,
      nominationFiles: payload.nominationFiles,
    });

    await this.importNouveauxDossiersTransparenceUseCase.execute(command);
  }
}
