import { z } from "zod";
import { Magistrat } from "../magistrat.namespace";
import { RestContract } from "./common";

export interface DataAdministrationContextRestContract extends RestContract {
  basePath: "api/data-administration";
  endpoints: {
    nouvelleTransparence: {
      method: "POST";
      path: "nouvelle-transparence";
      body: NouvelleTransparenceDto;
      response: void;
    };
  };
}

export const nouvelleTransparenceDtoSchema = z.object({
  transparenceName: z.string().min(1, "Le nom de la transparence est requis."),
  transparenceDate: z
    .string()
    .min(1, "La date de la transparence est requise."),
  formation: z.nativeEnum(Magistrat.Formation),
  dateEcheance: z.string(),
  datePriseDePoste: z.string(),
});

export type NouvelleTransparenceDto = z.infer<
  typeof nouvelleTransparenceDtoSchema
>;
