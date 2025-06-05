import { z } from "zod";
import { RestContract, ZodParamsDto } from "./common";
import { Magistrat } from "../magistrat.namespace";
import { TypeDeSaisine } from "../type-de-saisine.enum";
import { DateOnlyJson } from "models/date";

type SessionSnapshotResponse = {
  id: string;
  sessionImportéeId: string;
  name: string;
  formation: Magistrat.Formation;
  typeDeSaisine: TypeDeSaisine;
  version: number;
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
      queryParams: {
        nom: string;
        formation: Magistrat.Formation;
        dateTransparence: DateOnlyJson;
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
