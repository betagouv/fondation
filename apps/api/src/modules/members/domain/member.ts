import { JurisdictionId } from './jurisdiction';

export class Member {
  private constructor(readonly id: string) {}

  static from(props: { id: string }): Member {
    return new Member(props.id);
  }

  excludeJurisdictions(jurisdictionIds: readonly JurisdictionId[]): void {
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

  constructor(props: {
    userId: string;
    jurisdictionIds: readonly JurisdictionId[];
  }) {
    this.userId = props.userId;
    this.jurisdictionIds = props.jurisdictionIds;
  }
}
