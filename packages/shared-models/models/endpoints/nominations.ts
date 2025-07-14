import { z, type ZodNumberDef, type ZodType } from "zod";
import { type DateOnlyJson, type Month } from "../date";
import { Magistrat } from "../magistrat.namespace";
import { TypeDeSaisine } from "../type-de-saisine.enum";
import { type RestContract, type ZodParamsDto, type ZodQueryParamsDto } from "./common";

type SessionSnapshotResponse = {
  id: string;
  sessionImportéeId: string;
  name: string;
  formation: Magistrat.Formation;
  typeDeSaisine: TypeDeSaisine;
  version: number;
  content: object;
};

export type TransparenceSnapshotResponse = {
  id: string;
  sessionImportéeId: string;
  name: string;
  formation: Magistrat.Formation;
  typeDeSaisine: TypeDeSaisine;
  version: number;
  content: {
    dateTransparence: DateOnlyJson;
    dateClôtureDélaiObservation: DateOnlyJson;
  };
};

export interface NominationsContextSessionsRestContract extends RestContract {
  basePath: "api/nominations/sessions";
  endpoints: {
    sessionSnapshot: {
      method: "GET";
      path: "session/snapshot/by-id/:sessionId";
      params: {
        sessionId: string;
      };
      response: SessionSnapshotResponse;
    };

    dossierDeNominationSnapshot: {
      method: "GET";
      path: "dossier-de-nomination/snapshot/by-id/:dossierId";
      params: {
        dossierId: string;
      };
      response: {
        id: string;
        sessionId: string;
        nominationFileImportedId: string;
        content: object;
      };
    };
  };
}

export interface NominationsContextTransparenceRestContract
  extends RestContract {
  basePath: "api/nominations/transparence";
  endpoints: {
    transparenceSnapshot: {
      method: "GET";
      path: "snapshot/by-nom-formation-et-date";
      queryParams: TransparenceSnapshotQueryParamsDto;
      response: TransparenceSnapshotResponse;
    };
  };
}

export interface DossierDeNominationSnapshotParamsDto
  extends Record<string, string> {
  dossierId: string;
}
export const dossierDeNominationSnapshotParamsSchema = z.object({
  dossierId: z.string().uuid(),
}) satisfies ZodParamsDto<
  NominationsContextSessionsRestContract,
  "dossierDeNominationSnapshot"
>;

export interface SessionSnapshotParamsDto extends Record<string, string> {
  sessionId: string;
}
export const sessionSnapshotParamsSchema = z.object({
  sessionId: z.string().uuid(),
}) satisfies ZodParamsDto<
  NominationsContextSessionsRestContract,
  "sessionSnapshot"
>;

export interface TransparenceSnapshotQueryParamsDto
  extends Record<string, string | number> {
  nom: string;
  formation: Magistrat.Formation;
  year: DateOnlyJson["year"];
  month: DateOnlyJson["month"];
  day: DateOnlyJson["day"];
}
export const transparenceSnapshotQueryParamsSchema = z.object({
  nom: z.string().min(1, "Le nom est requis."),
  formation: z.nativeEnum(Magistrat.Formation, {
    errorMap: () => ({
      message: "La formation est requise.",
    }),
  }),
  year: z.coerce
    .number()
    .int()
    .min(2025, "L'année doit être supérieure ou égale à 2025.")
    .transform((value) => Number(value)),
  month: z.coerce
    .number()
    .int()
    .min(1, "Le mois doit être compris entre 1 et 12.")
    .max(12) as ZodType<Month, ZodNumberDef, Month>,
  day: z.coerce
    .number()
    .int()
    .min(1, "Le jour doit être compris entre 1 et 31.")
    .max(31),
}) satisfies ZodQueryParamsDto<
  NominationsContextTransparenceRestContract,
  "transparenceSnapshot"
>;
