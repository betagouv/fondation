import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { PrismaService } from 'src/modules/framework/database';
import z from 'zod';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';

@Injectable()
export class ListCurrentlyAffectedReportersQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versions: AffectationVersionFinder,
  ) {}

  async handle(query: { sessionId: string }) {
    const { sessionId } = query;
    const version = await this.prisma.$transaction(async (tx) => {
      const txVersion = await this.versions.last({ sessionId, tx });

      if (txVersion.isNone()) return null;
      return tx.nominationFileToReporter.findMany({
        distinct: ['userId'],
        orderBy: [
          { user: { lastName: 'asc' } },
          { user: { firstName: 'asc' } },
        ],
        where: { versionId: txVersion.id },
        select: {
          user: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });

    return {
      items: (version ?? []).map(({ user }) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
      })),
    };
  }
}

export class ListedCurrentlyAffectedReportersDto extends createZodDto(
  z.object({
    items: z.array(
      z.object({ id: z.string(), firstName: z.string(), lastName: z.string() }),
    ),
  }),
) {}
