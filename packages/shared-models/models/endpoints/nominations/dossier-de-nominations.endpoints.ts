import { z } from "zod";
import type { DossierDeNominationEtAffectationSnapshot, DossierDeNominationSnapshot } from "../../session/dossier-de-nomination";
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
    dossierDeNominationEtAffectationParSession: {
      method: "GET";
      path: "snapshot/by-session";
      params: {
        sessionId: string;
      };
      response: DossierDeNominationEtAffectationSnapshot[];
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
  "dossierDeNominationEtAffectationParSession"
>;