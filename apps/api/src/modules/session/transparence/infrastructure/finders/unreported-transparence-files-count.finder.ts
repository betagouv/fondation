import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { countUnreportedNominationFiles } from 'src/generated/prisma/sql';
import { Db } from 'src/modules/framework/database';

import { AffectationVersionFinder } from './affectation-version.finder';

@Injectable()
export class UnreportedSessionFilesCountFinder {
  constructor(
    private readonly db: Db,
    private readonly version: AffectationVersionFinder,
  ) {}

  @Transactional()
  async find(props: { sessionId: string }): Promise<number> {
    /** @warning: we need the last published version */
    const version = await this.version.lastPublished({ sessionId: props.sessionId });
    const [{ count } = {}] = await this.db.tx.$queryRawTyped(
      countUnreportedNominationFiles(props.sessionId, version.optionalId ?? null),
    );

    return count ?? 0;
  }
}
