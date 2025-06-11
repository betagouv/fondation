import { DateOnlyJson, Magistrat } from 'shared-models';
import { TransparenceXlsxImportéeEventPayload } from 'src/data-administration-context/transparence-xlsx/business-logic/models/events/transparence-xlsx-importée.event';

export class ImportNouvelleTransparenceXlsxCommand {
  constructor(
    private readonly _transparenceId: string,
    private readonly _transparenceName: string,
    private readonly _formation: Magistrat.Formation,
    private readonly _dateEchéance: DateOnlyJson | null,
    private readonly _dateTransparence: DateOnlyJson,
    private readonly _dateClôtureDélaiObservation: DateOnlyJson,
    private readonly _nominationFilesPayload: TransparenceXlsxImportéeEventPayload['nominationFiles'],
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
  get dateEchéance(): DateOnlyJson | null {
    return this._dateEchéance;
  }
  get dateTransparence(): DateOnlyJson {
    return this._dateTransparence;
  }
  get dateClôtureDélaiObservation(): DateOnlyJson | null {
    return this._dateClôtureDélaiObservation;
  }
  get nominationFilesPayload(): TransparenceXlsxImportéeEventPayload['nominationFiles'] {
    return this._nominationFilesPayload;
  }

  static create(arg: {
    transparenceId: string;
    transparenceName: string;
    formation: Magistrat.Formation;
    dateEchéance: DateOnlyJson | null;
    dateTransparence: DateOnlyJson;
    dateClôtureDélaiObservation: DateOnlyJson;
    nominationFilesPayload: TransparenceXlsxImportéeEventPayload['nominationFiles'];
  }): ImportNouvelleTransparenceXlsxCommand {
    return new ImportNouvelleTransparenceXlsxCommand(
      arg.transparenceId,
      arg.transparenceName,
      arg.formation,
      arg.dateEchéance,
      arg.dateTransparence,
      arg.dateClôtureDélaiObservation,
      arg.nominationFilesPayload,
    );
  }
}
