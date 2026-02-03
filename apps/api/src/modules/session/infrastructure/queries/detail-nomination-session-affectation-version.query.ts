import { PrismaService } from 'src/modules/framework/database';
import {
  AffectationVersionFinder,
  FoundAffectationVersion,
} from '../finders/affectation-version.finder';
import { StatutAffectation } from 'src/modules/session/domain/statut-affectation.enum';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class DetailNominationSessionAffectationVersionQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly versionFinder: AffectationVersionFinder,
  ) {}

  async handle(query: {
    sessionId: string;
    version?: StatutAffectation.PUBLIEE;
  }): Promise<FoundAffectationVersion> {
    const version = await this.prisma.$transaction((tx) =>
      query.version === StatutAffectation.PUBLIEE
        ? this.versionFinder.lastPublished({ sessionId: query.sessionId, tx })
        : this.versionFinder.last({ sessionId: query.sessionId, tx }),
    );

    if (!version) throw new NotFoundException();

    return version.get();
  }
}
