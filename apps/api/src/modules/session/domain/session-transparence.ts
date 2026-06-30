import { addWeeks } from 'date-fns';

import { Magistrat, PrioriteEnum, TypeDeSaisine } from 'shared-models';

import { AutoAffectations } from 'src/modules/session/domain/auto-affectation/auto-affectations';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';
import { isDefined } from 'src/utils/is-defined';
import { partition } from 'src/utils/iterables';

import {
  LodamNominationFile,
  LodamNominationFileEntity,
  NominationFile,
  NominationFileEntity,
  UpdatableNominationFile,
  UpdatableNominationFileState,
} from './nomination-file';
import { NominationFileOutcome, NominationFileOutcomeEnum } from './nomination-file-outcome';

export class SessionTransparenceFileReportersAffected {
  constructor(
    readonly sessionId: string,
    readonly versionId: string | null,
    readonly affectations: readonly {
      nominationFileId: string;
      reporterIds: readonly string[];
    }[],
  ) {}
}

export class SessionTransparenceFilePrioritiesUpdated {
  constructor(
    readonly sessionId: string,
    readonly nominationFileId: string,
    readonly priorities: readonly PrioriteEnum[],
  ) {}
}

export class SessionTransparenceAffectationVersionPublished {
  constructor(
    readonly sessionId: string,
    readonly versionId: string | undefined,
    readonly userId: string,
  ) {}
}

export class SessionTransparenceAffectationVersionCreated {
  constructor(
    readonly sessionId: string,
    readonly version: { id: string; version: number },
  ) {}
}

export class SessionTransparenceCreated {
  constructor(
    readonly sessionId: string,
    readonly name: string,
    readonly typeDeSaisine: TypeDeSaisine,
    readonly formation: Magistrat.Formation,
    readonly date: DateOnly,
    readonly observationClosingDate: DateOnly,
    readonly dueDate: DateOnly | null,
    readonly positionStartDate: DateOnly | null,
    readonly lolfiSessionId: number | null,
  ) {}
}

export class LodamSessionTransparenceFilesCreated {
  constructor(
    readonly sessionId: string,
    readonly files: readonly LodamNominationFileEntity[],
  ) {}
}

export class SessionTransparenceFilesAssociated {
  constructor(
    readonly sessionId: string,
    readonly files: readonly NominationFileEntity[],
  ) {}
}

export class SessionTransparenceFilesObserversUpdated {
  constructor(
    readonly sessionId: string,
    readonly nominationFileObservers: readonly {
      id: string;
      observers: readonly string[];
    }[],
  ) {}
}

export class SessionTransparenceAttachmentAdded {
  constructor(
    readonly sessionId: string,
    readonly file: { id: string },
  ) {}
}

export class SessionTransparenceAttachmentRemoved {
  constructor(
    readonly sessionId: string,
    readonly fileId: string,
  ) {}
}

export class SessionTransparenceFileAttachmentAdded {
  constructor(
    readonly nominationFileId: string,
    readonly file: { id: string },
  ) {}
}

export class SessionTransparenceFileAttachmentRemoved {
  constructor(
    readonly nominationFileId: string,
    readonly fileId: string,
  ) {}
}

