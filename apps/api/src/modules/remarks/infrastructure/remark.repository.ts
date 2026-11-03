import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from '../../../generated/prisma/client';
import { assertNever } from '../../../utils/assert-never';
import { Clock } from '../../framework/clock';
import { Db } from '../../framework/database';
import { Remark, RemarkSent, RemarkStatusChanged } from '../domain/remark';

@Injectable()
export class RemarkRepository {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  async find(predicate: { remarkId: string }): Promise<Remark> {
    const remark = await this.db.tx.remark.findUnique({
      select: { id: true, status: true, statusComment: true } satisfies Prisma.RemarkSelect,
      where: { id: predicate.remarkId },
    });
    if (!remark) throw new NotFoundException();

    return Remark.from({ id: remark.id, status: { comment: remark.statusComment, value: remark.status } });
  }

  @Transactional(Propagation.Mandatory)
  async persist(remark: Remark): Promise<void> {
    for (const message of remark.messages) {
      if (message instanceof RemarkSent) await this.persistRemarkSent(message);
      else if (message instanceof RemarkStatusChanged) await this.persistRemarkStatusChanged(message);
      else assertNever(message);
    }
  }

  private persistRemarkSent(message: RemarkSent) {
    return this.db.tx.remark.create({
      data: {
        authorId: message.authorId,
        id: message.remarkId,
        impersonatedId: message.impersonatedId,
        sentAt: this.clock.now(),
        text: message.text,
        url: message.url,
      },
    });
  }

  private persistRemarkStatusChanged(message: RemarkStatusChanged) {
    const { comment, value } = message.status;
    const changedAt = this.clock.now();
    return this.db.tx.remark.update({
      data: {
        status: value,
        statusChangedAt: changedAt,
        statusChangedById: message.changedBy,
        statusChanges: {
          create: { changedAt, changedBy: message.changedBy, comment, status: value },
        },
        statusComment: comment,
      },
      where: { id: message.remarkId },
    });
  }
}
