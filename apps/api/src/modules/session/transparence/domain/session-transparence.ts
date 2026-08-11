import { addWeeks } from 'date-fns';

import { NominationFileDocsSnapshot } from '../../shared/types/nomination-file';
import { NominationFileOutcome, NominationFileOutcomeEnum } from '../../shared/types/nomination-file-outcome';
import * as policies from 'src/modules/session/shared/policies/nomination-file.policies';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { PriorityEnum } from 'src/modules/shared/priority.enum';
import { TypeDeSaisineEnum } from 'src/modules/shared/type-de-saisine.enum';
import { DateOnly } from 'src/utils/date-only';
import { makeId } from 'src/utils/id';
import { isDefined } from 'src/utils/is-defined';
import { partition } from 'src/utils/iterables';
import { TimeOnly } from 'src/utils/time-only';

import { AutoAffectations } from './auto-affectation';
import {
  LodamTransparenceFile,
  LodamTransparenceFileEntity,
  LolfiTransparenceFile,
} from './transparence-file';

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
    readonly priorities: readonly PriorityEnum[],
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
    readonly typeDeSaisine: TypeDeSaisineEnum,
    readonly formation: FormationEnum,
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
    readonly files: readonly LodamTransparenceFileEntity[],
  ) {}
}

export class SessionTransparenceLolfiFilesAssociated {
  constructor(
    readonly sessionId: string,
    readonly files: readonly LolfiTransparenceFile[],
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

export class SessionTransparenceAuditionScheduled {
  constructor(
    readonly sessionId: string,
    readonly nominationFileId: string,
    readonly auditionDateTime: { date: DateOnly; time: TimeOnly },
  ) {}
}

export class SessionTransparenceAuditionUnScheduled {
  constructor(
    readonly sessionId: string,
    readonly nominationFileId: string,
  ) {}
}

export class AuditionRequiresDateAndTime extends Error {
  constructor() {
    super("La date et l'heure d'audition doivent être renseignées ensemble");
  }
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

export class SessionTransparenceFileMissingEvaluationUpdated {
  constructor(
    readonly sessionId: string,
    readonly nominationFileId: string,
    readonly missingEvaluation: boolean,
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
  | SessionTransparenceAuditionScheduled
  | SessionTransparenceAuditionUnScheduled
  | SessionTransparenceFileMemberMemoWritten
  | SessionTransparenceFileMissingEvaluationUpdated
  | SessionTransparenceOutcomeDefined
  | SessionTransparenceLolfiFilesAssociated
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

export class CannotScheduleAuditionOnNominationFile extends Error {
  constructor(readonly nominationFileId: string) {
    super();
  }
}

export class SessionTransparence {
  private constructor(
    readonly id: string,
    readonly formation: FormationEnum,
    readonly version: SessionTransparenceAffectationVersion | null,
    private files: Map<string, { canUpdate: boolean; canScheduleAudition: boolean }>,
  ) {}

  static from(props: {
    id: string;
    formation: FormationEnum;
    version: SessionTransparenceAffectationVersion | null;
    nominationFiles: readonly NominationFileDocsSnapshot[];
  }) {
    const files = new Map(
      props.nominationFiles.map(
        (file) =>
          [
            file.id,
            {
              canUpdate: policies.canUpdateNominationFile(file, { archivedAt: null }),
              canScheduleAudition: policies.canScheduleAudition(file, { archivedAt: null }),
            },
          ] as const,
      ),
    );

    return new SessionTransparence(props.id, props.formation, props.version, files);
  }

  static create(command: {
    name: string;
    typeDeSaisine: 'TRANSPARENCE_GDS';
    formation: FormationEnum;
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
    const nominationFileEntities: LodamTransparenceFileEntity[] = [];
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

    session.files = new Map(
      nominationFileEntities.map(
        (x) =>
          [
            x.id,
            {
              canScheduleAudition: policies.canScheduleAudition({ outcome: null }, { archivedAt: null }),
              canUpdate: policies.canUpdateNominationFile(
                { id: x.id, outcome: null, docs: [] },
                { archivedAt: null },
              ),
            },
          ] as const,
      ),
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

  associateLolfiFiles(command: { files: readonly LolfiTransparenceFile[] }): void {
    this.#messages.push(new SessionTransparenceLolfiFilesAssociated(this.id, command.files));
  }

  setNominationFilePriority(props: { nominationFileId: string; priorities: PriorityEnum[] }) {
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

  unscheduleAudition(command: { nominationFileId: string }) {
    this.#messages.push(new SessionTransparenceAuditionUnScheduled(this.id, command.nominationFileId));
  }

  scheduleAudition(command: {
    nominationFileId: string;
    auditionDateTime: { date: DateOnly; time: TimeOnly };
  }) {
    this.assertsCanUpdateFiles(command.nominationFileId);

    const file = this.files.get(command.nominationFileId);
    if (!file?.canScheduleAudition) {
      throw new CannotScheduleAuditionOnNominationFile(command.nominationFileId);
    }

    this.#messages.push(
      new SessionTransparenceAuditionScheduled(this.id, command.nominationFileId, command.auditionDateTime),
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

  updateMissingEvaluation(command: { nominationFileId: string; missingEvaluation: boolean }) {
    this.assertsCanUpdateFiles(command.nominationFileId);

    this.#messages.push(
      new SessionTransparenceFileMissingEvaluationUpdated(
        this.id,
        command.nominationFileId,
        command.missingEvaluation,
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
      const file = this.files.get(id);
      if (!file?.canUpdate) nonUpdatableIds.add(id);
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
  typeDeSaisine: 'TRANSPARENCE_GDS';
  files: readonly LodamTransparenceFile[];
  name: string;
  date: DateOnly;
  observationClosingDate: DateOnly;
  dueDate: DateOnly | null;
  positionStartDate: DateOnly | null;
  formation: FormationEnum;
  formationMembers: readonly { id: string; fullName: string }[];
  userId: string | null;
};
