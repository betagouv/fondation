import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { findNominationFileCommentChangesRawQuery } from '../../../../../generated/prisma/sql';
import { writerOf, type Writer } from '../../../../../utils/user.util';
import { Db } from '../../../../framework/database';

/** absent for a complement written before its saves were kept */
@Injectable()
export class NominationFileCommentChangesFinder {
  constructor(private readonly db: Db) {}

  @Transactional()
  async findLast(query: {
    nominationFileIds: readonly string[];
  }): Promise<Map<string, { at: string; by: Writer }>> {
    if (query.nominationFileIds.length === 0) return new Map();

    const rows = await this.db.tx.$queryRawTyped(
      findNominationFileCommentChangesRawQuery([...query.nominationFileIds]),
    );

    return new Map(
      rows.map((row) => [
        row.nominationFileId,
        {
          at: row.writtenAt.toISOString(),
          by: writerOf(
            row.authorId && row.authorFirstName !== null && row.authorLastName !== null
              ? { firstName: row.authorFirstName, id: row.authorId, lastName: row.authorLastName }
              : null,
          ),
        },
      ]),
    );
  }
}
