import { z } from "zod";
import type { DossierDeNominationSnapshot } from "../../session/dossier-de-nomination-content";
import type { RestContract, ZodParamsDto } from "../common";


export interface DossierDeNominationRestContrat extends RestContract {
  basePath: "api/nominations/dossier-de-nominations";
  endpoints: {
   dossierDeNominationSnapshot: {
      method: "GET";
      path: "snapshot/by-id/:dossierId";
      params: {
        dossierId: string;
      };
      response: DossierDeNominationSnapshot;
    };
    dossierDeNominationParSession: {
      method: "GET";
      path: "snapshot/by-session";
      params: {
        sessionId: string;
      };
      response: DossierDeNominationSnapshot[];
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
  DossierDeNominationRestContrat,
  "dossierDeNominationSnapshot"
>;

export const sessionIdParamsSchema = z.object({
  sessionId: z.string().uuid(),
}) satisfies ZodParamsDto<
  DossierDeNominationRestContrat,
  "dossierDeNominationParSession"
>;