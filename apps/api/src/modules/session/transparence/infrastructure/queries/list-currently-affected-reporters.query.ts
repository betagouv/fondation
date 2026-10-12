import { Injectable } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { AffectationVersionFinder } from '../finders/affectation-version.finder';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { isSecretariat, type RoleEnum } from 'src/modules/shared/role.enum';

@Injectable()
export class ListCurrentlyAffectedReportersQuery {
  constructor(
    private readonly db: Db,
    private readonly versions: AffectationVersionFinder,
  ) {}

  // the members only know the published affectations
  async handle(query: { role: RoleEnum; sessionId: string }) {
    const { sessionId } = query;
    const version = await this.db.withTransaction(async () => {
      const txVersion = isSecretariat(query.role)
        ? await this.versions.last({ sessionId })
        : await this.versions.lastPublished({ sessionId });

      if (txVersion.isNone()) return null;
      return this.db.tx.nominationFileToReporter.findMany({
        distinct: ['userId'],
        orderBy: [{ user: { lastName: 'asc' } }, { user: { firstName: 'asc' } }],
        select: {
          user: { select: { firstName: true, id: true, lastName: true } },
        } satisfies Prisma.NominationFileToReporterSelect,
        where: { versionId: txVersion.id },
      });
    });

    return {
      items: (version ?? []).map(({ user }) => ({
        firstName: user.firstName,
        id: user.id,
        lastName: user.lastName,
      })),
    };
  }
}

export class ListedCurrentlyAffectedReportersDto extends createZodDto(
  z.object({
    items: z.array(z.object({ id: z.string(), firstName: z.string(), lastName: z.string() })),
  }),
) {}
