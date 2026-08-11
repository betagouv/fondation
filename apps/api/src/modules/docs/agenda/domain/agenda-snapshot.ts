import { OfficialReportInvalidation } from 'src/modules/docs/shared/domain/invalidation/official-report-invalidated.integration-event';
import { DateOnly } from 'src/utils/date-only';
import { Id } from 'src/utils/id';

export class AgendaSnapshot {
  private constructor(
    private readonly agendaId: Id<'AgendaId'>,
    private readonly date: DateOnly,
    private readonly sessionMeetingDate: DateOnly,
    private readonly chairmanId: string | null,
    private readonly nominationFileIds: ReadonlySet<string>,
  ) {}

  static from(plain: {
    date: DateOnly;
    agendaId: Id<'AgendaId'>;
    chairmanId: string | null;
    sessionMeetingDate: DateOnly;
    nominationFileIds: ReadonlySet<string>;
  }): AgendaSnapshot {
    return new AgendaSnapshot(
      plain.agendaId,
      plain.date,
      plain.sessionMeetingDate,
      plain.chairmanId,
      plain.nominationFileIds,
    );
  }

  diffMetadata(next: {
    date: DateOnly;
    chairmanId: string;
    sessionMeetingDate: DateOnly;
  }): AgendaMetadataDiff {
    const dateChanged = !this.date.equals(next.date);
    const sessionMeetingDateChanged = !this.sessionMeetingDate.equals(next.sessionMeetingDate);
    const chairmanChanged = this.chairmanId !== next.chairmanId;

    const hasAny = dateChanged || sessionMeetingDateChanged || chairmanChanged;
    if (!hasAny) return { hasAny: false };

    const officialReportInvalidations: OfficialReportInvalidation[] = dateChanged
      ? [{ type: 'AgendaDateUpdated', payload: { agendaId: this.agendaId, date: next.date.toJson() } }]
      : [];

    return { hasAny: true, metadata: next, officialReportInvalidations };
  }

  diffFiles(next: { fileIds: ReadonlySet<string> }): AgendaFilesDiff {
    const added = [...next.fileIds.difference(this.nominationFileIds)];
    const removed = [...this.nominationFileIds.difference(next.fileIds)];
    const hasAny = added.length > 0 || removed.length > 0;

    if (!hasAny) return { hasAny: false };

    const officialReportInvalidations: OfficialReportInvalidation[] = [
      { type: 'AgendaNominationFilesUpdated', payload: { agendaId: this.agendaId } },
    ];

    return { hasAny, added, removed, officialReportInvalidations };
  }
}

export type AgendaMetadataDiff =
  | { hasAny: false }
  | {
      hasAny: true;
      metadata: { chairmanId: string; date: DateOnly; sessionMeetingDate: DateOnly };
      officialReportInvalidations: readonly OfficialReportInvalidation[];
    };

export type AgendaFilesDiff =
  | { hasAny: false }
  | {
      hasAny: true;
      added: readonly string[];
      removed: readonly string[];
      officialReportInvalidations: readonly OfficialReportInvalidation[];
    };
