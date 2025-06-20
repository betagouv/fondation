import {
  ImportNouvelleTransparenceDto,
  ImportObservantsXlsxDto,
} from "shared-models";
import { DataAdministrationClient } from "./DataAdministration.client";

export interface DataAdministrationGateway {
  importTransparenceXlsx(
    nouvelleTransparenceDto: ImportNouvelleTransparenceDto,
    fichier: File,
  ): ReturnType<DataAdministrationClient["importNouvelleTransparenceXlsx"]>;

  importObservantsXlsx(
    observantsDto: ImportObservantsXlsxDto,
    fichier: File,
  ): ReturnType<DataAdministrationClient["importObservantsXlsx"]>;
}
