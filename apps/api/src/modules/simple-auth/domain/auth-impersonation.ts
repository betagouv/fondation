import { Id, makeId } from 'src/utils/id';
import * as time from 'src/utils/time';

export class ImpersonationExpired extends Error {
  constructor(readonly expiredAt: Date) {
    super();
  }
}

export class AuthImpersonation {
  private static readonly DEFAULT_DURATION = 1 * time.HOURS;

  get expiresAt(): Date {
    return new Date(this.startedAt.getTime() + AuthImpersonation.DEFAULT_DURATION);
  }

  private constructor(
    readonly id: Id<'ImpersonationId'>,
    readonly startedAt: Date,
    readonly authSessionId: string,
    readonly impersonateId: string,
  ) {}

  static from(props: {
    id: string;
    now: Date;
    startedAt: Date;
    authSessionId: string;
    impersonateId: string;
  }): AuthImpersonation {
    const { id, startedAt, authSessionId, impersonateId, now } = props;
    const impersonation = new AuthImpersonation(
      makeId('ImpersonationId', id),
      startedAt,
      authSessionId,
      impersonateId,
    );

    if (impersonation.expiresAt.getTime() < now.getTime()) {
      throw new ImpersonationExpired(impersonation.expiresAt);
    }

    return impersonation;
  }

  static start(props: { authSessionId: string; impersonateId: string; now: Date }): AuthImpersonation {
    return new AuthImpersonation(
      makeId('ImpersonationId'),
      props.now,
      props.authSessionId,
      props.impersonateId,
    );
  }
}
