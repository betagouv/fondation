import { Magistrat } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/business-logic/models/events/gds-transparence-imported.event';

export class ImportNouvelleTransparenceCommand {
  constructor(
    private readonly _transparenceId: string,
    private readonly _transparenceName: string,
    private readonly _formations: Magistrat.Formation[],
    private readonly _nominationFilesPayload: GdsNewTransparenceImportedEventPayload['nominationFiles'],
  ) {}

  get transparenceId(): string {
    return this._transparenceId;
  }
  get transparenceName(): string {
    return this._transparenceName;
  }
  get formations(): Magistrat.Formation[] {
    return this._formations;
  }
  get nominationFilesPayload(): GdsNewTransparenceImportedEventPayload['nominationFiles'] {
    return this._nominationFilesPayload;
  }

  static create(arg: {
    transparenceId: string;
    transparenceName: string;
    formations: Magistrat.Formation[];
    nominationFilesPayload: GdsNewTransparenceImportedEventPayload['nominationFiles'];
  }): ImportNouvelleTransparenceCommand {
    return new ImportNouvelleTransparenceCommand(
      arg.transparenceId,
      arg.transparenceName,
      arg.formations,
      arg.nominationFilesPayload,
    );
  }
}
