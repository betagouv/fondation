import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { makeId } from '../../../../utils/id';
import { Db } from '../../../framework/database';
import { LoginAttempt } from '../../domain/login-attempt';

@Injectable()
export class LoginAttemptRepository {
  constructor(private readonly db: Db) {}

  /** Recorded before the password is checked and outside any transaction, so that simultaneous attempts count each other */
  async start(command: { email: string; ip: string; now: Date }): Promise<LoginAttempt> {
    const id = makeId('LoginAttemptId');
    await this.db.tx.loginAttempt.create({
      data: { attemptedAt: command.now, email: command.email, id, ip: command.ip },
    });

    const others = {
      attemptedAt: { gte: LoginAttempt.windowStart(command.now) },
      id: { not: id },
    } satisfies Prisma.LoginAttemptWhereInput;
    const email = await this.db.tx.loginAttempt.count({
      where: { ...others, email: { equals: command.email, mode: 'insensitive' } },
    });
    const ip = await this.db.tx.loginAttempt.count({ where: { ...others, ip: command.ip } });

    return new LoginAttempt({ email: command.email, id, ip: command.ip }, { email, ip });
  }

  async forget(attempt: LoginAttempt): Promise<void> {
    await this.db.tx.loginAttempt.deleteMany({ where: { id: attempt.id } });
  }

  /** From every IP, while the failures of the IP on other addresses still count */
  async forgetFailuresOfAddress(attempt: LoginAttempt): Promise<void> {
    await this.db.tx.loginAttempt.deleteMany({
      where: { email: { equals: attempt.email, mode: 'insensitive' } },
    });
  }

  async purge(now: Date): Promise<void> {
    await this.db.tx.loginAttempt.deleteMany({
      where: { attemptedAt: { lt: LoginAttempt.windowStart(now) } },
    });
  }
}
