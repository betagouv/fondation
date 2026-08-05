import { ReportedNominationFileCollection } from '../../shared/domain/reported-nomination-file-collection';
import { UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { DateOnly } from 'src/utils/date-only';
import { Id, makeId } from 'src/utils/id';
import { assertIsDefined } from 'src/utils/is-defined';

import { AgendaNominationFile } from './agenda-nomination-file';
import { AgendaFilesDiff, AgendaMetadataDiff, AgendaSnapshot } from './agenda-snapshot';

export type AgendaChairman = {
  id: string;
  firstName: string;
  lastName: string;
  gender: GenderEnum;
  title: UserTitleEnum | null;
  displayTitle: string | null;
};

export class AgendaCreated {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly sessionId: Id<'SessionId'>,
    readonly authorId: Id<'AuthorId'>,
    readonly chairman: {
      id: Id<'ChairmanId'>;
      firstName: string;
      lastName: string;
      gender: GenderEnum;
      title: UserTitleEnum | null;
      displayTitle: string | null;
    },
    readonly date: Date,
    readonly sessionMeetingDate: Date,
    readonly nominationFiles: readonly AgendaNominationFile[],
  ) {}
}

export class AgendaDeleted {
  constructor(readonly agendaId: Id<'AgendaId'>) {}
}

export class AgendaMetadataUpdated {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly authorId: Id<'AuthorId'>,
    readonly update: Extract<AgendaMetadataDiff, { hasAny: true }>['metadata'],
  ) {}
}

export class AgendaFilesUpdated {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly authorId: Id<'AuthorId'>,
    readonly sessionId: Id<'SessionId'>,
    readonly update: Pick<Extract<AgendaFilesDiff, { hasAny: true }>, 'added' | 'removed'>,
  ) {}
}

export class AgendaFileBlockEdited {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly fileId: bigint,
    readonly html: string,
    readonly outdated: boolean,
  ) {}
}

export class AgendaFileBlockReset {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly fileId: bigint,
  ) {}
}

export type AgendaEvent =
  | AgendaCreated
  | AgendaMetadataUpdated
  | AgendaFilesUpdated
  | AgendaDeleted
  | AgendaFileBlockEdited
  | AgendaFileBlockReset;

export class EmptyAgenda extends Error {}

export class AgendaFilesAlreadyReported extends Error {
  constructor(readonly fileIds: readonly string[]) {
    super();
  }
}

export class Agenda {
  readonly #messages: AgendaEvent[] = [];

  private constructor(
    readonly id: Id<'AgendaId'>,
    readonly sessionId: Id<'SessionId'>,
    readonly officialReportId: Id<'OfficialReportId'> | null,
    private readonly snapshot?: AgendaSnapshot,
  ) {}

  get messages(): readonly AgendaEvent[] {
    return this.#messages;
  }

  static from(props: {
    id: Id<'AgendaId'>;
    sessionId: Id<'SessionId'>;
    officialReportId: Id<'OfficialReportId'> | null;
    snapshot?: AgendaSnapshot;
  }): Agenda {
    return new Agenda(props.id, props.sessionId, props.officialReportId, props.snapshot);
  }

  updateMetadata(command: {
    authorId: string;
    date: DateOnly;
    sessionMeetingDate: DateOnly;
    chairmanId: string;
  }): AgendaMetadataDiff {
    const diff = assertIsDefined(this.snapshot).diffMetadata(command);
    if (diff.hasAny) {
      this.#messages.push(
        new AgendaMetadataUpdated(this.id, makeId('AuthorId', command.authorId), diff.metadata),
      );
    }

    return diff;
  }

  updateFiles(command: {
    authorId: string;
    nominationFileIds: Set<string>;
    reportedFiles: ReportedNominationFileCollection;
  }): AgendaFilesDiff {
    if (command.nominationFileIds.size === 0) throw new EmptyAgenda();

    const reportedFiles = [...command.nominationFileIds].filter((fileId) =>
      command.reportedFiles.isReported({
        nominationFileId: fileId,
        ignoreOfficialReportId: this.officialReportId ?? undefined,
      }),
    );

    if (reportedFiles.length) {
      throw new AgendaFilesAlreadyReported(reportedFiles);
    }

    const diff = assertIsDefined(this.snapshot).diffFiles({
      fileIds: new Set(command.nominationFileIds),
    });

    if (diff.hasAny) {
      this.#messages.push(
        new AgendaFilesUpdated(this.id, makeId('AuthorId', command.authorId), this.sessionId, diff),
      );
    }

    return diff;
  }

  delete(): void {
    this.#messages.push(new AgendaDeleted(this.id));
  }

  editFileBlock(command: { fileId: bigint; html: string; outdated: boolean }): void {
    this.#messages.push(new AgendaFileBlockEdited(this.id, command.fileId, command.html, command.outdated));
  }

  resetFileBlock(command: { fileId: bigint }): void {
    this.#messages.push(new AgendaFileBlockReset(this.id, command.fileId));
  }

  static create(props: {
    sessionId: string;
    authorId: string;
    chairman: {
      id: string;
      firstName: string;
      lastName: string;
      gender: GenderEnum;
      title: UserTitleEnum | null;
      displayTitle: string | null;
    };
    date: DateOnly;
    sessionMeetingDate: DateOnly;
    nominationFiles: readonly AgendaNominationFile[];
    reportedFiles: ReportedNominationFileCollection;
  }): Agenda {
    if (props.nominationFiles.length === 0) throw new EmptyAgenda();

    const reportedFiles = props.nominationFiles.filter((file) =>
      props.reportedFiles.isReported({ nominationFileId: file.id }),
    );
    if (reportedFiles.length) {
      throw new AgendaFilesAlreadyReported(reportedFiles.map(({ id }) => id));
    }

    const agenda = Agenda.from({
      id: makeId('AgendaId'),
      sessionId: makeId('SessionId', props.sessionId),
      officialReportId: null,
    });

    agenda.#messages.push(
      new AgendaCreated(
        agenda.id,
        makeId('SessionId', props.sessionId),
        makeId('AuthorId', props.authorId),
        { ...props.chairman, id: makeId('ChairmanId', props.chairman.id) },
        props.date.toDate(),
        props.sessionMeetingDate.toDate(),
        props.nominationFiles,
      ),
    );

    return agenda;
  }
}
