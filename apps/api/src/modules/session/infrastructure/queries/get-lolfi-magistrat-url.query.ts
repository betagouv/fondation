import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { findMagistratExternalIdByFullName } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import { buildMagistratLolfiUrl } from 'src/utils/build-magistrat-lolfi-url';
import { unaccent } from 'src/utils/unaccent';
import z from 'zod';

@Injectable()
export class GetLolfiMagistratUrlQuery {
  constructor(private readonly prisma: PrismaService) {}

  async handle(query: {
    sessionId: string;
    nominationFileId: string;
  }): Promise<LolfiMagistratUrlDto> {
    const id = await this.prisma.$transaction(async (tx) => {
      const session = await tx.session.findUnique({
        where: { id: query.sessionId },
        select: {
          dossierDeNominations: {
            where: { id: query.nominationFileId },
            take: 1,
            select: { name: true },
          },
        },
      });

      const [nominationFile] = session?.dossierDeNominations ?? [];
      if (!nominationFile) return null;

      const search = unaccent(nominationFile.name).toLowerCase();
      const [{ externalId } = {}] = await tx.$queryRawTyped(
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
