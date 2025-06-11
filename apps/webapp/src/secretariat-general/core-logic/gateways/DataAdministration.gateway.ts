import { ImportNouvelleTransparenceDto } from "shared-models";
import { DataAdministrationClient } from "./DataAdministration.client";

export interface DataAdministrationGateway {
  importTransparenceXlsx(
    nouvelleTransparenceDto: ImportNouvelleTransparenceDto,
    fichier: File,
  ): ReturnType<DataAdministrationClient["importNouvelleTransparenceXlsx"]>;
}
