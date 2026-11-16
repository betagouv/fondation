import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { makeId } from '../../../../utils/id';
import { Db } from '../../../framework/database';
import { LoginAttempt, LoginCount } from '../../domain/login-attempt';

@Injectable()
export class LoginAttemptRepository {
  constructor(private readonly db: Db) {}

  /** Recorded before the password is checked and outside any transaction, so that simultaneous attempts count each other */
  async start(command: {
    email: string;
    ip: string;
    knownBrowserId: string | null;
    now: Date;
  }): Promise<LoginAttempt> {
    const id = makeId('LoginAttemptId');
    const { email, ip, knownBrowserId } = command;
    await this.db.tx.loginAttempt.create({
      data: { attemptedAt: command.now, email, id, ip, knownBrowserId },
    });

    const others = {
      attemptedAt: { gte: LoginAttempt.windowStart(command.now) },
      id: { not: id },
    } satisfies Prisma.LoginAttemptWhereInput;
    const failures = (count: LoginCount) =>
      this.db.tx.loginAttempt.count({ where: { ...others, ...LoginAttemptRepository.of(count) } });

    // A known browser escapes the count of its address, which is not read then
    return new LoginAttempt(
      { email, id, ip, knownBrowserId },
      {
        email: knownBrowserId ? 0 : await failures({ target: email, throttle: 'email' }),
        ip: await failures({ target: ip, throttle: 'ip' }),
        knownBrowser: knownBrowserId
          ? await failures({ target: knownBrowserId, throttle: 'knownBrowser' })
          : 0,
      },
    );
  }

  async forget(attempt: LoginAttempt): Promise<void> {
    await this.db.tx.loginAttempt.deleteMany({ where: { id: attempt.id } });
  }

  /** From every IP, while the failures of the IP on other addresses still count */
  async forgetFailuresOnSuccess(attempt: LoginAttempt): Promise<void> {
    await this.db.tx.loginAttempt.deleteMany({
      where: LoginAttemptRepository.of(attempt.forgottenOnSuccess),
    });
  }

  /** The attempts of known browsers count for them, not for their address */
  private static of({ target, throttle }: LoginCount): Prisma.LoginAttemptWhereInput {
    if (throttle === 'knownBrowser') return { knownBrowserId: target };
    if (throttle === 'ip') return { ip: target };
    return { email: { equals: target, mode: 'insensitive' }, knownBrowserId: null };
  }

  async purge(now: Date): Promise<void> {
    await this.db.tx.loginAttempt.deleteMany({
      where: { attemptedAt: { lt: LoginAttempt.windowStart(now) } },
    });
  }
}
