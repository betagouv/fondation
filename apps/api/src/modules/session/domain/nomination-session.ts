import { Magistrat, PrioriteEnum, TypeDeSaisine } from 'shared-models';

import { AutoAffectations } from 'src/modules/session/domain/auto-affectations';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';
import { isDefined } from 'src/utils/is-defined';
import { partition } from 'src/utils/iterables';
import { NominationFile, NominationFileEntity } from './nomination-file';
import {
  NominationFileOutcome,
  NominationFileOutcomeEnum,
} from './nomination-file-outcome';

export class NominationSessionFileReportersAffected {
  constructor(
    readonly sessionId: string,
    readonly versionId: string | null,
    readonly affectations: readonly {
      nominationFileId: string;
      reporterIds: readonly string[];
    }[],
  ) {}
}

export class NominationSessionFilePriorityUpdated {
  constructor(
    readonly sessionId: string,
    readonly nominationFileId: string,
    readonly priority: PrioriteEnum | null,
  ) {}
}

export class NominationSessionAffectationVersionPublished {
  constructor(
    readonly sessionId: string,
    readonly versionId: string | undefined,
    readonly userId: string,
  ) {}
}

export class NominationSessionAffectationVersionCreated {
  constructor(
    readonly sessionId: string,
    readonly version: { id: string; version: number },
  ) {}
}

export class NominationSessionCreated {
  constructor(
    readonly sessionId: string,
    readonly name: string,
    readonly typeDeSaisine: TypeDeSaisine,
    readonly formation: Magistrat.Formation,
    readonly date: DateOnly,
    readonly observationClosingDate: DateOnly,
    readonly dueDate: DateOnly | null,
    readonly positionStartDate: DateOnly | null,
  ) {}
}

export class NominationSessionFilesCreated {
  constructor(
    readonly sessionId: string,
    readonly files: readonly NominationFileEntity[],
  ) {}
}

export class NominationSessionFileCommentAccessGranted {
  constructor(
    readonly sessionId: string,
    readonly nominationFileId: string,
    readonly userIds: readonly string[],
  ) {}
}

export class NominationSessionFilesObserversUpdated {
  constructor(
    readonly sessionId: string,
    readonly nominationFileObservers: readonly {
      id: string;
      observers: readonly string[];
    }[],
  ) {}
}

export class NominationSessionAttachmentAdded {
  constructor(
    readonly sessionId: string,
    readonly file: { id: string },
  ) {}
}

export class NominationSessionAttachmentRemoved {
  constructor(
    readonly sessionId: string,
    readonly fileId: string,
  ) {}
}

export class NominationSessionUpdated {
  constructor(
    readonly sessionId: string,
    readonly data: {
      name: string;
      date: DateOnly;
      observationsClosingDate: DateOnly;
      dueDate: DateOnly | null;
      positionStartDate: DateOnly | null;
    },
  ) {}
}

export class NominationFileOutcomeDefined {
  constructor(
    readonly nominationFileId: string,
    readonly outcome: NominationFileOutcomeEnum | null,
    readonly comment: string | null,
  ) {}
}

export class NominationFileMemberMemoWritten {
  constructor(
    readonly userId: string,
    readonly sessionId: string,
    readonly nominationFileId: string,
    readonly memo: string,
  ) {}
}

type NominationSessionEvent =
  | NominationSessionAffectationVersionCreated
  | NominationSessionAffectationVersionPublished
  | NominationSessionFilePriorityUpdated
  | NominationSessionFileReportersAffected
  | NominationSessionFileCommentAccessGranted
  | NominationSessionCreated
  | NominationSessionFilesCreated
  | NominationSessionFilesObserversUpdated
  | NominationSessionAttachmentAdded
  | NominationSessionAttachmentRemoved
  | NominationSessionUpdated
  | NominationFileOutcomeDefined
  | NominationFileMemberMemoWritten;

type NominationSessionAffectationVersion = {
  id: string;
  version: number;
  isDraft: boolean;
};

export class NonFormationMemberDefinedAsReporter extends Error {
  constructor() {
    super(
      `Impossible d'affecter un membre d'une formation incompatible avec cette session`,
    );
  }
}

export class NominationSessionAffectationHasUnknownReporter extends Error {
  constructor(
    readonly errors: readonly {
      fileNumber: number;
      reporters: readonly string[];
    }[],
  ) {
    super(`Impossible d'affecter un membre inconnu`);
  }
}

