import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Role } from 'shared-models';
import { JurisdictionId } from './jurisdiction';
import { MemberDutyEnum, MemberTitleEnum } from './member-enums';

export class Member {
  private constructor(
    readonly id: string,
    readonly role: Role,
    readonly jurisdictionIds: Set<JurisdictionId>,
  ) {}

  static from(props: {
    id: string;
    role: Role;
    jurisdictionIds: Set<JurisdictionId>;
  }): Member {
    return new Member(props.id, props.role, props.jurisdictionIds ?? new Set());
  }

  excludeJurisdictions(jurisdictionIds: readonly string[]): void {
    const nonExistingJurisdictionIds = jurisdictionIds.filter(
      (id) => !this.jurisdictionIds.has(id as JurisdictionId),
    );

    if (nonExistingJurisdictionIds.length > 0) {
      // TODO: introduce domain exceptions?
      throw new NotFoundException({
        jurisdictions: nonExistingJurisdictionIds,
      });
    }

    this.#messages.push(
      new ExcludedMemberJurisdictions({
        jurisdictionIds,
        userId: this.id,
      }),
    );
  }

  updateDisplayTitle(displayTitle: string | null): void {
    this.#messages.push(new MemberDisplayTitleUpdated(this.id, displayTitle));
  }

  updateTitle(title: MemberTitleEnum | null): void {
    if (
      (title === 'PRESIDENT_PARQUET' && this.role === Role.MEMBRE_DU_SIEGE) ||
      (title === 'PRESIDENT_SIEGE' && this.role === Role.MEMBRE_DU_PARQUET)
    ) {
      throw new IncompatibleTitle();
    }

    this.#messages.push(
      new MemberTitleUpdated(
        this.id,
        title,
        title === null ? null : 'PRESIDENT',
      ),
    );
  }

  readonly #messages: MemberEvent[] = [];
  get messages(): readonly MemberEvent[] {
    return this.#messages;
  }
}

export type MemberEvent =
  | ExcludedMemberJurisdictions
  | MemberDisplayTitleUpdated
  | MemberTitleUpdated;

export class ExcludedMemberJurisdictions {
  readonly userId: string;
  readonly jurisdictionIds: readonly string[];

  constructor(props: { userId: string; jurisdictionIds: readonly string[] }) {
    this.userId = props.userId;
    this.jurisdictionIds = props.jurisdictionIds;
  }
}

export class MemberDisplayTitleUpdated {
  constructor(
    readonly userId: string,
    readonly displayTitle: string | null,
  ) {}
}

export class MemberTitleUpdated {
  constructor(
    readonly userId: string,
    readonly title: MemberTitleEnum | null,
    readonly duty: MemberDutyEnum | null,
  ) {}
}

export class IncompatibleTitle extends BadRequestException {
  constructor() {
    super(`Titre et formation incompatibles`);
  }
}
