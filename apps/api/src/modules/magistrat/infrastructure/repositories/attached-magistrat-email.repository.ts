import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../generated/prisma/client';
import { assertNever } from '../../../../utils/assert-never';
import { Db } from '../../../framework/database';
import {
  AttachedMagistratEmail,
  AttachedMagistratEmailAlreadyDetached,
  AttachedMagistratEmailDetached,
} from '../../domain/attached-magistrat-email';

@Injectable()
export class AttachedMagistratEmailRepository {
  constructor(private readonly db: Db) {}

  @Transactional(Propagation.Mandatory)
  async find(predicate: { id: string; magistratId: string }): Promise<AttachedMagistratEmail> {
    const row = await this.db.tx.attachedMagistratEmail.findUnique({
      select: { id: true } satisfies Prisma.AttachedMagistratEmailSelect,
      where: predicate,
    });
    if (!row) throw new AttachedMagistratEmailAlreadyDetached();

    return AttachedMagistratEmail.from(row);
  }

  @Transactional(Propagation.Mandatory)
  async persist(email: AttachedMagistratEmail): Promise<void> {
    for (const message of email.messages) {
      if (message instanceof AttachedMagistratEmailDetached)
        await this.db.tx.attachedMagistratEmail.deleteMany({ where: { id: message.id } });
      else assertNever(message);
    }
  }
}
