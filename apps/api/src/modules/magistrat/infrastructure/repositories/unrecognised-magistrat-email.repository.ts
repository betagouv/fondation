import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { assertNever } from '../../../../utils/assert-never';
import { makeId } from '../../../../utils/id';
import { Clock } from '../../../framework/clock';
import { Db } from '../../../framework/database';
import {
  oldestKeptAttemptAt,
  UnrecognisedMagistratEmail,
  UnrecognisedMagistratEmailAlreadyHandled,
  UnrecognisedMagistratEmailAttached,
  UnrecognisedMagistratEmailDismissed,
} from '../../domain/unrecognised-magistrat-email';

@Injectable()
export class UnrecognisedMagistratEmailRepository {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  @Transactional(Propagation.Mandatory)
  async find({ id }: { id: string }): Promise<UnrecognisedMagistratEmail> {
    const row = await this.db.tx.unrecognisedMagistratEmail.findUnique({
      select: { email: true, id: true } satisfies Prisma.UnrecognisedMagistratEmailSelect,
      where: { id },
    });
    if (!row) throw new UnrecognisedMagistratEmailAlreadyHandled();

    return UnrecognisedMagistratEmail.from(row);
  }

  @Transactional(Propagation.Mandatory)
  async findMagistrat({ id }: { id: string }): Promise<{ id: string; status: 'ACTIVE' | 'INACTIVE' }> {
    const magistrat = await this.db.tx.magistrat.findUnique({
      select: { id: true, status: true } satisfies Prisma.MagistratSelect,
      where: { id },
    });
    if (!magistrat) throw new NotFoundException();

    return magistrat;
  }

  @Transactional(Propagation.Mandatory)
  async record({ email }: { email: string }): Promise<void> {
    const now = this.clock.now();
    await this.db.tx.unrecognisedMagistratEmail.upsert({
      create: { email, id: makeId(), lastAttemptAt: now },
      update: { lastAttemptAt: now },
      where: { email },
    });
  }

  @Transactional(Propagation.Mandatory)
  async forgetOld(): Promise<number> {
    const { count } = await this.db.tx.unrecognisedMagistratEmail.deleteMany({
      where: { lastAttemptAt: { lt: oldestKeptAttemptAt(this.clock.now()) } },
    });
    return count;
  }

  @Transactional(Propagation.Mandatory)
  async persist(email: UnrecognisedMagistratEmail): Promise<void> {
    for (const message of email.messages) {
      if (message instanceof UnrecognisedMagistratEmailAttached) await this.persistAttached(message);
      else if (message instanceof UnrecognisedMagistratEmailDismissed) await this.forget(message.id);
      else assertNever(message);
    }
  }

  private async persistAttached(message: UnrecognisedMagistratEmailAttached) {
    const attachment = {
      attachedAt: this.clock.now(),
      authorId: message.authorId,
      magistratId: message.magistratId,
    };
    await this.forget(message.id);
    await this.db.tx.attachedMagistratEmail.upsert({
      create: { ...attachment, email: message.email, id: makeId() },
      update: attachment,
      where: { email: message.email },
    });
  }

  /** the delete waits for a colleague handling the same address and then finds nothing left */
  private async forget(id: string) {
    const { count } = await this.db.tx.unrecognisedMagistratEmail.deleteMany({ where: { id } });
    if (count === 0) throw new UnrecognisedMagistratEmailAlreadyHandled();
  }
}
