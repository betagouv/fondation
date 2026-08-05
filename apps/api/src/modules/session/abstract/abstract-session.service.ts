import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, Logger } from '@nestjs/common';

import { Db } from 'src/modules/framework/database';
import { Files } from 'src/modules/framework/files';
import { Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { TypeDeSaisineEnum } from 'src/modules/shared/type-de-saisine.enum';

import { ListGdsNominationSessionsQueryDto } from './abstract-session.dto';
import { ListedNominationSessionsDto, ListSessionsQuery } from './infrastructure/queries/list-sessions.query';

@Injectable()
export class AbstractSessionService {
  private readonly logger = new Logger(AbstractSessionService.name);

  constructor(
    private readonly listSessionsQuery: ListSessionsQuery,

    private readonly db: Db,
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

  @Transactional()
  async attachFiles(command: { sessionId: string; files: readonly { id: string }[] }): Promise<void> {
    await this.db.tx.sessionAttachment.createMany({
      data: command.files.map(({ id }) => ({ fileId: id, sessionId: command.sessionId })),
    });
  }

  @Transactional()
  async detachFile(command: { sessionId: string; fileId: string }): Promise<void> {
    const attachment = await this.db.tx.sessionAttachment
      .delete({
        where: { sessionId_fileId: command },
        select: { file: { select: { id: true, path: true } } },
      })
      .catch((error) => {
        this.logger.warn(error);

        return null;
      });

    if (attachment?.file?.id) this.files.delete([attachment.file]);
  }
}
