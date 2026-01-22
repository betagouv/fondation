import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/framework/database';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

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
      if (!txVersion) return null;

      return this.prisma.affectationVersion.findUnique({
        where: { id: txVersion.id },
        select: {
          affectations: {
            orderBy: { user: { lastName: 'asc' } },
            select: {
              user: {
                select: { id: true, firstName: true, lastName: true },
              },
            },
          },
        },
      });
    });

    return {
      items: (version?.affectations ?? []).map(({ user }) => ({
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