export class UnknownNominationFiles extends Error {
  constructor(readonly unknownFileNumbers: number[]) {
    super(
      unknownFileNumbers.length > 1 ? `Dossiers inconnus` : 'Dossier inconnu',
    );
  }
}

export class NominationFilesHaveOutcome extends Error {
  constructor(readonly nominationFileIds: readonly string[]) {
    super();
  }
}

export class NominationSession {
  private constructor(
    readonly id: string,
    private readonly version: NominationSessionAffectationVersion | null,
    private readonly formationMemberIds: Set<string>,
    private readonly nominationFileIdsWithOutcome: Set<string>,
  ) {}

  static from(props: {
    id: string;
    version: NominationSessionAffectationVersion | null;
    formationMemberIds: Set<string> | null;
    nominationFileIdsWithOutcome: Set<string> | null;
  }) {
    return new NominationSession(
      props.id,
      props.version,
      props.formationMemberIds ?? new Set<string>(),
      props.nominationFileIdsWithOutcome ?? new Set<string>(),
    );
  }

  static createNominationTreeAndAffectMembers(
    command: CreateNominationSessionCommand,
  ): NominationSession {
    const session = NominationSession.from({
      id: makeId('NominationSessionId'),
      version: null,
      formationMemberIds: new Set(command.formationMembers.map(({ id }) => id)),
      nominationFileIdsWithOutcome: null,
    });

    session.#messages.push(
      new NominationSessionCreated(
        session.id,
        command.name,
        command.typeDeSaisine,
        command.formation,
        command.date,
        command.observationClosingDate,
        command.dueDate,
        command.positionStartDate,
      ),
    );

    const memberPerFullName = new Map(
      command.formationMembers.map(
        (member) => [member.fullName.toLowerCase(), member] as const,
      ),
    );

    const nominationFileEntities: NominationFileEntity[] = [];
    const unknownReporters: { fileNumber: number; reporters: string[] }[] = [];
    const affectations: {
      nominationFileId: string;
      reporterIds: readonly string[];
    }[] = [];

    for (const file of command.files) {
      const reporterIds: string[] = [];
      const fileUnknownReporters: string[] = [];

      for (const reporter of file.reporters) {
        const member = memberPerFullName.get(reporter.toLowerCase());

        if (member) {
          reporterIds.push(member.id);
        } else {
          fileUnknownReporters.push(reporter);
        }
      }

      if (fileUnknownReporters.length) {
        unknownReporters.push({
          fileNumber: file.fileNumber,
          reporters: fileUnknownReporters,
        });
      } else {
        const nominationFileId = makeId('NominationFileId');
        nominationFileEntities.push({ ...file, id: nominationFileId });

        if (reporterIds.length > 0) {
          affectations.push({ nominationFileId, reporterIds });
        }
      }
    }

    if (unknownReporters.length) {
      throw new NominationSessionAffectationHasUnknownReporter(
        unknownReporters,
      );
    }

