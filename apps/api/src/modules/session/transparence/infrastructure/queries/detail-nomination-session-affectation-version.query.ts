import { Injectable, NotFoundException } from '@nestjs/common';

import { AffectationVersionFinder, FoundAffectationVersion } from '../finders/affectation-version.finder';
import { PrismaService } from 'src/modules/framework/database';

@Injectable()
export class DetailNominationSessionAffectationVersionQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionFinder: AffectationVersionFinder,
  ) {}

  async handle(query: { sessionId: string; version?: 'PUBLIEE' }): Promise<FoundAffectationVersion> {
    const version = await this.prisma.$transaction((tx) =>
      query.version === 'PUBLIEE'
        ? this.versionFinder.lastPublished({ sessionId: query.sessionId, tx })
        : this.versionFinder.last({ sessionId: query.sessionId, tx }),
    );

    if (!version) throw new NotFoundException();

    return version.get();
  }
}
