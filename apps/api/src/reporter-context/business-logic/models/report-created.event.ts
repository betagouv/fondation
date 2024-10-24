import { DomainEvent } from 'src/shared-kernel/business-logic/models/domainEvent';

export type ReportCreatedEventPayload = {
  reportId: string;
  importedNominationFileId: string;
};

export class ReportCreatedEvent extends DomainEvent<ReportCreatedEventPayload> {
  readonly name = 'REPORT_CREATED';

  constructor(
    id: string,
    reportId: string,
    importedNominationFileId: string,
    currentDate: Date,
  ) {
    super(
      id,
      ReportCreatedEvent.name,
      { reportId, importedNominationFileId },
      currentDate,
    );
  }
}
