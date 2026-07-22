import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/modules/framework/database';

import { AffectationVersionFinder } from './affectation-version.finder';

@Injectable()
export class UnaffectedFilesFinder {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versions: AffectationVersionFinder,
  ) {}

  async find(predicate: {
    tx?: Prisma.TransactionClient;
    sessionId: string;
    nominationFileIds: readonly string[] | undefined;
  }): Promise<FoundUnaffectedFilesDto> {
    if (!predicate.tx) {
      return this.prisma.$transaction((tx) => this.find({ ...predicate, tx }));
    }

    const version = await this.versions.last({
      sessionId: predicate.sessionId,
      tx: predicate.tx,
    });

    const items = await predicate.tx.dossierDeNomination.findMany({
      select: {
        id: true,
        targetedPosition: true,
        targetedGrade: true,
        number: true,
        currentPosition: true,
      },
      where: {
        outcome: null,
        sessionId: predicate.sessionId,
        id: { in: predicate.nominationFileIds as string[] | undefined },
        reporterIds: {
          none: { versionId: version.optionalId },
        },
      },
    });

    return { items };
  }
}

export class FoundUnaffectedFilesDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({
        id: z.string(),
        number: z.number().nullable(),
        currentPosition: z.string().nullable(),
        targetedPosition: z.string().nullable(),
        targetedGrade: z.string().nullable(),
      }),
    ),
  }),
) {}
