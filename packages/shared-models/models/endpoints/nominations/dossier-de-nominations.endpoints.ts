import { z } from "zod";
import { Gender } from "../../gender";
import { Role } from "../../role";
import type { DossierDeNominationSnapshot, DossiersEtAffectationResponse } from "../../session/dossier-de-nomination";
import type { RestContract, ZodDto, ZodParamsDto } from "../common";
import { PrioriteEnum } from "../../priorite.enum";


export type UserDescriptorSerialized = {
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
      };
      response: DossiersEtAffectationResponse;
    };
    saveAffectationsRapporteurs: {
      method: "POST";
      path: "affectations-rapporteurs";
      body: SaveAffectationsRapporteursDto;
      response: void;
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
}) satisfies ZodParamsDto<
  DossierDeNominationRestContrat,
  "dossierDeNominationEtAffectationParSession"
>;

export interface DossierAffectationItem {
  dossierId: string;
  rapporteurIds: string[];
  priorite?: PrioriteEnum;
}

export interface SaveAffectationsRapporteursDto {
  sessionId: string;
  affectations: DossierAffectationItem[];
}

export const saveAffectationsRapporteursSchema = z.object({
  sessionId: z.string().uuid(),
  affectations: z.array(
    z.object({
      dossierId: z.string().uuid(),
      rapporteurIds: z.array(z.string().uuid()),
      priorite: z.nativeEnum(PrioriteEnum).optional(),
    })
  ),
}) satisfies ZodDto<
  DossierDeNominationRestContrat,
  "saveAffectationsRapporteurs"
>;