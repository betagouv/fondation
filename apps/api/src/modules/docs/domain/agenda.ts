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

    const alreadyReportedFileExists = command.nominationFiles.some(
      Agenda.fileWasAlreadyReported(command.alreadyReportedNominationFiles, { ignore: this.id }),
    );

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
    const agenda = new Agenda(makeId('AgendaId'), makeId('SessionId', props.sessionId));

    if (props.nominationFiles.length === 0) throw new EmptyAgenda(agenda.id);

    const alreadyReportedFileExists = props.nominationFiles.some(
      Agenda.fileWasAlreadyReported(props.alreadyReportedNominationFiles),
    );

    if (alreadyReportedFileExists) {
      throw new NominationFilesAlreadyReported();
    }

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

  // TODO: the naming seems a bit confusing
  static fileWasAlreadyReported(
    alreadyReportedNominationFiles: Map<string, AlreadyReportedNominationFile>,
    { ignore: ignoreAgendaId }: { ignore?: string } = {},
  ): (file: { id: string }) => boolean {
    return function (file: { id: string }): boolean {
      const previous = alreadyReportedNominationFiles.get(file.id);
      return (previous?.reportedIn ?? []).some(
        ({ outcome, agendaId }) =>
          outcome !== null && outcome !== 'SUSPENDED' && (!ignoreAgendaId || agendaId !== ignoreAgendaId),
      );
    };
  }
}