    session.#messages.push(
      new NominationSessionFilesCreated(session.id, nominationFileEntities),
    );

    if (affectations.length > 0) {
      session.affectNominationFileReporters(affectations);
    }

    return session;
  }

  setNominationFilePriority(props: {
    nominationFileId: string;
    priority: PrioriteEnum | null;
  }) {
    if (this.nominationFileHasOutcome(props.nominationFileId)) {
      throw new NominationFilesHaveOutcome([props.nominationFileId]);
    }

    this.#messages.push(
      new NominationSessionFilePriorityUpdated(
        this.id,
        props.nominationFileId,
        props.priority,
      ),
    );
  }

  affectNominationFileReporters(
    affectations: readonly {
      nominationFileId: string;
      reporterIds: readonly string[];
    }[],
  ) {
    const nominationFileIdsWithOutcome = affectations.filter(
      ({ nominationFileId }) => this.nominationFileHasOutcome(nominationFileId),
    );

    if (nominationFileIdsWithOutcome.length > 0) {
      throw new NominationFilesHaveOutcome(
        nominationFileIdsWithOutcome.map(
          ({ nominationFileId }) => nominationFileId,
        ),
      );
    }

    let versionId = this.version?.id;

    if (this.version && !this.version.isDraft) {
      versionId = makeId('AffectationVersionId');
      this.#messages.push(
        new NominationSessionAffectationVersionCreated(this.id, {
          id: versionId,
          version: this.version.version + 1,
        }),
      );
    }

    const allReporterIds = Array.from(
      new Set(affectations.flatMap(({ reporterIds }) => reporterIds)),
    );

    const allReportersAreFormationMembers = allReporterIds.every((reporterId) =>
      this.formationMemberIds.has(reporterId),
    );

    if (!allReportersAreFormationMembers) {
      throw new NonFormationMemberDefinedAsReporter();
    }

    this.#messages.push(
      new NominationSessionFileReportersAffected(
        this.id,
        versionId ?? null,
        affectations,
      ),
    );
  }

  publishAffectationVersion(props: { userId: string }) {
    if (this.version && !this.version.isDraft) return;

    this.#messages.push(
      new NominationSessionAffectationVersionPublished(
        this.id,
        this.version?.id,
        props.userId,
      ),
    );
  }

  autoAffectNominationFileReporters(autoAffectations: AutoAffectations) {
    const affectations = autoAffectations.distribute();
    this.affectNominationFileReporters(affectations);
  }

  grantCommentAccess(command: {
    nominationFileId: string;
    userIds: readonly string[];
  }) {
    const allUsersAreFormationMembers = command.userIds.every((userId) =>
      this.formationMemberIds.has(userId),
    );

    if (!allUsersAreFormationMembers) {
      throw new NonFormationMemberDefinedAsReporter();
    }

    this.#messages.push(
      new NominationSessionFileCommentAccessGranted(
        this.id,
        command.nominationFileId,
        command.userIds,
      ),
    );
  }

  updateNominationFileObservers(command: {
    existingNominationFiles: readonly { id: string; fileNumber: number }[];
    nominationFiles: readonly { fileNumber: number; observers: string[] }[];
  }): void {
    const existingNominationFiles = new Map(
      command.existingNominationFiles.map((x) => [x.fileNumber, x.id] as const),
    );

    const files = command.nominationFiles.map((file) => {
      const existingId = existingNominationFiles.get(file.fileNumber);
      return existingId ? { id: existingId, observers: file.observers } : file;
    });

    const [knownFiles, unknownFiles] = partition(
      files,
      (file): file is { id: string; observers: string[] } =>
        'id' in file && isDefined(file.id),
    );

    if (unknownFiles.length > 0) {
      throw new UnknownNominationFiles(
        unknownFiles.map(({ fileNumber }) => fileNumber),
      );
    }

    const [withOutcome, knownFilesWithoutOutcome] = partition(
      knownFiles,
      ({ id }) => this.nominationFileHasOutcome(id),
    );

    if (withOutcome.length > 0) {
      throw new NominationFilesHaveOutcome(withOutcome.map(({ id }) => id));
    }

    this.#messages.push(
      new NominationSessionFilesObserversUpdated(
        this.id,
        knownFilesWithoutOutcome,
      ),
    );
  }

  addAttachment(command: { file: { id: string } }) {
    this.#messages.push(
      new NominationSessionAttachmentAdded(this.id, command.file),
    );
  }

  removeAttachment(command: { fileId: string }) {
    this.#messages.push(
      new NominationSessionAttachmentRemoved(this.id, command.fileId),
    );
  }

  update(command: {
    name: string;
    date: DateOnly;
    observationsClosingDate: DateOnly;
    dueDate: DateOnly | null;
    positionStartDate: DateOnly | null;
  }): void {
    this.#messages.push(new NominationSessionUpdated(this.id, command));
  }

  defineNominationFileOutcome(command: {
    nominationFileId: string;
    outcome: NominationFileOutcome | null;
  }) {
    this.#messages.push(
      new NominationFileOutcomeDefined(
        command.nominationFileId,
        command.outcome?.outcome ?? null,
        command.outcome?.comment ?? null,
      ),
    );
  }

  writeNominationFileMemberMemo(command: {
    userId: string;
    nominationFileId: string;
    memo: string;
  }) {
    const trimmed = command.memo.trim();
    if (trimmed.length === 0) return;

    this.#messages.push(
      new NominationFileMemberMemoWritten(
        command.userId,
        this.id,
        command.nominationFileId,
        trimmed,
      ),
    );
  }

  private nominationFileHasOutcome(nominationFileId: string): boolean {
    return this.nominationFileIdsWithOutcome.has(nominationFileId);
  }

  #messages: NominationSessionEvent[] = [];
  get messages(): readonly NominationSessionEvent[] {
    return this.#messages;
  }
}

export type CreateNominationSessionCommand = {
  typeDeSaisine: TypeDeSaisine;
  files: readonly NominationFile[];
  name: string;
  date: DateOnly;
  observationClosingDate: DateOnly;
  dueDate: DateOnly | null;
  positionStartDate: DateOnly | null;
  formation: Magistrat.Formation;
  formationMembers: readonly { id: string; fullName: string }[];
};
