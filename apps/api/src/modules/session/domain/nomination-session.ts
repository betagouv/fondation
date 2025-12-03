import { Magistrat, PrioriteEnum, TypeDeSaisine } from 'shared-models';

import { AutoAffectations } from 'src/modules/session/domain/auto-affectations';
import { DateOnly } from 'src/shared-kernel/business-logic/models/date-only';
import { makeId } from 'src/utils/id';
import { NominationFile, NominationFileEntity } from './nomination-file';

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
    readonly versionId: string,
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
    readonly file: readonly NominationFileEntity[],
  ) {}
}

export class NominationSessionFileCommentAccessGranted {
  constructor(
    readonly sessionId: string,
    readonly nominationFileId: string,
    readonly userIds: readonly string[],
  ) {}
}

type NominationSessionEvent =
  | NominationSessionAffectationVersionCreated
  | NominationSessionAffectationVersionPublished
  | NominationSessionFilePriorityUpdated
  | NominationSessionFileReportersAffected
  | NominationSessionFileCommentAccessGranted
  | NominationSessionCreated
  | NominationSessionFilesCreated;

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

export class NominationSession {
  private constructor(
    readonly id: string,
    private readonly version: NominationSessionAffectationVersion | null,
    private readonly formationMemberIds: Set<string>,
  ) {}

  static from(props: {
    id: string;
    version: NominationSessionAffectationVersion | null;
    formationMemberIds: Set<string> | null;
  }) {
    return new NominationSession(
      props.id,
      props.version,
      props.formationMemberIds ?? new Set<string>(),
    );
  }

  static createNominationTreeAndAffectMembers(
    command: CreateNominationSessionCommand,
  ): NominationSession {
    const formationMemberIds = new Set(
      command.formationMembers.map(({ id }) => id),
    );
    const session = NominationSession.from({
      id: makeId('NominationSessionId'),
      formationMemberIds,
      version: null,
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
        const fullName = reporter;
        const member = memberPerFullName.get(fullName);

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
    if (!this.version || !this.version.isDraft) return;

    this.#messages.push(
      new NominationSessionAffectationVersionPublished(
        this.id,
        this.version.id,
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
