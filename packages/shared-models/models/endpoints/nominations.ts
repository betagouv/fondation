import { z } from "zod";
import { RestContract, ZodParamsDto } from "./common";
import { Magistrat } from "models/magistrat.namespace";
import { TypeDeSaisine } from "models/type-de-saisine.enum";

export interface NominationsContextRestContract extends RestContract {
  basePath: "api/nominations";
  endpoints: {
    sessionSnapshot: {
      method: "GET";
      path: "session/snapshot/by-id/:sessionId";
      params: {
        sessionId: string;
      };
      response: {
        id: string;
        sessionImportéeId: string;
        name: string;
        formation: Magistrat.Formation;
        typeDeSaisine: TypeDeSaisine;
        version: number;
      };
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
        content: Record<string, unknown>;
      };
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
  NominationsContextRestContract,
  "dossierDeNominationSnapshot"
>;

export interface SessionSnapshotParamsDto extends Record<string, string> {
  sessionId: string;
}
export const sessionSnapshotParamsSchema = z.object({
  sessionId: z.string().uuid(),
}) satisfies ZodParamsDto<NominationsContextRestContract, "sessionSnapshot">;