export class SessionTransparenceUpdated {
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

export class SessionTransparenceOutcomeDefined {
  constructor(
    readonly nominationFileId: string,
    readonly outcome: NominationFileOutcomeEnum | null,
    readonly comment: string | null,
  ) {}
}

export class SessionTransparenceFileMemberMemoWritten {
  constructor(
    readonly userId: string,
    readonly sessionId: string,
    readonly nominationFileId: string,
    readonly memo: string,
  ) {}
}

export class SessionTransparenceFileAlertHidden {
  constructor(
    readonly sessionId: string,
    readonly nominationFileId: string,
  ) {}
}

export class SessionTransparenceValidated {
  constructor(
    readonly sessionId: string,
    readonly userId: string | null,
  ) {}
}

export class SessionTransparenceDeleted {
  constructor(
    readonly id: string,
    readonly userId: string,
  ) {}
}

export class SessionTransparenceArchived {
  constructor(
    readonly sessionId: string,
    readonly userId: string,
  ) {}
}

type NominationSessionEvent =
  | LodamSessionTransparenceFilesCreated
  | SessionTransparenceFileAlertHidden
  | SessionTransparenceFileMemberMemoWritten
  | SessionTransparenceOutcomeDefined
  | SessionTransparenceFilesAssociated
  | SessionTransparenceAffectationVersionCreated
  | SessionTransparenceAffectationVersionPublished
  | SessionTransparenceAttachmentAdded
  | SessionTransparenceAttachmentRemoved
  | SessionTransparenceFileAttachmentAdded
  | SessionTransparenceFileAttachmentRemoved
  | SessionTransparenceCreated
  | SessionTransparenceFilePrioritiesUpdated
  | SessionTransparenceFileReportersAffected
  | SessionTransparenceFilesObserversUpdated
  | SessionTransparenceUpdated
  | SessionTransparenceValidated
  | SessionTransparenceDeleted
  | SessionTransparenceArchived;

type SessionTransparenceAffectationVersion = {
  id: string;
  version: number;
  isDraft: boolean;
};

export class NonFormationMemberDefinedAsReporter extends Error {
  constructor() {
    super(`Impossible d'affecter un membre d'une formation incompatible avec cette session`);
  }
}

export class SessionTransparenceAffectationHasUnknownReporter extends Error {
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
    super(unknownFileNumbers.length > 1 ? `Dossiers inconnus` : 'Dossier inconnu');
  }
}

export class CantUpdateNominationFiles extends Error {
  constructor(readonly fileIds: Set<string>) {
    super();
  }
}

export class SessionTransparenceIsNotDeletable extends Error {
  constructor(readonly sessionId: string) {
    super();
  }
}

export class SessionTransparenceIsNotArchivable extends Error {
  constructor(readonly unreportedFileCount: number) {
    super();
  }
}

export class SessionTransparenceIsArchived extends Error {
  constructor(readonly sessionId: string) {
    super();
  }
}

export class SessionTransparence {
  private constructor(
    readonly id: string,
    readonly formation: Magistrat.Formation,
    readonly version: SessionTransparenceAffectationVersion | null,
    private nominationFiles: Map<string, UpdatableNominationFile>,
  ) {}

  static from(props: {
    id: string;
    formation: Magistrat.Formation;
    version: SessionTransparenceAffectationVersion | null;
    nominationFiles: readonly UpdatableNominationFileState[];
  }) {
    return new SessionTransparence(
      props.id,
      props.formation,
      props.version,
      new Map(props.nominationFiles.map((state) => [state.id, UpdatableNominationFile.from(state)] as const)),
    );
  }

  static create(command: {
    name: string;
    typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS;
    formation: Magistrat.Formation;
    date: DateOnly;
    observationClosingDate: DateOnly | null;
    dueDate: DateOnly | null;
    positionStartDate: DateOnly | null;
    lolfiSessionId: number | null;
  }): SessionTransparence {
    const session = SessionTransparence.from({
      id: makeId('NominationSessionId'),
      formation: command.formation,
      version: null,
      nominationFiles: [],
    });

    const observationClosingDate =
      command.observationClosingDate ?? DateOnly.fromDate(addWeeks(command.date.toDate(), 1));

    session.#messages.push(
      new SessionTransparenceCreated(
        session.id,
        command.name,
        command.typeDeSaisine,
        command.formation,
        command.date,
        observationClosingDate,
        command.dueDate,
        command.positionStartDate,
        command.lolfiSessionId,
      ),
    );

