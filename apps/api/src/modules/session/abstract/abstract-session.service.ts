import { Injectable } from '@nestjs/common';

import { Pagination } from 'src/modules/framework/pagination';
import { Sortable } from 'src/modules/framework/sorting';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { TypeDeSaisineEnum } from 'src/modules/shared/type-de-saisine.enum';

import { ListGdsNominationSessionsQueryDto } from './abstract-session.dto';
import {
  CountNonValidatedSessionsQuery,
  CountUsersNewSessionsDto,
} from './infrastructure/queries/count-non-validated-sessions.query';
import { ListedNominationSessionsDto, ListSessionsQuery } from './infrastructure/queries/list-sessions.query';

@Injectable()
export class AbstractSessionService {
  constructor(
    private readonly listSessionsQuery: ListSessionsQuery,
    private readonly countNonValidatedSessionsQuery: CountNonValidatedSessionsQuery,
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

  countNonValidatedSessions(): Promise<CountUsersNewSessionsDto> {
    return this.countNonValidatedSessionsQuery.handle();
  }
}
