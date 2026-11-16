import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { makeId } from '../../../../utils/id';
import { Db } from '../../../framework/database';
import { LoginAttempt } from '../../domain/login-attempt';

@Injectable()
export class LoginAttemptRepository {
  constructor(private readonly db: Db) {}

  /** Recorded before the password is checked and outside any transaction, so that simultaneous attempts count each other */
  async start(command: {
    email: string;
    ip: string;
    knownBrowser: string | null;
    now: Date;
  }): Promise<LoginAttempt> {
    const id = makeId('LoginAttemptId');
    const { email, ip, knownBrowser } = command;
    await this.db.tx.loginAttempt.create({ data: { attemptedAt: command.now, email, id, ip, knownBrowser } });

    const others = {
      attemptedAt: { gte: LoginAttempt.windowStart(command.now) },
      id: { not: id },
    } satisfies Prisma.LoginAttemptWhereInput;
    const failures = {
      email: await this.db.tx.loginAttempt.count({
        where: { ...others, ...LoginAttemptRepository.ofAddress(email) },
      }),
      ip: await this.db.tx.loginAttempt.count({ where: { ...others, ip } }),
      knownBrowser: knownBrowser
        ? await this.db.tx.loginAttempt.count({ where: { ...others, knownBrowser } })
        : 0,
    };

    return new LoginAttempt({ email, id, ip, knownBrowser }, failures);
  }

  async forget(attempt: LoginAttempt): Promise<void> {
    await this.db.tx.loginAttempt.deleteMany({ where: { id: attempt.id } });
  }

  /** From every IP, while the failures of the IP on other addresses still count */
  async forgetFailuresOnSuccess(attempt: LoginAttempt): Promise<void> {
    const { target, throttle } = attempt.forgottenOnSuccess;
    await this.db.tx.loginAttempt.deleteMany({
      where:
        throttle === 'knownBrowser' ? { knownBrowser: target } : LoginAttemptRepository.ofAddress(target),
    });
  }

  /** The attempts of known browsers count for them, not for their address */
  private static ofAddress(email: string): Prisma.LoginAttemptWhereInput {
    return { email: { equals: email, mode: 'insensitive' }, knownBrowser: null };
  }

  async purge(now: Date): Promise<void> {
    await this.db.tx.loginAttempt.deleteMany({
      where: { attemptedAt: { lt: LoginAttempt.windowStart(now) } },
    });
  }
}
