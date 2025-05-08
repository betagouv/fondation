import { GdsTransparenceNominationFilesModifiedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-nomination-files-modified.event';
import { UpdateDossierDeNominationCommand } from '../use-cases/update-dossier-de-nomination/update-dossier-de-nomination.command';
import { UpdateDossierDeNominationUseCase } from '../use-cases/update-dossier-de-nomination/update-dossier-de-nomination.use-case';

export class GdsTransparenceDossiersModifiésSubscriber {
  constructor(
    private readonly updateDossierDeNominationUseCase: UpdateDossierDeNominationUseCase,
  ) {}

  async handle(payload: GdsTransparenceNominationFilesModifiedEventPayload) {
    const command = UpdateDossierDeNominationCommand.create(payload);
    await this.updateDossierDeNominationUseCase.execute(command);
  }
}
