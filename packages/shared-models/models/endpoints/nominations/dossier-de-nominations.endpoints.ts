import { z } from "zod";
import { Gender } from "../../gender";
import { Magistrat } from "../../magistrat.namespace";
import { Role } from "../../role";
import type { DossierDeNominationEtAffectationSnapshot, DossierDeNominationSnapshot } from "../../session/dossier-de-nomination";
import type { RestContract, ZodParamsDto } from "../common";


type UserDescriptorSerialized = {
  userId: string;
  firstName: string;
  lastName: string;
  role: Role;
  gender: Gender;
};

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
        formation: Magistrat.Formation;
      };
      response: {dossiers: DossierDeNominationEtAffectationSnapshot[]; availableRapporteurs: UserDescriptorSerialized[]};
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

export const dossierDeNominationEtAffectationSchema = z.object({
  sessionId: z.string().uuid(),
  formation: z.nativeEnum(Magistrat.Formation),
}) satisfies ZodParamsDto<
  DossierDeNominationRestContrat,
  "dossierDeNominationEtAffectationParSession"
>;