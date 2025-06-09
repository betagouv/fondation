import { TransparenceXlsxImportéeEventPayload } from 'src/data-administration-context/transparence-xlsx/business-logic/models/events/transparence-xlsx-importée.event';
import { ImportNouvelleTransparenceXlsxCommand } from '../use-cases/import-nouvelle-transparence-xlsx/Import-nouvelle-transparence-xlsx.command';
import { ImportNouvelleTransparenceXlsxUseCase } from '../use-cases/import-nouvelle-transparence-xlsx/import-nouvelle-transparence-xlsx.use-case';

export class TransparenceXlsxImportéeSubscriber {
  constructor(
    private readonly importNouvelleTransparenceXlsxUseCase: ImportNouvelleTransparenceXlsxUseCase,
  ) {}

  async handle(payload: TransparenceXlsxImportéeEventPayload): Promise<void> {
    const command = ImportNouvelleTransparenceXlsxCommand.create({
      transparenceId: payload.transparenceId,
      transparenceName: payload.transparenceName,
      formation: payload.formation,
      dateEchéance: payload.dateEchéance,
      dateTransparence: payload.dateTransparence,
      dateClôtureDélaiObservation: payload.dateClôtureDélaiObservation,
      nominationFilesPayload: payload.nominationFiles,
    });

    await this.importNouvelleTransparenceXlsxUseCase.execute(command);
  }
}
