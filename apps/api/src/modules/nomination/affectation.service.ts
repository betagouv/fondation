import { Injectable } from '@nestjs/common';
import { Affectations } from 'src/modules/nomination/domain/affectation';
import { AffectationRepository } from 'src/modules/nomination/infrastructure/affectation.repository';
import { ListAutoAffectationQuery } from 'src/modules/nomination/infrastructure/queries/list-auto-affectation.query';

@Injectable()
export class AffectationService {
  constructor(
    private readonly listAutoAffectationQuery: ListAutoAffectationQuery,
    private readonly affectationRepository: AffectationRepository,
  ) {}

  async autoAffectation(
    sessionId: string,
    nominationFileIds: readonly string[],
  ) {
    const { members, candidates } =
      await this.listAutoAffectationQuery.findByNominationFileIds(
        sessionId,
        nominationFileIds,
      );

    this.affectationRepository.persist(
      sessionId,
      new Affectations(candidates, members),
    );
  }
}
