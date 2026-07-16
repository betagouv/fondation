import { Injectable } from '@nestjs/common';

import { TypeDeSaisine } from 'shared-models';

import { ListGdsNominationSessionsQueryDto } from '../session/infrastructure/dtos/nomination-session.dto';
import { Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { FormationEnum } from 'src/modules/shared/formation.enum';

import {
  ListArchivedNominationSessionsQuery,
  ListedArchivedNominationSessionsDto,
} from './infrastructure/queries/list-archived-nomination-sessions.query';

@Injectable()
export class ArchivedSessionsService {
  constructor(private readonly listArchivedSessions: ListArchivedNominationSessionsQuery) {}

  list(query: {
    search: string | null;
    typeDeSaisine: TypeDeSaisine;
    formations: readonly FormationEnum[] | undefined;
    sorting: Sortable<ListGdsNominationSessionsQueryDto>;
    pagination: Pagination;
  }): Promise<ListedArchivedNominationSessionsDto> {
    return this.listArchivedSessions.handle(query);
  }
}
