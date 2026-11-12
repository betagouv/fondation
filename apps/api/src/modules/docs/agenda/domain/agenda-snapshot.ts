import { DateOnly } from '../../../../utils/date-only';
import { Id } from '../../../../utils/id';
import { DocInvalidation } from '../../shared/domain/doc-invalidation';
import {
  type CurrentNames,
  NamedMember,
  namedToday,
  sameMembers,
  sameNames,
} from '../../shared/domain/named-member';

type AgendaSnapshotFile = {
  id: bigint;
  nominationFileId: string;
  reporters: readonly NamedMember[];
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

  /**
   * the row id only names a block inside one version, since opening a draft copies every row under
   * fresh ids. The proposition it stands for is what survives, so every write is addressed by it.
   */
  nominationFileIdOf(fileId: bigint): string | null {
    for (const file of this.nominationFiles.values()) {
      if (file.id === fileId) return file.nominationFileId;
    }

    return null;
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

  /** the files whose reporters bear another name today */
  diffNames(names: CurrentNames): AgendaFilesReportersDiff {
    return this.diffReporters({
      nominationFiles: [...this.nominationFiles].map(([id, { reporters }]) => ({
        id,
        reporters: namedToday(reporters, names.reporters),
      })),
    });
  }

  /** who reports on a file, and how they are named, are told apart: only the first outdates a block written by hand */
  diffReporters(next: {
    nominationFiles: readonly { id: string; reporters: readonly NamedMember[] }[];
  }): AgendaFilesReportersDiff {
    const updated = next.nominationFiles.flatMap(({ id, reporters }) => {
      const knownFile = this.nominationFiles.get(id);
      if (!knownFile) return [];

      const whoChanged = !sameMembers(knownFile.reporters, reporters);
      if (!whoChanged && sameNames(knownFile.reporters, reporters)) return [];

      return [{ isManuallyEdited: knownFile.isManuallyEdited, nominationFileId: id, reporters, whoChanged }];
    });

    return updated.length > 0 ? { hasAny: true, updated } : { hasAny: false };
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
      updated: readonly {
        isManuallyEdited: boolean;
        nominationFileId: string;
        reporters: readonly NamedMember[];
        /** a member joined or left the file's reporters, rather than only being named anew */
        whoChanged: boolean;
      }[];
    };
