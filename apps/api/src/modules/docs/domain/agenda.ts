import { Gender } from 'shared-models';

import { UserTitleEnum } from 'src/modules/administration/domain/user-enum';
import { DateOnly } from 'src/utils/date-only';
import { Id, makeId } from 'src/utils/id';

import { AgendaNominationFile } from './agenda-nomination-file';
import { DocNominationFileOutcomeEnum } from './doc-nomination-file-outcome';

export class AgendaCreated {
  constructor(
    readonly agendaId: Id<'AgendaId'>,
    readonly sessionId: Id<'SessionId'>,
    readonly authorId: Id<'AuthorId'>,
    readonly chairman: {
      id: Id<'ChairmanId'>;
      firstName: string;
      lastName: string;
      gender: Gender;
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
      gender: Gender;
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

export class EmptyAgenda extends Error {
  constructor(readonly agendaId: string) {
    super();
  }
}

export class NominationFilesAlreadyReported extends Error {}

type AlreadyReportedNominationFile = {
  id: string;
  reportedIn: { agendaId: string; outcome: DocNominationFileOutcomeEnum | null }[];
};

export class Agenda {
  readonly #messages: AgendaEvent[] = [];

  private constructor(
    readonly id: Id<'AgendaId'>,
    readonly sessionId: Id<'SessionId'>,
  ) {}

  get messages(): readonly AgendaEvent[] {
    return this.#messages;
  }

  static from(props: { id: Id<'AgendaId'>; sessionId: Id<'SessionId'> }): Agenda {
    return new Agenda(props.id, props.sessionId);
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
      gender: Gender;
      title: UserTitleEnum | null;
      displayTitle: string | null;
    };
    alreadyReportedNominationFiles: Map<string, AlreadyReportedNominationFile>;
  }): void {
    if (command.nominationFiles.length === 0) throw new EmptyAgenda(this.id);

    const alreadyReportedFileExists = command.nominationFiles.some((file) => {
      const previous = command.alreadyReportedNominationFiles.get(file.id);
      const wasAlreadyReported = (previous?.reportedIn ?? []).some(
        (report) =>
          /** @warning in the update case we discard any previous appearance in this agenda */
          report.agendaId !== this.id && report.outcome !== null && report.outcome !== 'SUSPENDED',
      );

      return wasAlreadyReported;
    });

    if (alreadyReportedFileExists) {
      throw new NominationFilesAlreadyReported();
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
      gender: Gender;
      title: UserTitleEnum | null;
      displayTitle: string | null;
    };
    date: DateOnly;
    sessionMeetingDate: DateOnly;
    nominationFiles: readonly AgendaNominationFile[];
    alreadyReportedNominationFiles: Map<string, AlreadyReportedNominationFile>;
  }): Agenda {
    const alreadyReportedFileExists = props.nominationFiles.some((file) => {
      const previous = props.alreadyReportedNominationFiles.get(file.id);
      const wasAlreadyReported = (previous?.reportedIn ?? []).some(
        (report) => report.outcome !== null && report.outcome !== 'SUSPENDED',
      );

      return wasAlreadyReported;
    });

    if (alreadyReportedFileExists) {
      throw new NominationFilesAlreadyReported();
    }

    const agenda = new Agenda(makeId('AgendaId'), makeId('SessionId', props.sessionId));
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
