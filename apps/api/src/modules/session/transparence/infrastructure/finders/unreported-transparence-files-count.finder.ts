import { Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { countUnreportedNominationFiles } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';

import { AffectationVersionFinder } from './affectation-version.finder';

@Injectable()
export class UnreportedSessionFilesCountFinder {
  constructor(
    private readonly prisma: PrismaService,
    private readonly version: AffectationVersionFinder,
  ) {}

  async find(props: { sessionId: string; tx?: Prisma.TransactionClient }): Promise<number> {
    if (!props.tx) return this.prisma.$transaction((tx) => this.find({ ...props, tx }));

    /** @warning: we need the last published version */
    const version = await this.version.lastPublished({ tx: props.tx, sessionId: props.sessionId });
    const [{ count } = {}] = await props.tx.$queryRawTyped(
      countUnreportedNominationFiles(props.sessionId, version.optionalId ?? null),
    );

    return count ?? 0;
  }
}
