import { Injectable, NotFoundException } from '@nestjs/common';
import { createZodDto } from 'nestjs-zod';
import z from 'zod';

import { findMagistratsCurrentPositionRawQuery, findReportedSessionIds } from 'src/generated/prisma/sql';
import { PrismaService } from 'src/modules/framework/database';
import {
  NominationFileOutcome,
  nominationFileOutcomeLabel,
  type NominationFileOutcomeEnum,
} from 'src/modules/session/domain/nomination-file-outcome';
import { AffectationVersionFinder } from 'src/modules/session/infrastructure/finders/affectation-version.finder';
import { FormationEnum } from 'src/modules/shared/formation.enum';
import { prismaFormationEnumToFormationEnum } from 'src/modules/shared/mappers/formation.mapper';
import { buildMagistratLolfiUrl } from 'src/utils/build-magistrat-lolfi-url';
import { DateOnly, dateOnlyJsonSchema } from 'src/utils/date-only';
import { dateToTimeOnly, timeOnlySchema } from 'src/utils/time-only';

@Injectable()
export class DetailMagistratQuery {
  constructor(
    private readonly prisma: PrismaService,
    private readonly affectationVersionFinder: AffectationVersionFinder,
  ) {}

  async handle(query: { magistratId: string }): Promise<DetailedMagistratDto> {
    return this.prisma.$transaction(async (tx) => {
      const magistrat = await tx.magistrat.findUnique({
        where: { id: query.magistratId },
        select: {
          id: true,
          civilite: true,
          firstName: true,
          lastName: true,
          usedName: true,
          birthDate: true,
          grade: true,
          gradeDate: true,
          nominationDate: true,
          installationDate: true,
          professionalEmail: true,
          careerHistory: true,
          externalId: true,

          detectedInNominationFiles: {
            where: { session: { deletedAt: null } },
            orderBy: { session: { date: 'desc' } },
            select: {
              id: true,
              number: true,
              auditionDate: true,
              auditionTime: true,
              targetedGrade: true,
              targetedPosition: true,
              outcome: true,
              outcomeComment: true,
              reporterIds: {
                where: { version: { statut: 'PUBLIEE' } },
                select: {
                  versionId: true,
                  user: { select: { firstName: true, lastName: true } },
                },
              },
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
          },

          observations: {
            where: { nominationFile: { session: { deletedAt: null } } },
            orderBy: { dateReception: 'desc' },
            select: {
              id: true,
              dateReception: true,
              nominationFile: {
                select: {
                  id: true,
                  name: true,
                  number: true,
                  auditionDate: true,
                  auditionTime: true,
                  targetedGrade: true,
                  targetedPosition: true,
                  outcome: true,
                  outcomeComment: true,
                  reporterIds: {
                    where: { version: { statut: 'PUBLIEE' } },
                    select: {
                      versionId: true,
                      user: { select: { firstName: true, lastName: true } },
                    },
                  },
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
              },
            },
          },
        },
      });

      if (!magistrat) throw new NotFoundException();

      const sessionIds = Array.from(
        new Set([
          ...magistrat.detectedInNominationFiles.map(({ session }) => session.id),
          ...magistrat.observations.map(({ nominationFile }) => nominationFile.session.id),
        ]),
      );
      const positions = await tx.$queryRawTyped(findMagistratsCurrentPositionRawQuery([magistrat.id]));
      const reportedRows = sessionIds.length
        ? await tx.$queryRawTyped(findReportedSessionIds(sessionIds))
        : [];
      const reportedIds = new Set(reportedRows.map(({ id }) => id));

      const publishedVersionIds = new Map<string, string>();
      for (const sessionId of sessionIds) {
        const version = await this.affectationVersionFinder.lastPublished({ tx, sessionId });
        if (version.optionalId) publishedVersionIds.set(sessionId, version.optionalId);
      }

      return {
        id: magistrat.id,
        civilite: magistrat.civilite,
        firstName: magistrat.firstName,
        lastName: magistrat.lastName,
        usedName: magistrat.usedName,
        birthDate: magistrat.birthDate ? DateOnly.fromDate(magistrat.birthDate).toJson() : null,
        grade: magistrat.grade,
        gradeDate: magistrat.gradeDate ? DateOnly.fromDate(magistrat.gradeDate).toJson() : null,
        nominationDate: magistrat.nominationDate
          ? DateOnly.fromDate(magistrat.nominationDate).toJson()
          : null,
        installationDate: magistrat.installationDate
          ? DateOnly.fromDate(magistrat.installationDate).toJson()
          : null,
        professionalEmail: magistrat.professionalEmail,
        currentPosition: positions[0]?.currentPosition || null,
        careerHistory: magistrat.careerHistory,
        externalUrl: buildMagistratLolfiUrl(magistrat.externalId),

        propositions: magistrat.detectedInNominationFiles.map((dossier) =>
          this.toDossierDto(dossier, publishedVersionIds, reportedIds),
        ),

        observations: magistrat.observations.map((observation) => ({
          id: observation.id,
          dateReception: DateOnly.fromDate(observation.dateReception).toJson(),
          magistratName: observation.nominationFile.name,
          ...this.toDossierDto(observation.nominationFile, publishedVersionIds, reportedIds),
        })),
      };
    });
  }

  private toDossierDto(
    dossier: {
      id: string;
      number: number | null;
      auditionDate: Date | null;
      auditionTime: Date | null;
      targetedGrade: string | null;
      targetedPosition: string | null;
      outcome: NominationFileOutcomeEnum | null;
      outcomeComment: string | null;
      reporterIds: { versionId: string; user: { firstName: string; lastName: string } }[];
      session: {
        id: string;
        name: string;
        formation: Parameters<typeof prismaFormationEnumToFormationEnum>[0];
        date: Date;
        archivedAt: Date | null;
      };
    },
    publishedVersionIds: Map<string, string>,
    reportedIds: Set<string>,
  ) {
    const formation = prismaFormationEnumToFormationEnum(dossier.session.formation);

    const publishedVersionId = publishedVersionIds.get(dossier.session.id);
    const reporters = dossier.reporterIds
      .filter((reporter) => reporter.versionId === publishedVersionId)
      .map(({ user }) => ({ firstName: user.firstName, lastName: user.lastName }));

    return {
      nominationFileId: dossier.id,
      number: dossier.number,
      reporters,
      sessionId: dossier.session.id,
      sessionName: dossier.session.name,
      formation,
      dateTransparence: DateOnly.fromDate(dossier.session.date).toJson(),
      auditionDate: dossier.auditionDate ? DateOnly.fromDate(dossier.auditionDate).toJson() : null,
      auditionTime: dossier.auditionTime ? dateToTimeOnly(dossier.auditionTime) : null,
      targetedGrade: dossier.targetedGrade,
      targetedPosition: dossier.targetedPosition,
      outcome: dossier.outcome
        ? {
            value: dossier.outcome,
            label: nominationFileOutcomeLabel({ outcome: dossier.outcome, formation }),
            comment: dossier.outcomeComment,
          }
        : null,
      isArchived: !!dossier.session.archivedAt,
      isSessionReported: reportedIds.has(dossier.session.id),
    };
  }
}

const MagistratPropositionSchema = z.object({
  nominationFileId: z.string(),
  number: z.number().int().nullable(),
  reporters: z.array(z.object({ firstName: z.string(), lastName: z.string() })),
  sessionId: z.string(),
  sessionName: z.string(),
  formation: z.enum(FormationEnum),
  dateTransparence: dateOnlyJsonSchema,
  auditionDate: dateOnlyJsonSchema.nullable(),
  auditionTime: timeOnlySchema.nullable(),
  targetedGrade: z.string().nullable(),
  targetedPosition: z.string().nullable(),
  outcome: z
    .object({
      value: z.enum(NominationFileOutcome.enum),
      label: z.string(),
      comment: z.string().nullable(),
    })
    .nullable(),
  isArchived: z.boolean(),
  isSessionReported: z.boolean(),
});

const MagistratObservationSchema = MagistratPropositionSchema.extend({
  id: z.string(),
  dateReception: dateOnlyJsonSchema,
  magistratName: z.string(),
});

export class DetailedMagistratDto extends createZodDto(
  z.object({
    id: z.string(),
    civilite: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    usedName: z.string().nullable(),
    birthDate: dateOnlyJsonSchema.nullable(),
    grade: z.string().nullable(),
    gradeDate: dateOnlyJsonSchema.nullable(),
    nominationDate: dateOnlyJsonSchema.nullable(),
    installationDate: dateOnlyJsonSchema.nullable(),
    professionalEmail: z.string().nullable(),
    currentPosition: z.string().nullable(),
    careerHistory: z.string().nullable(),
    externalUrl: z.url(),
    propositions: z.array(MagistratPropositionSchema),
    observations: z.array(MagistratObservationSchema),
  }),
) {}
