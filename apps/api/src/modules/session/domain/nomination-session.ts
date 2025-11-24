import { PrioriteEnum } from 'shared-models';

import { AutoAffectations } from 'src/modules/session/domain/auto-affectations';
import { makeId } from 'src/utils/id';

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

type NominationSessionEvent =
  | NominationSessionAffectationVersionCreated
  | NominationSessionAffectationVersionPublished
  | NominationSessionFilePriorityUpdated
  | NominationSessionFileReportersAffected;

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

  #messages: NominationSessionEvent[] = [];
  get messages(): readonly NominationSessionEvent[] {
    return this.#messages;
  }
}
