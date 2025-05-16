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
      body: NouvelleTransparenceSchemaDto;
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
    .refine((file) => file.size > 0, { message: "Le fichier de la transparence est requis." })
    .refine((file) => {
      const validTypes = ['image/png', 'image/jpeg', 'application/pdf'];
      return validTypes.includes(file.type);
    }, { message: "Veuillez importer un fichier au bon format." })
});

export type NouvelleTransparenceSchemaDto = z.infer<typeof nouvelleTransparenceDtoSchema>;