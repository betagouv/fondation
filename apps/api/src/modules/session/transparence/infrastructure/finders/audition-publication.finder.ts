import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { PublishableAuditions } from '../../domain/audition-publication';
import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { ObservationService } from 'src/modules/observation/observation.service';
import { toAuditionSchedule, toOptionalAuditionSchedule } from 'src/utils/audition-schedule';

export type AuditionPublication = {
  auditions: PublishableAuditions;
  publishedAt: Date;
  publisher: { firstName: string; id: string; lastName: string } | null;
};

@Injectable()
export class AuditionPublicationFinder {
  constructor(
    private readonly db: Db,

    @Inject(forwardRef(() => ObservationService))
    private readonly observations: ObservationService,
  ) {}

  // the files the secretariat never acted on follow their position, which the members see right away
  async current(query: { sessionId: string }): Promise<PublishableAuditions> {
    const files = await this.db.tx.dossierDeNomination.findMany({
      select: {
        auditionDate: true,
        auditionRequested: true,
        auditionTime: true,
        id: true,
      } satisfies Prisma.DossierDeNominationSelect,
      where: {
        OR: [{ auditionDate: { not: null } }, { auditionRequested: { not: null } }],
        sessionId: query.sessionId,
      },
    });

    return PublishableAuditions.from({
      nominationFiles: new Map(
        files.map((file) => [
          file.id,
          {
            audition: toOptionalAuditionSchedule(file.auditionDate, file.auditionTime),
            requested: file.auditionRequested,
          },
        ]),
      ),
      observants: await this.observations.internalFindObservantAuditions(query),
    });
  }

  async last(query: { sessionId: string }): Promise<AuditionPublication | null> {
    const publications = await this.lastBySession({ sessionIds: [query.sessionId] });
    return publications.get(query.sessionId) ?? null;
  }

  async lastBySession(query: { sessionIds: readonly string[] }): Promise<Map<string, AuditionPublication>> {
    // distinct runs in memory: picking the ids first keeps the older publications' rows out of the read
    const lasts = await this.db.tx.auditionPublication.findMany({
      distinct: ['sessionId'],
      orderBy: [{ sessionId: 'asc' }, { publishedAt: 'desc' }],
      select: { id: true } satisfies Prisma.AuditionPublicationSelect,
      where: { sessionId: { in: [...query.sessionIds] } },
    });
    const publications = await this.db.tx.auditionPublication.findMany({
      select: {
        nominationFileAuditions: {
          select: { date: true, nominationFileId: true, requested: true, time: true },
        },
        observantAuditions: { select: { date: true, magistratId: true, time: true } },
        publishedAt: true,
        publisher: { select: { firstName: true, id: true, lastName: true } },
        sessionId: true,
      } satisfies Prisma.AuditionPublicationSelect,
      where: { id: { in: lasts.map(({ id }) => id) } },
    });

    return new Map(
      publications.map((publication) => [
        publication.sessionId,
        {
          auditions: PublishableAuditions.from({
            nominationFiles: new Map(
              publication.nominationFileAuditions.map(({ date, nominationFileId, requested, time }) => [
                nominationFileId,
                { audition: toOptionalAuditionSchedule(date, time), requested },
              ]),
            ),
            observants: new Map(
              publication.observantAuditions.map(({ date, magistratId, time }) => [
                magistratId,
                toAuditionSchedule(date, time),
              ]),
            ),
          }),
          publishedAt: publication.publishedAt,
          publisher: publication.publisher,
        },
      ]),
    );
  }
}
