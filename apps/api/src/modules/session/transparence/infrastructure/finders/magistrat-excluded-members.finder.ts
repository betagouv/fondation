import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from '../../../../../generated/prisma/client';
import { assertPgParams } from '../../../../../utils/assert-pg-params';
import { isDefined } from '../../../../../utils/is-defined';
import { Db } from '../../../../framework/database';
import { MembersService } from '../../../../members';

/**
 * the members who excluded the proposed magistrat of each file; observants and the other
 * candidates do not count, and a file whose magistrat is not identified excludes nobody
 */
@Injectable()
export class MagistratExcludedMembersFinder {
  constructor(
    private readonly db: Db,
    private readonly members: MembersService,
  ) {}

  @Transactional()
  async findIds(query: {
    nominationFileIds: ReadonlySet<string>;
  }): Promise<Map<string, ReadonlySet<string>>> {
    if (query.nominationFileIds.size === 0) return new Map();
    assertPgParams(query.nominationFileIds);

    const files = await this.db.tx.dossierDeNomination.findMany({
      select: { detectedMagistratId: true, id: true } satisfies Prisma.DossierDeNominationSelect,
      where: { detectedMagistratId: { not: null }, id: { in: [...query.nominationFileIds] } },
    });
    const memberIdsByMagistratId = await this.members.internalFindExcludedMagistrats({
      magistratIds: new Set(files.map(({ detectedMagistratId }) => detectedMagistratId).filter(isDefined)),
    });

    const memberIdsByFileId = new Map<string, ReadonlySet<string>>();
    for (const { detectedMagistratId, id } of files) {
      const memberIds = detectedMagistratId && memberIdsByMagistratId.get(detectedMagistratId);
      if (memberIds) memberIdsByFileId.set(id, memberIds);
    }
    return memberIdsByFileId;
  }
}
