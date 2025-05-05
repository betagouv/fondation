import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GdsTransparenceNominationFilesModifiedEvent } from 'src/data-administration-context/business-logic/models/events/gds-transparence-nomination-files-modified.event';
import { UpdateDossierDeNominationCommand } from 'src/nominations-context/business-logic/use-cases/update-dossier-de-nomination/update-dossier-de-nomination.command';
import { UpdateDossierDeNominationUseCase } from 'src/nominations-context/business-logic/use-cases/update-dossier-de-nomination/update-dossier-de-nomination.use-case';

@Injectable()
export class GdsTransparenceNominationFilesModifiedSubscriber {
  constructor(
    private readonly updateDossierDeNominationUseCase: UpdateDossierDeNominationUseCase,
  ) {}

  @OnEvent(GdsTransparenceNominationFilesModifiedEvent.name)
  async handle(
    event: GdsTransparenceNominationFilesModifiedEvent,
  ): Promise<void> {
    const command = UpdateDossierDeNominationCommand.create(event.payload);
    await this.updateDossierDeNominationUseCase.execute(command);
  }
}
