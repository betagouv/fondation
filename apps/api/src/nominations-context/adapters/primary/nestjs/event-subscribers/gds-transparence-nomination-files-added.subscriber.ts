import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { GdsTransparenceNominationFilesAddedEvent } from 'src/data-administration-context/business-logic/models/events/gds-transparence-nomination-files-added.event';
import { ImportNouveauxDossiersTransparenceCommand } from 'src/nominations-context/business-logic/use-cases/import-nouveaux-dossiers-transparence/import-nouveaux-dossiers-transparence.command';
import { ImportNouveauxDossiersTransparenceUseCase } from 'src/nominations-context/business-logic/use-cases/import-nouveaux-dossiers-transparence/import-nouveaux-dossiers-transparence.use-case';

@Injectable()
export class GdsTransparenceNominationFilesAddedSubscriber {
  constructor(
    private readonly importNouveauxDossiersUseCase: ImportNouveauxDossiersTransparenceUseCase,
  ) {}

  @OnEvent(GdsTransparenceNominationFilesAddedEvent.name)
  async handle(event: GdsTransparenceNominationFilesAddedEvent): Promise<void> {
    const command = ImportNouveauxDossiersTransparenceCommand.create({
      transparenceId: event.payload.transparenceId,
      nominationFiles: event.payload.nominationFiles,
    });
    await this.importNouveauxDossiersUseCase.execute(command);
  }
}
