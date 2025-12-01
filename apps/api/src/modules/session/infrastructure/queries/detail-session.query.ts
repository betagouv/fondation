import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { z } from 'zod';

import {
  DateOnlyJson,
  dateOnlyJsonSchema,
  Magistrat,
  NominationFile,
  Role,
  TypeDeSaisine,
} from 'shared-models';

import { PrismaService } from 'src/modules/framework/database';
import { assertIsDefined } from 'src/utils/is-defined';
import { AffectationVersionFinder } from '../finders/affectation-version.finder';

@Injectable()
export class DetailSessionQuery {
  private readonly logger = new Logger(DetailSessionQuery.name);

  constructor(
    private readonly prisma: PrismaService,
    private versionFinder: AffectationVersionFinder,
  ) {}

  async handle(query: {
    userId: string;
    sessionId: string;
    typeDeSaisine: TypeDeSaisine;
  }): Promise<DetailedSessionResponse> {
    const session = await this.prisma.$transaction(async (tx) => {
      const { role } = assertIsDefined(
        await tx.user.findFirst({
          where: { id: query.userId },
          select: { role: true },
        }),
      );

      const version = await this.versionFinder.lastPublished({
        sessionId: query.sessionId,
        tx,
      });

      if (!version) throw new NotFoundException();

      const formation =
        role === Role.MEMBRE_DU_PARQUET
          ? Magistrat.Formation.PARQUET
          : role === Role.MEMBRE_DU_SIEGE
            ? Magistrat.Formation.SIEGE
            : undefined;

      return tx.session.findFirst({
        where: {
          formation,
          id: query.sessionId,
          typeDeSaisine: query.typeDeSaisine,
        },
        select: {
          id: true,
          name: true,
          typeDeSaisine: true,
          formation: true,
          sessionImportId: true,
          content: true,
          dossierDeNominations: {
            where: {
              reporterIds: {
                some: { versionId: version.id, userId: query.userId },
              },
            },
            select: {
              id: true,
              content: true,
              reports: {
                take: 1,
                select: { id: true, state: true },
                where: { reporterId: query.userId },
              },
            },
          },
        },
      });
    });

    if (!session) throw new NotFoundException();

    const result = await z
      .object({
        id: z.string(),
        typeDeSaisine: z.enum(TypeDeSaisine),
        formation: z.enum(Magistrat.Formation),
        sessionImportId: z.string(),
        name: z.string(),
        content: z.object({ dateTransparence: dateOnlyJsonSchema }),
        dossierDeNominations: z.array(
          z.object({
            id: z.string(),
            content: DossierDeNominationContentSchema,
            reports: z
              .array(
                z.object({
                  id: z.string(),
                  state: z.enum(NominationFile.ReportState),
                }),
              )
              .min(1),
          }),
        ),
      })
      .safeParseAsync(session);

    if (!result.success) {
      this.logger.error(z.prettifyError(result.error));

      throw new NotFoundException();
    }

    return {
      data: {
        session: {
          id: result.data.id,
          sessionImportId: result.data.sessionImportId,
          formation: result.data.formation,
          transparency: result.data.name,
          dateTransparence: result.data.content.dateTransparence,
        },
        reports: result.data.dossierDeNominations.map((d) => {
          const { id, state } = assertIsDefined(d.reports[0]);

          return {
            id,
            state,
            formation: result.data.formation,
            ...DetailSessionQuery.nomalizeDossierDeNomination(d.content),
          };
        }),
      },
    };
  }

  private static nomalizeDossierDeNomination(
    input: z.infer<typeof DossierDeNominationContentSchema>,
  ) {
    if (input.version !== 2) {
      const { observers, ...rest } = input;
      return { ...rest, observersCount: observers?.length ?? 0 };
    }

    return {
      folderNumber: input.numeroDeDossier,
      dueDate: input.dateEchéance,
      name: input.nomMagistrat,
      grade: input.grade,
      targettedPosition: input.posteCible,
      observersCount: input.observants?.length ?? 0,
    };
  }
}

const DossierDeNominationContentSchema = z.discriminatedUnion('version', [
  z.object({
    version: z.literal(1).optional(),
    folderNumber: z.number().nullable(),
    name: z.string(),
    dueDate: dateOnlyJsonSchema.nullable(),
    grade: z.enum(Magistrat.Grade),
    targettedPosition: z.string(),
    observers: z.array(z.string()).nullable(),
  }),
  z.object({
    version: z.literal(2),
    numeroDeDossier: z.number().nullable(),
    nomMagistrat: z.string(),
    dateEchéance: dateOnlyJsonSchema.nullable(),
    grade: z.enum(Magistrat.Grade),
    posteCible: z.string(),
    observants: z.array(z.string()).nullable(),
  }),
]);

export type DetailedSessionResponse = {
  data: {
    session: {
      id: string;
      sessionImportId: string;
      formation: string;
      transparency: string;
      dateTransparence: DateOnlyJson;
    };
    reports: {
      id: string;
      state: string;
      formation: string;
      folderNumber: number | null;
      dueDate: DateOnlyJson | null;
      name: string;
      grade: string;
      targettedPosition: string;
      observersCount: number;
    }[];
  };
};
