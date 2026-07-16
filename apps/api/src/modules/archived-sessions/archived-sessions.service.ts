import { Injectable } from '@nestjs/common';

import { ListGdsNominationSessionsQueryDto } from '../session/infrastructure/dtos/nomination-session.dto';
import { Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { TypeDeSaisineEnum } from 'src/modules/shared/type-de-saisine.enum';

import {
  ListArchivedNominationSessionsQuery,
  ListedArchivedNominationSessionsDto,
} from './infrastructure/queries/list-archived-nomination-sessions.query';

@Injectable()
export class ArchivedSessionsService {
  constructor(private readonly listArchivedSessions: ListArchivedNominationSessionsQuery) {}

  list(query: {
    search: string | null;
    typeDeSaisine: TypeDeSaisineEnum;
    formations: readonly FormationEnum[] | undefined;
    sorting: Sortable<ListGdsNominationSessionsQueryDto>;
    pagination: Pagination;
  }): Promise<ListedArchivedNominationSessionsDto> {
    return this.listArchivedSessions.handle(query);
  }
}
