import { Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';

import { AffectationVersionFinder } from './affectation-version.finder';

@Injectable()
export class NominationFileReportersFinder {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionFinder: AffectationVersionFinder,
  ) {}

  async findReporterIds(query: {
    nominationFileId: string;
    sessionId: string;
    tx?: Prisma.TransactionClient;
  }): Promise<string[]> {
    const prismaClient = query.tx || this.prisma;

    const version = await this.versionFinder.last({
      sessionId: query.sessionId,
      tx: prismaClient as Prisma.TransactionClient,
    });

    if (!version) return [];

    const reporters = await prismaClient.nominationFileToReporter.findMany({
      where: {
        nominationFileId: query.nominationFileId,
        versionId: version.id,
      },
      select: { userId: true },
    });

    return reporters.map((r: { userId: string }) => r.userId);
  }

  async isUserReporter(query: {
    userId: string;
    nominationFileId: string;
    sessionId: string;
    tx?: Prisma.TransactionClient;
  }): Promise<boolean> {
    const reporterIds = await this.findReporterIds({
      nominationFileId: query.nominationFileId,
      sessionId: query.sessionId,
      tx: query.tx,
    });

    return reporterIds.includes(query.userId);
  }
}
