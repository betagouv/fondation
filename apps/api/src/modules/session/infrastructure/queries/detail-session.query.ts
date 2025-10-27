import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import {
  DateOnlyJson,
  dateOnlyJsonSchema,
  Magistrat,
  Role,
  TypeDeSaisine,
} from 'shared-models';
import { Db } from 'src/modules/framework/drizzle';
import {
  dossierDeNominationPm,
  formationEnum,
  reports,
  reportStateEnum,
  sessionPm,
  users,
} from 'src/modules/framework/drizzle/schemas';
import { assertIsDefined, isDefined } from 'src/utils/is-defined';
import { z } from 'zod';

@Injectable()
export class DetailSessionQuery {
  constructor(private readonly db: Db) {}

  async handle(query: {
    userId: string;
    sessionId: string;
    typeDeSaisine: TypeDeSaisine;
  }): Promise<DetailedSessionResponse> {
    const { role } = assertIsDefined(
      await this.db.query.users.findFirst({
        where: eq(users.id, query.userId),
      }),
    );

    const userFormationRestriction =
      role === Role.MEMBRE_DU_PARQUET
        ? Magistrat.Formation.PARQUET
        : role === Role.MEMBRE_DU_SIEGE
          ? Magistrat.Formation.SIEGE
          : null;

    const results = await this.db
      .select()
      .from(sessionPm)
      .leftJoin(reports, eq(reports.sessionId, sessionPm.id))
      .leftJoin(
        dossierDeNominationPm,
        eq(dossierDeNominationPm.id, reports.dossierDeNominationId),
      )
      .where(
        and(
          eq(sessionPm.id, query.sessionId),
          eq(sessionPm.typeDeSaisine, query.typeDeSaisine),
          eq(reports.reporterId, query.userId),
          userFormationRestriction
            ? eq(sessionPm.formation, userFormationRestriction)
            : undefined,
        ),
      );

    const lines = await z
      .array(
        z.object({
          session: z.object({
            id: z.string(),
            sessionImportéeId: z.string(),
            name: z.string(),
            formation: z.enum(formationEnum.enumValues),
            content: z.object({ dateTransparence: dateOnlyJsonSchema }),
          }),
          reports: z
            .object({
              id: z.string(),
              state: z.enum(reportStateEnum.enumValues),
              formation: z.enum(formationEnum.enumValues),
            })
            .nullable(),
          dossier_de_nomination: z
            .object({
              content: DossierDeNominationContentSchema,
            })
            .nullable(),
        }),
      )
      .parseAsync(results);

    const data = lines.reduce(
      (bySession, result) => {
        if (
          !isDefined(result.reports) ||
          !isDefined(result.dossier_de_nomination)
        ) {
          return bySession;
        }

        if (!bySession.session) {
          bySession.session = {
            id: result.session.id,
            sessionImportId: result.session.sessionImportéeId,
            formation: result.session.formation,
            transparency: result.session.name,
            dateTransparence: result.session.content.dateTransparence,
          };
        }

        if (!bySession.reports) bySession.reports = [];

        bySession.reports.push({
          id: result.reports.id,
          state: result.reports.state,
          formation: result.reports.formation,
          ...DetailSessionQuery.nomalizeDossierDeNomination(
            result.dossier_de_nomination.content,
          ),
        });
        return bySession;
      },
      {} as {
        session: {
          id: string;
          sessionImportId: string;
          transparency: string;
          formation: (typeof formationEnum)['enumValues'][number];
          dateTransparence: DateOnlyJson;
        };
        reports: {
          id: string;
          state: (typeof reportStateEnum)['enumValues'][number];
          formation: (typeof formationEnum)['enumValues'][number];
          folderNumber: number | null;
          dueDate: DateOnlyJson | null;
          name: string;
          grade: Magistrat.Grade;
          targettedPosition: string;
          observersCount: number;
        }[];
      },
    );

    return { data };
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
    grade: z.nativeEnum(Magistrat.Grade),
    targettedPosition: z.string(),
    observers: z.array(z.string()).nullable(),
  }),
  z.object({
    version: z.literal(2),
    numeroDeDossier: z.number().nullable(),
    nomMagistrat: z.string(),
    dateEchéance: dateOnlyJsonSchema.nullable(),
    grade: z.nativeEnum(Magistrat.Grade),
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
