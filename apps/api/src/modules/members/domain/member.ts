import { JurisdictionId } from './jurisdiction';
import { NotFoundException } from '@nestjs/common';

export class Member {
  private constructor(
    readonly id: string,
    readonly jurisdictionIds: Set<JurisdictionId>,
  ) {}

  static from(props: {
    id: string;
    jurisdictionIds: Set<JurisdictionId>;
  }): Member {
    return new Member(props.id, props.jurisdictionIds ?? new Set());
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

    this.pushMessage(
      new ExcludedMemberJurisdictions({
        jurisdictionIds,
        userId: this.id,
      }),
    );
  }

  readonly #messages: ExcludedMemberJurisdictions[] = [];
  get messages(): ExcludedMemberJurisdictions[] {
    return this.#messages;
  }

  private pushMessage(message: ExcludedMemberJurisdictions) {
    this.#messages.push(message);
  }
}

export class ExcludedMemberJurisdictions {
  readonly userId: string;
  readonly jurisdictionIds: readonly string[];

  constructor(props: { userId: string; jurisdictionIds: readonly string[] }) {
    this.userId = props.userId;
    this.jurisdictionIds = props.jurisdictionIds;
  }
}
