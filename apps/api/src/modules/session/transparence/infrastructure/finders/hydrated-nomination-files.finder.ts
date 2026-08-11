import { Transactional } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';

import { findReportedSessionIds } from 'src/generated/prisma/sql';
import { Db } from 'src/modules/framework/database';
import { type NominationFileOutcomeEnum } from 'src/modules/session/shared/types/nomination-file-outcome';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { isAuditionExpected } from 'src/modules/shared/policies/auditioned-position.policy';
import { DateOnly, type DateOnlyJson } from 'src/utils/date-only';
import { dateToTimeOnly, type TimeOnly } from 'src/utils/time-only';

import { AffectationVersionFinder } from './affectation-version.finder';

export const SESSION_STATUSES = ['ONGOING', 'REPORTED', 'ARCHIVED'] as const;
export type SessionStatus = (typeof SESSION_STATUSES)[number];

export type HydratedNominationFile = {
  id: string;
  name: string;
  number: number | null;
  reporters: { id: string; firstName: string; lastName: string }[];
  session: {
    id: string;
    name: string;
    formation: FormationEnum;
    date: DateOnlyJson;
    status: SessionStatus;
  };
  auditionDate: DateOnlyJson | null;
  auditionExpected: boolean;
  auditionTime: TimeOnly | null;
  targetedGrade: string | null;
  targetedPosition: string | null;
  outcome: { value: NominationFileOutcomeEnum; comment: string | null } | null;
};

@Injectable()
export class HydratedNominationFilesFinder {
  constructor(
    private readonly db: Db,
    private readonly versions: AffectationVersionFinder,
  ) {}

  @Transactional()
  async hydrate(query: { nominationFileIds: readonly string[] }): Promise<HydratedNominationFile[]> {
    const files = [];
    for (const nominationFileId of query.nominationFileIds) {
      const file = await this.hydrateFile(nominationFileId);
      if (file) files.push(file);
    }

    const sessionIds = Array.from(new Set(files.map(({ session }) => session.id)));
    const reportedSessions = sessionIds.length
      ? await this.db.tx.$queryRawTyped(findReportedSessionIds(sessionIds))
      : [];
    const reportedSessionIds = new Set(reportedSessions.map(({ id }) => id));

    return files.map((file) => ({
      id: file.id,
      name: file.name,
      number: file.number,
      reporters: file.reporters,
      session: {
        id: file.session.id,
        name: file.session.name,
        formation: prismaFormationEnumToFormationEnum(file.session.formation),
        date: DateOnly.fromDate(file.session.date).toJson(),
        status: this.sessionStatus(file.session, reportedSessionIds),
      },
      auditionDate: file.auditionDate ? DateOnly.fromDate(file.auditionDate).toJson() : null,
      auditionExpected: isAuditionExpected(file),
      auditionTime: file.auditionTime ? dateToTimeOnly(file.auditionTime) : null,
      targetedGrade: file.targetedGrade,
      targetedPosition: file.targetedPosition,
      outcome: file.outcome ? { value: file.outcome, comment: file.outcomeComment } : null,
    }));
  }

  private async hydrateFile(nominationFileId: string) {
    const file = await this.db.tx.dossierDeNomination.findUnique({
      where: { id: nominationFileId },
      select: {
        id: true,
        name: true,
        number: true,
        auditionDate: true,
        auditionTime: true,
        detectedJurisdictionId: true,
        detectedTargetedFunctionId: true,
        targetedGrade: true,
        targetedPosition: true,
        outcome: true,
        outcomeComment: true,
        session: {
          select: {
            id: true,
            name: true,
            formation: true,
            date: true,
            archivedAt: true,
          },
        },
      },
    });

    if (!file) return null;

    const reporters = await this.versions.findReporters({
      nominationFileId: file.id,
      sessionId: file.session.id,
    });

    return { ...file, reporters };
  }

  // TODO: see computeStatus in list-nomination-sessions.query.ts to homogenize the session status computations
  private sessionStatus(
    session: { id: string; archivedAt: Date | null },
    reportedSessionIds: Set<string>,
  ): SessionStatus {
    if (session.archivedAt) return 'ARCHIVED';
    if (reportedSessionIds.has(session.id)) return 'REPORTED';
    return 'ONGOING';
  }
}
