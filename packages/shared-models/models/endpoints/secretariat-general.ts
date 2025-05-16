import { z } from "zod";
import { Magistrat } from "../magistrat.namespace";
import {
  RestContract
} from "./common";

export interface SecretariatGeneralContextRestContract extends RestContract {
  basePath: "api/secretariat-general";
  endpoints: {
    nouvelleTransparence: {
      method: "POST";
      path: "nouvelle-transparence";
      body: NouvelleTransparenceDto;
      response: void
    };
  };
}

export const nouvelleTransparenceDtoSchema = z.object({
  transparenceName: z.string().min(1, "Le nom de la transparence est requis."),
  transparencyDate: z
    .string()
    .min(1, "La date de la transparence est requise."),
  formation: z.nativeEnum(Magistrat.Formation),
  dateEcheance: z.string(),
  jobDate: z.string(),
  file: z.instanceof(File, { message: "Un fichier est requis." })
    .refine((file) => file.size > 0, { message: "Le fichier ne peut pas être vide." })
    .refine((file) => {
      const validTypes = ['image/png', 'image/jpeg', 'application/pdf'];
      return validTypes.includes(file.type);
    }, { message: "Le fichier doit être au format PNG, JPEG ou PDF." })
});

export type NouvelleTransparenceDto = z.infer<typeof nouvelleTransparenceDtoSchema>;