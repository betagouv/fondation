import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { Prisma } from '../../../../../generated/prisma/client';
import { findMagistratExternalIdByFullName } from '../../../../../generated/prisma/sql';
import { buildMagistratLolfiUrl } from '../../../../../utils/build-magistrat-lolfi-url';
import { unaccent } from '../../../../../utils/unaccent';
import { Db } from '../../../../framework/database';
import type { RoleEnum } from '../../../../shared/role.enum';
import { NominationSessionFinder } from '../finders/transparence-session.finder';

@Injectable()
export class GetLolfiMagistratUrlQuery {
  constructor(
    private readonly db: Db,
    private readonly sessions: NominationSessionFinder,
  ) {}

  async handle(query: {
    nominationFileId: string;
    role: RoleEnum;
    sessionId: string;
  }): Promise<LolfiMagistratUrlDto> {
    const id = await this.db.withTransaction(async () => {
      await this.sessions.getVisible(query);
      const nominationFile = await this.db.tx.dossierDeNomination.findUnique({
        where: { id: query.nominationFileId, sessionId: query.sessionId },
        select: {
          name: true,
          detectedMagistrat: { select: { externalId: true } },
        } satisfies Prisma.DossierDeNominationSelect,
      });

      if (!nominationFile) return null;

      if (nominationFile.detectedMagistrat?.externalId) {
        return nominationFile.detectedMagistrat.externalId;
      }

      const search = unaccent(
        nominationFile.name
          .toLowerCase()
          .replace(/\s*\(vivier: .+\)\s*$/, '')
          .trim(),
      );

      const [{ externalId } = {}] = await this.db.tx.$queryRawTyped(
        findMagistratExternalIdByFullName(search),
      );

      return externalId;
    });

    if (!id) throw new NotFoundException();

    const url = buildMagistratLolfiUrl(id);
    return { url };
  }
}

export class LolfiMagistratUrlDto extends createZodDto(
  z.object({
    url: z.url(),
  }),
) {}
