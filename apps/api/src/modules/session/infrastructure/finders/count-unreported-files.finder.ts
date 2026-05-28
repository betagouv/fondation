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

    const { tx, sessionId } = props;
    const version = await this.version.lastPublished({ sessionId, tx });
    const [row] = await tx.$queryRawTyped(countUnreportedNominationFiles(sessionId, version.id));

    return row?.count ?? 0;
  }
}
