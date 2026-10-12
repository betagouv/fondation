import { Transactional } from '@nestjs-cls/transactional';
import { Injectable, NotFoundException } from '@nestjs/common';

import { AffectationVersionFinder, FoundAffectationVersion } from '../finders/affectation-version.finder';

@Injectable()
export class DetailNominationSessionAffectationVersionQuery {
  constructor(private readonly versionFinder: AffectationVersionFinder) {}

  @Transactional()
  async handle(query: { sessionId: string; version?: 'PUBLIEE' }): Promise<FoundAffectationVersion> {
    const version =
      query.version === 'PUBLIEE'
        ? await this.versionFinder.lastPublished({ sessionId: query.sessionId })
        : await this.versionFinder.last({ sessionId: query.sessionId });

    if (!version) throw new NotFoundException();

    return version.get();
  }
}
