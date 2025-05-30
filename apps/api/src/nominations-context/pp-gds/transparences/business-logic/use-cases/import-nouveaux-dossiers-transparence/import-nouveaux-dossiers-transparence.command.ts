import { GdsTransparenceNominationFilesAddedEventPayload } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-nomination-files-added.event';

export class ImportNouveauxDossiersTransparenceCommand {
  constructor(
    private readonly _transparenceId: string,
    private readonly _nominationFiles: GdsTransparenceNominationFilesAddedEventPayload['nominationFiles'],
  ) {}

  get transparenceId(): string {
    return this._transparenceId;
  }

  get nominationFiles(): GdsTransparenceNominationFilesAddedEventPayload['nominationFiles'] {
    return this._nominationFiles;
  }

  static create(arg: {
    transparenceId: string;
    nominationFiles: GdsTransparenceNominationFilesAddedEventPayload['nominationFiles'];
  }): ImportNouveauxDossiersTransparenceCommand {
    return new ImportNouveauxDossiersTransparenceCommand(
      arg.transparenceId,
      arg.nominationFiles,
    );
  }
}
