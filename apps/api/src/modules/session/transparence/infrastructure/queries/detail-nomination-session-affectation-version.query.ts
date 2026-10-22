import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { AffectationVersionFinder, FoundAffectationVersion } from '../finders/affectation-version.finder';

@Injectable()
export class DetailNominationSessionAffectationVersionQuery {
  constructor(private readonly versionFinder: AffectationVersionFinder) {}

  @Transactional()
  async handle(query: { sessionId: string }): Promise<FoundAffectationVersion> {
    const version = await this.versionFinder.last({ sessionId: query.sessionId });

    return version.get();
  }
}
