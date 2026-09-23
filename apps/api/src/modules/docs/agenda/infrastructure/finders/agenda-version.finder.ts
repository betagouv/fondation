import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';

@Injectable()
export class AgendaVersionFinder {
  constructor(private readonly db: Db) {}

  /** the version every reader sees, null while the agenda has never been validated */
  @Transactional()
  async published(query: { agendaId: string }): Promise<string | null> {
    const version = await this.db.tx.agendaVersion.findFirst({
      orderBy: { version: 'desc' },
      select: { id: true } satisfies Prisma.AgendaVersionSelect,
      where: { agendaId: query.agendaId, status: 'VALIDATED' },
    });

    return version?.id ?? null;
  }

  /**
   * the version every edition writes into: the draft when one is open, the validated version
   * otherwise, which the first edition then forks a draft from.
   */
  @Transactional()
  async latest(query: { agendaId: string }): Promise<string> {
    const version = await this.db.tx.agendaVersion.findFirst({
      orderBy: { version: 'desc' },
      select: { id: true } satisfies Prisma.AgendaVersionSelect,
      where: { agendaId: query.agendaId },
    });

    if (!version) throw new NotFoundException();

    return version.id;
  }
}
