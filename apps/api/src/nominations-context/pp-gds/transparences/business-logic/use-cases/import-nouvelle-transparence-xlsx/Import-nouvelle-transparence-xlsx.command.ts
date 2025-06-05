import { DateOnlyJson, Magistrat } from 'shared-models';
import { GdsNewTransparenceImportedEventPayload } from 'src/data-administration-context/transparence-xlsx/business-logic/models/events/gds-transparence-imported.event';

export class ImportNouvelleTransparenceXlsxCommand {
  constructor(
    private readonly _transparenceId: string,
    private readonly _transparenceName: string,
    private readonly _formation: Magistrat.Formation,
    private readonly _dateEchéance: DateOnlyJson,
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
  get dateEchéance(): DateOnlyJson {
    return this._dateEchéance;
  }
  get nominationFilesPayload(): GdsNewTransparenceImportedEventPayload['nominationFiles'] {
    return this._nominationFilesPayload;
  }

  static create(arg: {
    transparenceId: string;
    transparenceName: string;
    formation: Magistrat.Formation;
    dateEchéance: DateOnlyJson;
    nominationFilesPayload: GdsNewTransparenceImportedEventPayload['nominationFiles'];
  }): ImportNouvelleTransparenceXlsxCommand {
    return new ImportNouvelleTransparenceXlsxCommand(
      arg.transparenceId,
      arg.transparenceName,
      arg.formation,
      arg.dateEchéance,
      arg.nominationFilesPayload,
    );
  }
}
