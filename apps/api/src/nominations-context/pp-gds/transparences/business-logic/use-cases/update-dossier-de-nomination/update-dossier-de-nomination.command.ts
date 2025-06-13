import { GdsTransparenceNominationFilesModifiedEventPayload } from 'src/data-administration-context/transparence-tsv/business-logic/models/events/gds-transparence-nomination-files-modified.event';

export class UpdateDossierDeNominationCommand {
  constructor(
    public readonly transparenceId: string,
    public readonly transparenceName: string,
    public readonly nominationFiles: GdsTransparenceNominationFilesModifiedEventPayload['nominationFiles'],
  ) {}

  static create(payload: GdsTransparenceNominationFilesModifiedEventPayload) {
    return new UpdateDossierDeNominationCommand(
      payload.transparenceId,
      payload.transparenceName,
      payload.nominationFiles,
    );
  }
}
