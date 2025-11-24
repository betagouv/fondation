import { Injectable } from '@nestjs/common';

import { ListSessionOfTypeGardeDesSceauxQuery } from './queries/list-sessions-of-type-garde-des-sceaux.query';
import { DetailSessionQuery } from './queries/detail-session.query';
import { PrioriteEnum, TypeDeSaisine } from 'shared-models';
import { DetailNominationSessionAffectationVersionQuery } from './queries/detail-nomination-session-affectation-version.query';
import {
  ListNominationFilesQuery,
  NominationFileAffectationItem,
} from './queries/list-nomination-files.query';
import { NominationSessionRepository } from './repositories/nomination-session.repository';
import { Paginated, Pagination } from 'src/modules/framework/pagination';
import { FoundAffectationVersion } from './finders/affectation-version.finder';

@Injectable()
export class SessionService {
  constructor(
    private readonly listSessionsOfTypeGardeDesSceauxQuery: ListSessionOfTypeGardeDesSceauxQuery,
    private readonly detailSessionQuery: DetailSessionQuery,
    private readonly nominationSessionRepository: NominationSessionRepository,
    private readonly listNominationFilesQuery: ListNominationFilesQuery,
    private readonly detailNominationSessionAffectationVersionQuery: DetailNominationSessionAffectationVersionQuery,
  ) {}

  listSessionsOfTypeGardeDesSceaux(userId: string) {
    return this.listSessionsOfTypeGardeDesSceauxQuery.handle({ userId });
  }

  detailSession(query: {
    userId: string;
    sessionId: string;
    typeDeSaisine: TypeDeSaisine;
  }) {
    return this.detailSessionQuery.handle(query);
  }

  async affectReportersAndPriorities(command: {
    sessionId: string;
    affectations: readonly {
      nominationFileId: string;
      priority: PrioriteEnum | null;
      reporterIds: readonly string[];
    }[];
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
      {
        memberIds: Array.from(
          new Set(
            command.affectations.flatMap(
              (affectation) => affectation.reporterIds,
            ),
          ),
        ),
      },
    );

    session.affectNominationFileReporters(command.affectations);

    for (const item of command.affectations) {
      session.setNominationFilePriority({
        nominationFileId: item.nominationFileId,
        priority: item.priority,
      });
    }

    await this.nominationSessionRepository.persist(session);
  }

  listNominationFiles(query: {
    sessionId: string;
    pagination: Pagination;
    filters: {
      reporterIds: readonly string[];
      priorities: readonly PrioriteEnum[];
    };
  }): Promise<Paginated<NominationFileAffectationItem>> {
    return this.listNominationFilesQuery.handle(query);
  }

  detailNominationSessionAffectationsVersion(query: {
    sessionId: string;
  }): Promise<FoundAffectationVersion> {
    return this.detailNominationSessionAffectationVersionQuery.handle(query);
  }

  async publishNominationSessionAffectationsVersion(command: {
    sessionId: string;
    userId: string;
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
    );
    session.publishAffectationVersion({ userId: command.userId });
    await this.nominationSessionRepository.persist(session);
  }
}
