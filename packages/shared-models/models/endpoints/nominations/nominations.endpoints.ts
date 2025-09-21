import { z, type ZodNumberDef, type ZodType } from "zod";
import { type DateOnlyJson, type Month } from "../../date";
import { Magistrat } from "../../magistrat.namespace";
import type { SessionSnapshot } from "../../session/session-content";
import type { SessionMetadataSnapshot } from "../../session/session-metadata";
import { TypeDeSaisine } from "../../type-de-saisine.enum";
import { type RestContract, type ZodParamsDto, type ZodQueryParamsDto } from "../common";

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
    sessions: {
      method: "GET";
      path: "";
      response: SessionMetadataSnapshot[];
    },
    sessionSnapshot: {
      method: "GET";
      path: "session/snapshot/by-id/:sessionId";
      params: {
        sessionId: string;
      };
      response: SessionSnapshot;
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
