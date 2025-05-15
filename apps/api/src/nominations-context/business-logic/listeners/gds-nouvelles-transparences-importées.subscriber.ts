import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';
import { ImportNouvelleTransparenceCommand } from '../use-cases/import-nouvelle-transparence/Import-nouvelle-transparence.command';
import { ImportNouvelleTransparenceUseCase } from '../use-cases/import-nouvelle-transparence/import-nouvelle-transparence.use-case';

export class GdsNouvellesTransparencesImportéesSubscriber {
  constructor(
    private readonly nouvelleTransparenceUseCase: ImportNouvelleTransparenceUseCase,
  ) {}

  async handle(payload: GdsNewTransparenceImportedEventPayload) {
    const command = ImportNouvelleTransparenceCommand.create({
      transparenceId: payload.transparenceId,
      formation: payload.formation,
      transparenceName: payload.transparenceName,
      nominationFilesPayload: payload.nominationFiles,
    });
    await this.nouvelleTransparenceUseCase.execute(command);
  }
}
