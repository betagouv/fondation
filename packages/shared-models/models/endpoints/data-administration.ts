import { z } from "zod";
import { Magistrat } from "../magistrat.namespace";
import { RestContract } from "./common";

export interface DataAdministrationContextRestContract extends RestContract {
  basePath: "api/data-administration";
  endpoints: {
    importNouvelleTransparenceXlsx: {
      method: "POST";
      path: "import-nouvelle-transparence-xlsx";
      body: FormData;
      queryParams: ImportNouvelleTransparenceDto;
      response: void;
    };
  };
}

export const importNouvelleTransparenceDtoSchema = z.object({
  nomTransparence: z.string().min(1),
  formation: z.nativeEnum(Magistrat.Formation),
  dateTransparence: z.string().date(),
  dateEcheance: z.string().date(),
  datePriseDePosteCible: z.string().date().optional(),
  dateClotureDelaiObservation: z.string().date().optional(),
});

export type ImportNouvelleTransparenceDto = z.infer<
  typeof importNouvelleTransparenceDtoSchema
>;
