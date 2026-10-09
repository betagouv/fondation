import { Propagation, Transactional } from '@nestjs-cls/transactional';
import { ForbiddenException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  ObservantAudition,
  ObservantAuditionScheduled,
  ObservantAuditionUnscheduled,
} from '../../domain/observant-audition';
import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { TransparenceService } from 'src/modules/session/transparence/infrastructure/transparence.service';
import { assertNever } from 'src/utils/assert-never';
import { timeOnlyToDate } from 'src/utils/time-only';

@Injectable()
export class ObservantAuditionRepository {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,

    @Inject(forwardRef(() => TransparenceService))
    private readonly transparences: TransparenceService,
  ) {}

  async findByObservation(predicate: {
    nominationFileId: string;
    observationId: string;
    sessionId: string;
  }): Promise<ObservantAudition> {
    const observation = await this.db.tx.observation.findUnique({
      select: { magistratId: true } satisfies Prisma.ObservationSelect,
      where: {
        id: predicate.observationId,
        sessionId: predicate.sessionId,
        nominationFileId: predicate.nominationFileId,
      },
    });
    if (!observation) throw new NotFoundException();

    const state = await this.transparences.internalFindSessionState({ sessionId: predicate.sessionId });
    if (state !== 'OPEN') throw new ForbiddenException();

    const observedFiles = await this.db.tx.observation.findMany({
      select: { nominationFileId: true } satisfies Prisma.ObservationSelect,
      where: { magistratId: observation.magistratId, sessionId: predicate.sessionId },
    });

    return ObservantAudition.from({
      magistratId: observation.magistratId,
      observedNominationFiles: await this.transparences.internalFindAuditionStates({
        nominationFileIds: observedFiles.map(({ nominationFileId }) => nominationFileId),
        sessionId: predicate.sessionId,
      }),
      sessionId: predicate.sessionId,
    });
  }

  @Transactional(Propagation.Mandatory)
  async persist(audition: ObservantAudition): Promise<void> {
    for (const message of audition.messages) {
      if (message instanceof ObservantAuditionScheduled)
        await this.persistObservantAuditionScheduled(message);
      else if (message instanceof ObservantAuditionUnscheduled)
        await this.persistObservantAuditionUnscheduled(message);
      else assertNever(message);
    }
  }

  private async persistObservantAuditionScheduled(message: ObservantAuditionScheduled) {
    const data = {
      date: message.auditionDateTime.date.toDate(),
      time: timeOnlyToDate(message.auditionDateTime.time),
    };

    await this.db.tx.observantAudition.upsert({
      create: { ...data, magistratId: message.magistratId, sessionId: message.sessionId },
      update: data,
      where: { primaryKey: { magistratId: message.magistratId, sessionId: message.sessionId } },
    });
    await this.persistObservantAuditionVersion(message, data);
  }

  private async persistObservantAuditionUnscheduled(message: ObservantAuditionUnscheduled) {
    const { count } = await this.db.tx.observantAudition.deleteMany({
      where: { magistratId: message.magistratId, sessionId: message.sessionId },
    });
    if (count === 0) return;

    await this.persistObservantAuditionVersion(message, { date: null, time: null });
  }

  private persistObservantAuditionVersion(
    message: { impersonatorId: string | null; magistratId: string; sessionId: string; userId: string },
    audition: { date: Date | null; time: Date | null },
  ) {
    return this.db.tx.observantAuditionVersion.create({
      data: {
        ...audition,
        impersonatorId: message.impersonatorId,
        magistratId: message.magistratId,
        sessionId: message.sessionId,
        writtenAt: this.clock.now(),
        writtenBy: message.userId,
      },
    });
  }
}
