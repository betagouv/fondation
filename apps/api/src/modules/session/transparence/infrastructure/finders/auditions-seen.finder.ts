import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { ObservationService } from 'src/modules/observation/observation.service';
import { isAuditionRequired } from 'src/modules/shared/policies/auditioned-position.policy';
import { isSecretariat, type RoleEnum } from 'src/modules/shared/role.enum';
import { type AuditionSchedule, toOptionalAuditionSchedule } from 'src/utils/audition-schedule';
import type { DateOnlyJson } from 'src/utils/date-only';
import type { TimeOnly } from 'src/utils/time-only';

import { AuditionPublicationFinder } from './audition-publication.finder';

export type SeenAudition = {
  auditionDate: DateOnlyJson | null;
  auditionRequired: boolean;
  auditionTime: TimeOnly | null;
};

// the secretariat works on the current auditions, the members only see the last published ones, apart from
// the audition a position requires which reaches them right away
@Injectable()
export class AuditionsSeenFinder {
  constructor(
    private readonly db: Db,
    private readonly publications: AuditionPublicationFinder,

    @Inject(forwardRef(() => ObservationService))
    private readonly observations: ObservationService,
  ) {}

  async findNominationFile(query: { nominationFileId: string; role: RoleEnum }): Promise<SeenAudition> {
    const auditions = await this.findNominationFiles({
      nominationFileIds: [query.nominationFileId],
      role: query.role,
    });
    const seen = auditions.get(query.nominationFileId);
    if (!seen) throw new NotFoundException();

    return seen;
  }

  async findNominationFiles(query: {
    nominationFileIds: readonly string[];
    role: RoleEnum;
  }): Promise<Map<string, SeenAudition>> {
    const files = await this.db.tx.dossierDeNomination.findMany({
      select: {
        auditionDate: true,
        auditionRequested: true,
        auditionTime: true,
        detectedJurisdiction: { select: { typeJur: true } },
        detectedJurisdictionId: true,
        detectedTargetedFunctionId: true,
        id: true,
        sessionId: true,
        targetedPosition: true,
      } satisfies Prisma.DossierDeNominationSelect,
      where: { id: { in: [...query.nominationFileIds] } },
    });
    const publications = isSecretariat(query.role)
      ? null
      : await this.publications.lastBySession({
          sessionIds: [...new Set(files.map(({ sessionId }) => sessionId))],
        });

    return new Map(
      files.map((file) => {
        const published = publications?.get(file.sessionId)?.auditions.nominationFiles.get(file.id);
        const { audition, requested } = publications
          ? { audition: published?.audition ?? null, requested: published?.requested ?? null }
          : {
              audition: toOptionalAuditionSchedule(file.auditionDate, file.auditionTime),
              requested: file.auditionRequested,
            };

        return [
          file.id,
          {
            auditionDate: audition?.date ?? null,
            auditionRequired: isAuditionRequired({
              ...file,
              auditionRequested: requested,
              detectedJurisdictionType: file.detectedJurisdiction?.typeJur ?? null,
            }),
            auditionTime: audition?.time ?? null,
          },
        ];
      }),
    );
  }

  async findObservants(query: {
    magistratIds?: readonly string[];
    role: RoleEnum;
    sessionId: string;
  }): Promise<Map<string, AuditionSchedule>> {
    if (isSecretariat(query.role)) return this.observations.internalFindObservantAuditions(query);

    const publication = await this.publications.last(query);
    const observants = [...(publication?.auditions.observants ?? [])];
    if (!query.magistratIds) return new Map(observants);

    const magistratIds = new Set(query.magistratIds);
    return new Map(observants.filter(([magistratId]) => magistratIds.has(magistratId)));
  }
}
