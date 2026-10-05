import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import {
  MagistratPhoneNumberAdded,
  MagistratPhoneNumberDeleted,
  MagistratPhoneNumbers,
  MagistratPhoneNumberUpdated,
  PhoneNumberAlreadySaved,
} from '../../domain/magistrat-phone-numbers';
import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { assertNever } from 'src/utils/assert-never';

// the unique index catches the same number saved twice at the same time
function rejectSavedTwice(err: unknown): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002')
    throw new PhoneNumberAlreadySaved();
  throw err;
}

@Injectable()
export class MagistratPhoneNumbersRepository {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
  ) {}

  async findByMagistratId(predicate: { magistratId: string }): Promise<MagistratPhoneNumbers> {
    const magistrat = await this.db.tx.magistrat.findUnique({
      select: {
        id: true,
        phoneNumbers: { select: { id: true, number: true } },
      } satisfies Prisma.MagistratSelect,
      where: { id: predicate.magistratId },
    });
    if (!magistrat) throw new NotFoundException();

    return MagistratPhoneNumbers.from({ magistratId: magistrat.id, phoneNumbers: magistrat.phoneNumbers });
  }

  @Transactional(Propagation.Mandatory)
  async persist(phoneNumbers: MagistratPhoneNumbers): Promise<void> {
    for (const message of phoneNumbers.messages) {
      if (message instanceof MagistratPhoneNumberAdded) await this.persistMagistratPhoneNumberAdded(message);
      else if (message instanceof MagistratPhoneNumberUpdated)
        await this.persistMagistratPhoneNumberUpdated(message);
      else if (message instanceof MagistratPhoneNumberDeleted)
        await this.persistMagistratPhoneNumberDeleted(message);
      else assertNever(message);
    }
  }

  private persistMagistratPhoneNumberAdded(message: MagistratPhoneNumberAdded) {
    const now = this.clock.now();
    return this.db.tx.magistratPhoneNumber
      .create({
        data: {
          createdAt: now,
          id: message.id,
          label: message.label,
          magistratId: message.magistratId,
          number: message.number,
          updatedAt: now,
        },
      })
      .catch(rejectSavedTwice);
  }

  private persistMagistratPhoneNumberUpdated(message: MagistratPhoneNumberUpdated) {
    return this.db.tx.magistratPhoneNumber
      .update({
        data: { label: message.label, number: message.number, updatedAt: this.clock.now() },
        where: { id: message.id },
      })
      .catch(rejectSavedTwice);
  }

  private persistMagistratPhoneNumberDeleted(message: MagistratPhoneNumberDeleted) {
    return this.db.tx.magistratPhoneNumber.delete({ where: { id: message.id } });
  }
}
