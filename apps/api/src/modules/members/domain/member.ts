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

  /** replaces the whole list: the members manager saves the selection of its modal */
  excludeMagistrats(command: {
    knownMagistratIds: ReadonlySet<string>;
    magistratIds: readonly string[];
  }): void {
    const unknownMagistratIds = command.magistratIds.filter((id) => !command.knownMagistratIds.has(id));
    if (unknownMagistratIds.length > 0) throw new NotFoundException({ magistrats: unknownMagistratIds });

    this.#messages.push(new MemberMagistratsExcluded(this.id, [...new Set(command.magistratIds)]));
  }

  updateDisplayTitle(displayTitle: string | null): void {
    this.#messages.push(new MemberDisplayTitleUpdated(this.id, displayTitle));
  }

  readonly #messages: MemberEvent[] = [];
  get messages(): readonly MemberEvent[] {
    return this.#messages;
  }
}

export type MemberEvent = ExcludedMemberJurisdictions | MemberDisplayTitleUpdated | MemberMagistratsExcluded;

export class MemberMagistratsExcluded {
  constructor(
    readonly userId: string,
    readonly magistratIds: readonly string[],
  ) {}
}

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
