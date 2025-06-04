import { Magistrat } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/transparence-xlsx/business-logic/models/events/gds-transparence-imported.event';

export class ImportNouvelleTransparenceCommand {
  constructor(
    private readonly _transparenceId: string,
    private readonly _transparenceName: string,
    private readonly _formation: Magistrat.Formation,
    private readonly _nominationFilesPayload: GdsNewTransparenceImportedEventPayload['nominationFiles'],
  ) {}

  get transparenceId(): string {
    return this._transparenceId;
  }
  get transparenceName(): string {
    return this._transparenceName;
  }
  get formation(): Magistrat.Formation {
    return this._formation;
  }
  get nominationFilesPayload(): GdsNewTransparenceImportedEventPayload['nominationFiles'] {
    return this._nominationFilesPayload;
  }

  static create(arg: {
    transparenceId: string;
    transparenceName: string;
    formation: Magistrat.Formation;
    nominationFilesPayload: GdsNewTransparenceImportedEventPayload['nominationFiles'];
  }): ImportNouvelleTransparenceCommand {
    return new ImportNouvelleTransparenceCommand(
      arg.transparenceId,
      arg.transparenceName,
      arg.formation,
      arg.nominationFilesPayload,
    );
  }
}
