import { Injectable } from '@nestjs/common';

import { PrioriteEnum, TypeDeSaisine } from 'shared-models';
import { Paginated, Pagination } from 'src/modules/framework/pagination';

import { AutoAffectationsFinder } from './finders/auto-affectations.finder';
import { type FoundAffectationVersion } from './finders/affectation-version.finder';
import { DetailNominationSessionAffectationVersionQuery } from './queries/detail-nomination-session-affectation-version.query';
import { DetailSessionQuery } from './queries/detail-session.query';
import {
  ListNominationFilesQuery,
  type NominationFileAffectationItem,
} from './queries/list-nomination-files.query';
import { ListSessionOfTypeGardeDesSceauxQuery } from './queries/list-sessions-of-type-garde-des-sceaux.query';
import { NominationSessionRepository } from './repositories/nomination-session.repository';

@Injectable()
export class SessionService {
  constructor(
    private readonly autoAffectationsFinder: AutoAffectationsFinder,
    private readonly detailNominationSessionAffectationVersionQuery: DetailNominationSessionAffectationVersionQuery,
    private readonly detailSessionQuery: DetailSessionQuery,
    private readonly listNominationFilesQuery: ListNominationFilesQuery,
    private readonly listSessionsOfTypeGardeDesSceauxQuery: ListSessionOfTypeGardeDesSceauxQuery,
    private readonly nominationSessionRepository: NominationSessionRepository,
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

  async autoAffectation(command: {
    sessionId: string;
    nominationFileIds: readonly string[];
  }): Promise<void> {
    const session = await this.nominationSessionRepository.find(
      command.sessionId,
    );
    const autoAffectations = await this.autoAffectationsFinder.find({
      sessionId: command.sessionId,
      nominationFileIds: command.nominationFileIds,
    });

    session.autoAffectNominationFileReporters(autoAffectations);

    await this.nominationSessionRepository.persist(session);
  }
}
