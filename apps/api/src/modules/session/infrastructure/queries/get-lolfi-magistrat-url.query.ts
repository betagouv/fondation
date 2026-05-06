import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { findMagistratExternalIdByFullName } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { buildMagistratLolfiUrl } from 'src/utils/build-magistrat-lolfi-url';
import { unaccent } from 'src/utils/unaccent';

@Injectable()
export class GetLolfiMagistratUrlQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: { sessionId: string; nominationFileId: string }): Promise<LolfiMagistratUrlDto> {
    const id = await this.prisma.$transaction(async (tx) => {
      const nominationFile = await tx.dossierDeNomination.findUnique({
        where: { id: query.nominationFileId, sessionId: query.sessionId },
        select: {
          name: true,
          detectedMagistrat: { select: { externalId: true } },
        },
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

      const [{ externalId } = {}] = await tx.$queryRawTyped(findMagistratExternalIdByFullName(search));

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
