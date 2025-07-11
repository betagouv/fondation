import { z } from "zod";
import { Magistrat } from "../magistrat.namespace";
import { type RestContract } from "./common";

export interface DataAdministrationContextRestContract extends RestContract {
  basePath: "api/data-administration";
  endpoints: {
    importNouvelleTransparenceXlsx: {
      method: "POST";
      path: "import-nouvelle-transparence-xlsx";
      body: FormData;
      queryParams: ImportNouvelleTransparenceDto;
      response: {
        validationError?: string;
      };
    };
    importObservantsXlsx: {
      method: "POST";
      path: "import-observants-xlsx";
      body: FormData;
      queryParams: ImportObservantsXlsxDto;
      response: {
        validationError?: string;
      };
    };
  };
}

export const importNouvelleTransparenceDtoSchema = z.object({
  nomTransparence: z.string().min(1),
  formation: z.nativeEnum(Magistrat.Formation),
  dateTransparence: z.string().date(),
  dateEcheance: z.string().date().optional(),
  datePriseDePosteCible: z.string().date().optional(),
  dateClotureDelaiObservation: z.string().date(),
});
export type ImportNouvelleTransparenceDto = z.infer<
  typeof importNouvelleTransparenceDtoSchema
>;

export const importObservantsXlsxDtoSchema = z.object({
  nomTransparence: z.string().min(1),
  formation: z.nativeEnum(Magistrat.Formation),
  dateTransparence: z.string().date(),
});
export type ImportObservantsXlsxDto = z.infer<
  typeof importObservantsXlsxDtoSchema
>;
