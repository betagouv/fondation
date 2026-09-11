import { DocInvalidation } from 'src/modules/docs/shared/domain/invalidation/official-report-invalidated.integration-event';
import { DateOnly } from 'src/utils/date-only';
import { Id } from 'src/utils/id';

type AgendaSnapshotFile = {
  id: bigint;
  nominationFileId: string;
  reporters: readonly string[];
  isManuallyEdited: boolean;
};

export class AgendaSnapshot {
  private constructor(
    private readonly agendaId: Id<'AgendaId'>,
    private readonly date: DateOnly,
    private readonly sessionMeetingDate: DateOnly,
    private readonly chairmanId: string | null,
    private readonly nominationFiles: Map<string, AgendaSnapshotFile>,
  ) {}

  static from(plain: {
    date: DateOnly;
    agendaId: Id<'AgendaId'>;
    chairmanId: string | null;
    sessionMeetingDate: DateOnly;
    nominationFiles: readonly AgendaSnapshotFile[];
  }): AgendaSnapshot {
    return new AgendaSnapshot(
      plain.agendaId,
      plain.date,
      plain.sessionMeetingDate,
      plain.chairmanId,
      new Map(plain.nominationFiles.map((f) => [f.nominationFileId, f])),
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

    const officialReportInvalidations: DocInvalidation[] = dateChanged
      ? [
          {
            type: 'AgendaDateUpdated',
            payload: {
              agendaId: this.agendaId,
              currentDate: next.date.toJson(),
              previousDate: this.date.toJson(),
            },
          },
        ]
      : [];

    return { hasAny: true, metadata: next, officialReportInvalidations };
  }

  diffFiles(next: { fileIds: ReadonlySet<string> }): AgendaFilesDiff {
    const nominationFileIds = new Set(this.nominationFiles.keys());

    const added = [...next.fileIds.difference(nominationFileIds)];
    const removed = [...nominationFileIds.difference(next.fileIds)];
    const hasAny = added.length > 0 || removed.length > 0;

    if (!hasAny) return { hasAny: false };

    const officialReportInvalidations: DocInvalidation[] = [
      { type: 'AgendaNominationFilesUpdated', payload: { agendaId: this.agendaId } },
    ];

    return { hasAny, added, removed, officialReportInvalidations };
  }

  diffReporters(next: {
    nominationFiles: readonly { id: string; reporters: readonly string[] }[];
  }): AgendaFilesReportersDiff {
    const updatedReporters = next.nominationFiles.flatMap(({ id, reporters }) => {
      const knownFile = this.nominationFiles.get(id);
      if (!knownFile) return [];

      const reportersChanged =
        reporters.length !== knownFile.reporters.length ||
        reporters.some((r) => !knownFile.reporters.includes(r));

      if (!reportersChanged) return [];

      return [{ id: knownFile.id, reporters, isOutdated: knownFile.isManuallyEdited }];
    });

    return updatedReporters.length > 0 ? { hasAny: true, updated: updatedReporters } : { hasAny: false };
  }
}

export type AgendaMetadataDiff =
  | { hasAny: false }
  | {
      hasAny: true;
      metadata: { chairmanId: string; date: DateOnly; sessionMeetingDate: DateOnly };
      officialReportInvalidations: readonly DocInvalidation[];
    };

export type AgendaFilesDiff =
  | { hasAny: false }
  | {
      hasAny: true;
      added: readonly string[];
      removed: readonly string[];
      officialReportInvalidations: readonly DocInvalidation[];
    };

export type AgendaFilesReportersDiff =
  | { hasAny: false }
  | {
      hasAny: true;
      updated: readonly { id: bigint; reporters: readonly string[]; isOutdated: boolean }[];
    };
