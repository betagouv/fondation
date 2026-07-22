import { ReportedNominationFileCollection } from '../../shared/domain/reported-nomination-file-collection';
import { UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { GenderEnum } from 'src/modules/shared/gender.enum';
import { DateOnly } from 'src/utils/date-only';
import { Id, makeId } from 'src/utils/id';

import { AgendaNominationFile } from './agenda-nomination-file';

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

export class AgendaUpdated {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
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

export type AgendaEvent = AgendaCreated | AgendaUpdated | AgendaDeleted;

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
  ) {}

  get messages(): readonly AgendaEvent[] {
    return this.#messages;
  }

  static from(props: {
    id: Id<'AgendaId'>;
    sessionId: Id<'SessionId'>;
    officialReportId: Id<'OfficialReportId'> | null;
  }): Agenda {
    return new Agenda(props.id, props.sessionId, props.officialReportId);
  }

  update(command: {
    authorId: string;
    date: DateOnly;
    sessionMeetingDate: DateOnly;
    nominationFiles: readonly AgendaNominationFile[];
    chairman: {
      id: string;
      firstName: string;
      lastName: string;
      gender: GenderEnum;
      title: UserTitleEnum | null;
      displayTitle: string | null;
    };
    reportedFiles: ReportedNominationFileCollection;
  }): void {
    if (command.nominationFiles.length === 0) throw new EmptyAgenda();

    const reportedFiles = command.nominationFiles.filter((file) =>
      command.reportedFiles.isReported({
        nominationFileId: file.id,
        ignoreOfficialReportId: this.officialReportId ?? undefined,
      }),
    );

    if (reportedFiles.length) {
      throw new AgendaFilesAlreadyReported(reportedFiles.map(({ id }) => id));
    }

    this.#messages.push(
      new AgendaUpdated(
        this.id,
        makeId('AuthorId', command.authorId),
        { ...command.chairman, id: makeId('ChairmanId', command.chairman.id) },
        command.date.toDate(),
        command.sessionMeetingDate.toDate(),
        command.nominationFiles,
      ),
    );
  }

  delete(): void {
    this.#messages.push(new AgendaDeleted(this.id));
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
