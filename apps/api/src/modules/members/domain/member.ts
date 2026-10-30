import { NotFoundException } from '@nestjs/common';

import type { RoleEnum } from '../../shared/role.enum';

import { JurisdictionId } from './jurisdiction';

export class Member {
  private constructor(
    readonly id: string,
    readonly role: RoleEnum,
    readonly jurisdictionIds: Set<JurisdictionId>,
  ) {}

  static from(props: { id: string; role: RoleEnum; jurisdictionIds: Set<JurisdictionId> }): Member {
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

  readonly #messages: MemberEvent[] = [];
  get messages(): readonly MemberEvent[] {
    return this.#messages;
  }
}

export type MemberEvent = ExcludedMemberJurisdictions | MemberDisplayTitleUpdated;

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
