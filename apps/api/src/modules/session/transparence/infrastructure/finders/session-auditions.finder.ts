import { forwardRef, Inject, Injectable } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { MagistratService } from 'src/modules/magistrat/magistrat.service';
import { ObservationService } from 'src/modules/observation/observation.service';
import { isAuditionExpected } from 'src/modules/shared/policies/auditioned-position.policy';
import { canScheduleAudition } from 'src/modules/shared/policies/nomination-file.policies';
import { type AuditionSchedule, isPastAudition, toAuditionSchedule } from 'src/utils/audition-schedule';

import { AffectationVersionFinder } from './affectation-version.finder';

const AUDITION_ROLES = ['OBSERVANT', 'PROPOSED'] as const;
export type AuditionRole = (typeof AUDITION_ROLES)[number];

type Reporter = { firstName: string; id: string; lastName: string };

export type SessionAudition = {
  audition: AuditionSchedule | null;
  contact: { email: string | null; phone: string | null } | null;
  id: string;
  magistrat: { currentPosition: string | null; id: string | null; name: string };
  propositions: { label: string; nominationFileId: string; observationId: string | null }[];
  reporters: Reporter[];
  role: AuditionRole;
};

// a proposed magistrat is heard on their nomination file, an observant once for all their observations:
// the same person may be heard twice in a session, in two rows. An audition leaves the list once it is past
@Injectable()
export class SessionAuditionsFinder {
  constructor(
    private readonly clock: Clock,
    private readonly db: Db,
    private readonly versions: AffectationVersionFinder,

    @Inject(forwardRef(() => MagistratService))
    private readonly magistrats: MagistratService,

    @Inject(forwardRef(() => ObservationService))
    private readonly observations: ObservationService,
  ) {}

  async find(query: { sessionId: string }): Promise<SessionAudition[]> {
    const session = await this.db.tx.session.findUniqueOrThrow({
      select: {
        archivedAt: true,
        dossierDeNominations: {
          select: {
            auditionDate: true,
            auditionTime: true,
            currentPosition: true,
            detectedJurisdiction: { select: { typeJur: true } },
            detectedJurisdictionId: true,
            detectedMagistratId: true,
            detectedTargetedFunctionId: true,
            grade: true,
            id: true,
            name: true,
            outcome: true,
            targetedGrade: true,
            targetedPosition: true,
          },
        },
      } satisfies Prisma.SessionSelect,
      where: { id: query.sessionId },
    });
    const now = this.clock.now();
    const files = new Map(session.dossierDeNominations.map((file) => [file.id, file]));

    const proposedFiles = session.dossierDeNominations.filter((file) =>
      file.auditionDate && file.auditionTime
        ? !isPastAudition(toAuditionSchedule(file.auditionDate, file.auditionTime), now)
        : isAuditionExpected({
            ...file,
            detectedJurisdictionType: file.detectedJurisdiction?.typeJur ?? null,
          }) && canScheduleAudition(file, session),
    );
    const observantAuditions = (await this.observations.internalListObservantAuditions(query)).filter(
      ({ audition }) => !isPastAudition(audition, now),
    );

    const reporters = await this.findReporters({ sessionId: query.sessionId });
    const profiles = await this.magistrats.internalFindMagistratProfiles({
      magistratIds: [
        ...proposedFiles.flatMap(({ detectedMagistratId }) => detectedMagistratId ?? []),
        ...observantAuditions.map(({ magistratId }) => magistratId),
      ],
    });
    const propositionLabel = (fileId: string) => {
      const file = files.get(fileId);
      return [file?.targetedGrade, file?.targetedPosition].filter(Boolean).join(' - ');
    };

    const proposed = proposedFiles.map((file): SessionAudition => {
      const profile = file.detectedMagistratId ? profiles.get(file.detectedMagistratId) : undefined;
      return {
        audition:
          file.auditionDate && file.auditionTime
            ? toAuditionSchedule(file.auditionDate, file.auditionTime)
            : null,
        contact: profile ? { email: profile.email, phone: profile.phone } : null,
        id: `PROPOSED-${file.id}`,
        magistrat: {
          currentPosition:
            profile?.currentPosition ??
            ([file.grade, file.currentPosition].filter(Boolean).join(' - ') || null),
          id: file.detectedMagistratId,
          name: profile?.name ?? file.name,
        },
        propositions: [{ label: propositionLabel(file.id), nominationFileId: file.id, observationId: null }],
        reporters: reporters.get(file.id) ?? [],
        role: 'PROPOSED',
      };
    });

    const observants = observantAuditions.flatMap((observant): SessionAudition[] => {
      const profile = profiles.get(observant.magistratId);
      if (!profile) return [];

      const observedReporters = observant.observations.flatMap(
        ({ nominationFileId }) => reporters.get(nominationFileId) ?? [],
      );
      return [
        {
          audition: observant.audition,
          contact: { email: profile.email, phone: profile.phone },
          id: `OBSERVANT-${observant.magistratId}`,
          magistrat: {
            currentPosition: profile.currentPosition,
            id: observant.magistratId,
            name: profile.name,
          },
          propositions: observant.observations.map(({ nominationFileId, observationId }) => ({
            label: propositionLabel(nominationFileId),
            nominationFileId,
            observationId,
          })),
          reporters: [...new Map(observedReporters.map((reporter) => [reporter.id, reporter])).values()],
          role: 'OBSERVANT',
        },
      ];
    });

    return [...proposed, ...observants];
  }

  // the secretariat works on the last version of the affectations, published or not
  private async findReporters(query: { sessionId: string }): Promise<Map<string, Reporter[]>> {
    const version = await this.versions.last(query);
    if (version.isNone()) return new Map();

    const affectations = await this.db.tx.nominationFileToReporter.findMany({
      select: {
        nominationFileId: true,
        user: { select: { firstName: true, id: true, lastName: true } },
      } satisfies Prisma.NominationFileToReporterSelect,
      where: { versionId: version.id },
    });

    const reporters = new Map<string, Reporter[]>();
    for (const { nominationFileId, user } of affectations) {
      reporters.set(nominationFileId, [...(reporters.get(nominationFileId) ?? []), user]);
    }
    return reporters;
  }
}
