import assert from 'node:assert';

import { forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { Prisma } from 'src/generated/prisma/client';
import { Clock } from 'src/modules/framework/clock';
import { Db } from 'src/modules/framework/database';
import { MagistratService } from 'src/modules/magistrat/magistrat.service';
import { roleToFormation } from 'src/modules/members/infrastructure/member.utils';
import { ObservationService } from 'src/modules/observation/observation.service';
import { canScheduleAudition } from 'src/modules/shared/policies/nomination-file.policies';
import { isSecretariat, type RoleEnum } from 'src/modules/shared/role.enum';
import { type AuditionSchedule, isPastAudition } from 'src/utils/audition-schedule';

import { AffectationVersionFinder } from './affectation-version.finder';
import { AuditionPublicationFinder } from './audition-publication.finder';
import { AuditionsSeenFinder } from './auditions-seen.finder';

const AUDITION_ROLES = ['OBSERVANT', 'PROPOSED'] as const;
export type AuditionRole = (typeof AUDITION_ROLES)[number];

type Reporter = { firstName: string; id: string; lastName: string };

export type SessionAudition = {
  audition: AuditionSchedule | null;
  contact: { email: string | null; phoneNumber: { label: string | null; number: string } | null } | null;
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
    private readonly auditionsSeen: AuditionsSeenFinder,
    private readonly clock: Clock,
    private readonly db: Db,
    private readonly publications: AuditionPublicationFinder,
    private readonly versions: AffectationVersionFinder,

    @Inject(forwardRef(() => MagistratService))
    private readonly magistrats: MagistratService,

    @Inject(forwardRef(() => ObservationService))
    private readonly observations: ObservationService,
  ) {}

  async find(query: { role: RoleEnum; sessionId: string }): Promise<SessionAudition[]> {
    const session = await this.db.tx.session.findFirst({
      select: {
        archivedAt: true,
        dossierDeNominations: {
          select: {
            currentPosition: true,
            detectedMagistratId: true,
            grade: true,
            id: true,
            name: true,
            outcome: true,
            targetedGrade: true,
            targetedPosition: true,
          },
        },
      } satisfies Prisma.SessionSelect,
      where: { deletedAt: null, formation: roleToFormation(query.role), id: query.sessionId },
    });
    if (!session) throw new NotFoundException();

    // the members get the table from its first publication on
    if (!isSecretariat(query.role) && !(await this.publications.last(query))) return [];
    const now = this.clock.now();
    const files = new Map(session.dossierDeNominations.map((file) => [file.id, file]));

    const seen = await this.auditionsSeen.findNominationFiles({
      nominationFileIds: [...files.keys()],
      role: query.role,
    });
    const proposedFiles = session.dossierDeNominations.flatMap((file) => {
      const seenAudition = seen.get(file.id);
      assert.ok(seenAudition, `no audition seen for the nomination file ${file.id}`);
      const { auditionDate, auditionRequired, auditionTime } = seenAudition;
      const audition = auditionDate && auditionTime ? { date: auditionDate, time: auditionTime } : null;
      const listed = audition
        ? !isPastAudition(audition, now)
        : auditionRequired && canScheduleAudition(file, session);

      return listed ? [{ ...file, audition }] : [];
    });

    const observantSchedules = await this.auditionsSeen.findObservants(query);
    const upcomingObservants = [...observantSchedules].filter(
      ([, audition]) => !isPastAudition(audition, now),
    );
    const observations = await this.observations.internalFindObservantObservations({
      magistratIds: upcomingObservants.map(([magistratId]) => magistratId),
      sessionId: query.sessionId,
    });
    const observantAuditions = upcomingObservants.map(([magistratId, audition]) => ({
      audition,
      magistratId,
      observations: observations.get(magistratId) ?? [],
    }));

    const reporters = await this.findReporters(query);
    // only the secretariat reaches the magistrats to schedule their audition
    const contactOf = (
      profile:
        | { email: string | null; phoneNumber: { label: string | null; number: string } | null }
        | undefined,
    ) =>
      profile && isSecretariat(query.role)
        ? { email: profile.email, phoneNumber: profile.phoneNumber }
        : null;
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
        audition: file.audition,
        contact: contactOf(profile),
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
          contact: contactOf(profile),
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
  private async findReporters(query: {
    role: RoleEnum;
    sessionId: string;
  }): Promise<Map<string, Reporter[]>> {
    const version = isSecretariat(query.role)
      ? await this.versions.last(query)
      : await this.versions.lastPublished(query);
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