    return session;
  }

  static createLodamNominationTreeAndAffectMembers(
    command: CreateLodamSessionTransparenceCommand,
  ): SessionTransparence {
    const session = this.create({ ...command, lolfiSessionId: null });
    session.validate({ userId: command.userId });

    const memberPerFullName = new Map(
      command.formationMembers.map((member) => [member.fullName.toLowerCase(), member] as const),
    );
    const nominationFileEntities: LodamNominationFileEntity[] = [];
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
      throw new SessionTransparenceAffectationHasUnknownReporter(unknownReporters);
    }

    session.nominationFiles = new Map(
      nominationFileEntities.map((x) => [
        x.id,
        UpdatableNominationFile.from({
          id: x.id,
          outcome: null,
          docs: [],
        }),
      ]),
    );

    session.#messages.push(new LodamSessionTransparenceFilesCreated(session.id, nominationFileEntities));

    if (affectations.length > 0) {
      session.affectNominationFileReporters({
        affectations,
        formationMemberIds: new Set(command.formationMembers.map(({ id }) => id)),
      });
    }

    return session;
  }

  associateNominationFiles(command: { files: readonly NominationFile[] }): void {
    this.#messages.push(
      new SessionTransparenceFilesAssociated(
        this.id,
        command.files.map((file) => ({
          ...file,
          id: makeId('NominationFileId'),
        })),
      ),
    );
  }

  setNominationFilePriority(props: { nominationFileId: string; priorities: PrioriteEnum[] }) {
    this.assertsCanUpdateFiles(props.nominationFileId);

    this.#messages.push(
      new SessionTransparenceFilePrioritiesUpdated(this.id, props.nominationFileId, props.priorities),
    );
  }

  affectNominationFileReporters(command: {
    formationMemberIds: Set<string>;
    affectations: readonly {
      nominationFileId: string;
      reporterIds: readonly string[];
    }[];
  }) {
    this.assertsCanUpdateFiles(...command.affectations.map(({ nominationFileId }) => nominationFileId));

    let versionId = this.version?.id;

    if (this.version && !this.version.isDraft) {
      versionId = makeId('AffectationVersionId');
      this.#messages.push(
        new SessionTransparenceAffectationVersionCreated(this.id, {
          id: versionId,
          version: this.version.version + 1,
        }),
      );
    }

    const allReporterIds = Array.from(
      new Set(command.affectations.flatMap(({ reporterIds }) => reporterIds)),
    );

    const allReportersAreFormationMembers = allReporterIds.every((reporterId) =>
      command.formationMemberIds.has(reporterId),
    );

    if (!allReportersAreFormationMembers) {
      throw new NonFormationMemberDefinedAsReporter();
    }

    this.#messages.push(
      new SessionTransparenceFileReportersAffected(this.id, versionId ?? null, command.affectations),
    );
  }

  publishAffectationVersion(props: { userId: string }) {
    if (this.version && !this.version.isDraft) return;

    this.#messages.push(
      new SessionTransparenceAffectationVersionPublished(this.id, this.version?.id, props.userId),
    );
  }

  autoAffectNominationFileReporters(command: {
    autoAffectations: AutoAffectations;
    formationMemberIds: Set<string>;
  }) {
    const affectations = command.autoAffectations.distribute();
    this.affectNominationFileReporters({
      affectations,
      formationMemberIds: command.formationMemberIds,
    });
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
      (file): file is { id: string; observers: string[] } => 'id' in file && isDefined(file.id),
    );

    if (unknownFiles.length > 0) {
      throw new UnknownNominationFiles(unknownFiles.map(({ fileNumber }) => fileNumber));
    }

    this.assertsCanUpdateFiles(...knownFiles.map(({ id }) => id));
    this.#messages.push(new SessionTransparenceFilesObserversUpdated(this.id, knownFiles));
  }

  addAttachments(command: { files: { id: string }[] }) {
    for (const file of command.files) {
      this.#messages.push(new SessionTransparenceAttachmentAdded(this.id, file));
    }
  }

  removeAttachment(command: { fileId: string }) {
    this.#messages.push(new SessionTransparenceAttachmentRemoved(this.id, command.fileId));
  }

  update(command: {
    name: string;
    date: DateOnly;
    observationsClosingDate: DateOnly;
    dueDate: DateOnly | null;
    positionStartDate: DateOnly | null;
  }): void {
    this.#messages.push(new SessionTransparenceUpdated(this.id, command));
  }

  defineNominationFileOutcome(command: { nominationFileId: string; outcome: NominationFileOutcome | null }) {
    this.assertsCanUpdateFiles(command.nominationFileId);

    this.#messages.push(
      new SessionTransparenceOutcomeDefined(
        command.nominationFileId,
        command.outcome?.outcome ?? null,
        command.outcome?.comment ?? null,
      ),
    );
  }

  writeNominationFileMemberMemo(command: { userId: string; nominationFileId: string; memo: string }) {
    const trimmed = command.memo.trim();
    if (trimmed.length === 0) return;

    this.#messages.push(
      new SessionTransparenceFileMemberMemoWritten(
        command.userId,
        this.id,
        command.nominationFileId,
        trimmed,
      ),
    );
  }

  hideAlert(command: { nominationFileId: string }) {
    this.#messages.push(new SessionTransparenceFileAlertHidden(this.id, command.nominationFileId));
  }

  addNominationFileAttachments(command: { nominationFileId: string; files: { id: string }[] }) {
    this.assertsCanUpdateFiles(command.nominationFileId);

    for (const file of command.files) {
      this.#messages.push(new SessionTransparenceFileAttachmentAdded(command.nominationFileId, file));
    }
  }

  removeNominationFileAttachment(command: { nominationFileId: string; fileId: string }) {
    this.assertsCanUpdateFiles(command.nominationFileId);

    this.#messages.push(
      new SessionTransparenceFileAttachmentRemoved(command.nominationFileId, command.fileId),
    );
  }

  validate(command: { userId: string | null }): void {
    this.#messages.push(new SessionTransparenceValidated(this.id, command.userId));
  }

  archive(command: { userId: string; unreportedFileCount: number }): void {
    if (command.unreportedFileCount > 0) {
      throw new SessionTransparenceIsNotArchivable(command.unreportedFileCount);
    }

    this.#messages.push(new SessionTransparenceArchived(this.id, command.userId));
  }

  delete(command: { userId: string; attachmentsCount: number; affectedReportersCount: number }): void {
    if (command.attachmentsCount !== 0 || command.affectedReportersCount !== 0) {
      throw new SessionTransparenceIsNotDeletable(this.id);
    }

    if (this.version?.isDraft) {
      this.publishAffectationVersion(command);
    }

    this.#messages.push(new SessionTransparenceDeleted(this.id, command.userId));
  }

  private assertsCanUpdateFiles(...nominationFileIds: readonly string[]): void {
    const nonUpdatableIds = new Set<string>();
    for (const id of nominationFileIds) {
      const file = this.nominationFiles.get(id);
      if (!file || !file.isUpdatable()) nonUpdatableIds.add(id);
    }

    if (nonUpdatableIds.size) {
      throw new CantUpdateNominationFiles(nonUpdatableIds);
    }
  }

  #messages: NominationSessionEvent[] = [];
  get messages(): readonly NominationSessionEvent[] {
    return this.#messages;
  }
}

export type CreateLodamSessionTransparenceCommand = {
  typeDeSaisine: TypeDeSaisine.TRANSPARENCE_GDS;
  files: readonly LodamNominationFile[];
  name: string;
  date: DateOnly;
  observationClosingDate: DateOnly;
  dueDate: DateOnly | null;
  positionStartDate: DateOnly | null;
  formation: Magistrat.Formation;
  formationMembers: readonly { id: string; fullName: string }[];
  userId: string | null;
};
