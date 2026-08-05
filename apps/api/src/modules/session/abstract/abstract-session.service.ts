import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { TypeDeSaisineEnum } from 'src/modules/shared/type-de-saisine.enum';

import { ListGdsNominationSessionsQueryDto } from './abstract-session.dto';
import { ListedNominationSessionsDto, ListSessionsQuery } from './infrastructure/queries/list-sessions.query';

@Injectable()
export class AbstractSessionService {
  constructor(
    private readonly listSessionsQuery: ListSessionsQuery,

    private readonly prisma: PrismaService,
    private readonly files: Files,
  ) {}

  listSessionsOfTypeGardeDesSceaux(query: {
    search: string | null;
    pagination: Pagination;
    typeDeSaisine: TypeDeSaisineEnum;
    formations: readonly FormationEnum[] | undefined;
    sorting: Sortable<ListGdsNominationSessionsQueryDto>;
  }): Promise<ListedNominationSessionsDto> {
    return this.listSessionsQuery.handle(query);
  }

  async attachFiles(command: { sessionId: string; files: readonly { id: string }[] }): Promise<void> {
    await this.prisma.sessionAttachment.createMany({
      data: command.files.map(({ id }) => ({ fileId: id, sessionId: command.sessionId })),
    });
  }

  async detachFile(command: { sessionId: string; fileId: string }): Promise<void> {
    const fileToDelete = await this.prisma.$transaction(async (tx) => {
      const attachment = await tx.sessionAttachment.findUnique({
        where: { sessionId_fileId: command },
        select: { file: { select: { id: true, path: true } } },
      });

      if (!attachment) return null;

      await tx.sessionAttachment.delete({ where: { sessionId_fileId: command } });
      return attachment?.file ?? null;
    });

    if (fileToDelete) this.files.delete([fileToDelete]);
  }
}
