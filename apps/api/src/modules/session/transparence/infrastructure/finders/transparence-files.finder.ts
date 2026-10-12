import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { NominationFileSnapshot } from '../../domain/nomination-file-snapshot';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import {
  isAuditionExpected,
  isAuditionRequired,
} from 'src/modules/shared/policies/auditioned-position.policy';
import { assertPgParams } from 'src/utils/assert-pg-params';
import { isDefined } from 'src/utils/is-defined';

import { SessionReportedFilesFinder } from './session-reported-files.finder';

@Injectable()
export class TransparenceFilesFinder {
  constructor(
    private readonly db: Db,

    private readonly reportedFiles: SessionReportedFilesFinder,
  ) {}

  @Transactional()
  async bySessionAndFileNumber(query: {
    fileNumbers: readonly number[];
    sessionId: string;
  }): Promise<{ id: string; fileNumber: number }[]> {
    const files = await this.db.tx.dossierDeNomination.findMany({
      select: { id: true, number: true } satisfies Prisma.DossierDeNominationSelect,
      where: {
        number: { in: query.fileNumbers as number[] },
        sessionId: query.sessionId,
      },
    });

    return files
      .filter((x): x is { id: string; number: number } => isDefined(x.number))
      .map(({ id, number: fileNumber }) => ({ fileNumber, id }));
  }

  @Transactional()
  async findSnapshots(query: {
    nominationFileIds: Set<string> | undefined;
    sessionId: string;
  }): Promise<NominationFileSnapshot[]> {
    assertPgParams(query.nominationFileIds || []);

    const inIds =
      (query.nominationFileIds?.size ?? 0) > 0 ? { in: [...(query.nominationFileIds ?? [])] } : undefined;
    const snapshots = await this.db.tx.dossierDeNomination.findMany({
      select: {
        auditionRequested: true,
        detectedJurisdiction: { select: { typeJur: true } },
        detectedJurisdictionId: true,
        detectedTargetedFunctionId: true,
        id: true,
        outcome: true,
        targetedPosition: true,
      } satisfies Prisma.DossierDeNominationSelect,
      where: { id: inIds, sessionId: query.sessionId },
    });

    const reportedFileIds = await this.reportedFiles.find({
      nominationFileIds: new Set(snapshots.map(({ id }) => id)),
    });

    return snapshots.map((file) => {
      const position = { ...file, detectedJurisdictionType: file.detectedJurisdiction?.typeJur ?? null };
      return {
        auditionRequired: isAuditionRequired(position),
        id: file.id,
        isReported: reportedFileIds.has(file.id),
        outcome: file.outcome,
        positionRequiresAudition: isAuditionExpected(position),
      };
    });
  }
}
