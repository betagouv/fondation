import { Id, makeId } from 'src/utils/id';
import { DAYS } from 'src/utils/time';

export class AuthSession {
  static readonly DEFAULT_DURATION = 30 * DAYS;

  get expiresAt(): Date {
    return new Date(this.startedAt.getTime() + this.durationMs);
  }

  private constructor(
    readonly id: Id<'AuthSessionId'>,
    readonly startedAt: Date,
    readonly durationMs: number,
    readonly data: { userId: string },
  ) {}

  static start(props: { now: Date; data: { userId: string } }): AuthSession {
    const id = makeId('AuthSessionId');
    const durationMs = AuthSession.DEFAULT_DURATION;

    return new AuthSession(id, props.now, durationMs, props.data);
  }
}
