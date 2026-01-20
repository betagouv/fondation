import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import { findMagistratExternalIdByFullName } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
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

      const search = nominationFile.name
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

      const [{ externalId } = {}] = await tx.$queryRawTyped(
        findMagistratExternalIdByFullName(search),
      );

      return externalId;
    });

    if (!id) throw new NotFoundException();

    const url = new URL(
      `http://lolfi.dsj.intranet.justice.gouv.fr/lolf/lolf_fic_fonc.asp?affiche=fic`,
    );
    url.searchParams.set('num_fonc', id);

    return { url: url.toString() };
  }
}

export class LolfiMagistratUrlDto extends createZodDto(
  z.object({
    url: z.url(),
  }),
) {}
