import assert from 'node:assert';

import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { Db } from 'src/modules/framework/database';
import { proposedMagistratName } from 'src/modules/magistrat/domain/magistrat-name';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { type NominationFileOutcomeEnum } from 'src/modules/shared/nomination-file-outcome.enum';
import { canScheduleAudition } from 'src/modules/shared/policies/nomination-file.policies';
import type { RoleEnum } from 'src/modules/shared/role.enum';
import { assertPgParams } from 'src/utils/assert-pg-params';
import { DateOnly, type DateOnlyJson } from 'src/utils/date-only';
import type { TimeOnly } from 'src/utils/time-only';

import { AffectationVersionFinder } from './affectation-version.finder';
import { AuditionsSeenFinder } from './auditions-seen.finder';
import { ReportedSessionsFinder } from './reported-sessions.finder';

export const SESSION_STATUSES = ['ONGOING', 'REPORTED', 'ARCHIVED'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export type HydratedNominationFile = {
  id: string;
  name: string;
  number: number | null;
  reporters: { id: string; firstName: string; lastName: string }[];
  session: {
    date: DateOnlyJson;
    formation: FormationEnum;
    id: string;
    name: string;
    status: SessionStatus;
  };
  auditionDate: DateOnlyJson | null;
  auditionRequired: boolean;
  auditionTime: TimeOnly | null;
  canScheduleAudition: boolean;
  outcome: { value: NominationFileOutcomeEnum; comment: string | null } | null;
  targetedGrade: string | null;
  targetedPosition: string | null;
};

export type FoundNominationFile = {
  detectedMagistratId: string | null;
  name: string;
  number: number | null;
  sessionId: string;
  targetedPosition: string | null;
};

@Injectable()
export class HydratedNominationFilesFinder {
  constructor(
    private readonly auditionsSeen: AuditionsSeenFinder,
    private readonly db: Db,
    private readonly reportedSessionsFinder: ReportedSessionsFinder,
    private readonly versions: AffectationVersionFinder,
  ) {}

  @Transactional()
  async byIds(query: { nominationFileIds: readonly string[] }): Promise<Map<string, FoundNominationFile>> {
    assertPgParams(query.nominationFileIds);

    const files = await this.db.tx.dossierDeNomination.findMany({
      select: {
        detectedMagistrat: { select: { firstName: true, lastName: true, marriedName: true } },
        detectedMagistratId: true,
        id: true,
        name: true,
        number: true,
        sessionId: true,
        targetedPosition: true,
      } satisfies Prisma.DossierDeNominationSelect,
      where: { id: { in: [...query.nominationFileIds] } },
    });

    return new Map(
      files.map(({ detectedMagistrat, id, ...file }) => [
        id,
        { ...file, name: proposedMagistratName({ detectedMagistrat, name: file.name }) },
      ]),
    );
  }

  /** files of deleted sessions are left out */
  @Transactional()
  async sort(query: { nominationFileIds: readonly string[] }): Promise<string[]> {
    assertPgParams(query.nominationFileIds);

    const files = await this.db.tx.dossierDeNomination.findMany({
      orderBy: [{ session: { date: 'desc' } }, { number: { nulls: 'last', sort: 'asc' } }],
      select: { id: true } satisfies Prisma.DossierDeNominationSelect,
      where: { id: { in: [...query.nominationFileIds] }, session: { deletedAt: null } },
    });

    return files.map(({ id }) => id);
  }

  @Transactional()
  async hydrate(query: {
    nominationFileIds: readonly string[];
    role: RoleEnum;
  }): Promise<HydratedNominationFile[]> {
    assertPgParams(query.nominationFileIds);

    const rawFiles = await this.db.tx.dossierDeNomination.findMany({
      select: {
        id: true,
        name: true,
        number: true,
        outcome: true,
        outcomeComment: true,
        session: {
          select: {
            archivedAt: true,
            date: true,
            formation: true,
            id: true,
            name: true,
            validatedAt: true,
          },
        },
        targetedGrade: true,
        targetedPosition: true,
      } satisfies Prisma.DossierDeNominationSelect,
      where: { id: { in: [...query.nominationFileIds] } },
    });
    const reporters = await this.versions.findPublishedReporters(query);

    // the caller's order is kept, a sorted page stays sorted
    const rawFilesById = new Map(rawFiles.map((file) => [file.id, file]));
    const files = query.nominationFileIds.flatMap((id) => {
      const file = rawFilesById.get(id);
      return file ? [{ ...file, reporters: reporters.get(id) ?? [] }] : [];
    });

    const sessionIds = Array.from(new Set(files.map(({ session }) => session.id)));
    const reportedSessionIds = await this.reportedSessionsFinder.reportedSessionIds({ sessionIds });
    const auditions = await this.auditionsSeen.findNominationFiles(query);

    return files.map((file) => {
      const audition = auditions.get(file.id);
      assert.ok(audition, `no audition seen for the nomination file ${file.id}`);

      return {
        ...audition,
        canScheduleAudition: canScheduleAudition(file, file.session),
        id: file.id,
        name: file.name,
        number: file.number,
        outcome: file.outcome ? { comment: file.outcomeComment, value: file.outcome } : null,
        reporters: file.reporters,
        session: {
          date: DateOnly.fromUtcDate(file.session.date).toJson(),
          formation: prismaFormationEnumToFormationEnum(file.session.formation),
          id: file.session.id,
          name: file.session.name,
          status: this.sessionStatus(file.session, reportedSessionIds),
        },
        targetedGrade: file.targetedGrade,
        targetedPosition: file.targetedPosition,
      };
    });
  }

  private sessionStatus(
    session: { id: string; archivedAt: Date | null; validatedAt: Date | null },
    reportedSessionIds: ReadonlySet<string>,
  ): SessionStatus {
    if (session.archivedAt) return 'ARCHIVED';
    if (session.validatedAt && reportedSessionIds.has(session.id)) return 'REPORTED';
    return 'ONGOING';
  }
}
