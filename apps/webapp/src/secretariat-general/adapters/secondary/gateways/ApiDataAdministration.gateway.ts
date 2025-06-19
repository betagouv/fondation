import {
  ImportNouvelleTransparenceDto,
  ImportObservantsXlsxDto,
} from "shared-models";
import { DataAdministrationClient } from "../../../core-logic/gateways/DataAdministration.client";
import { DataAdministrationGateway } from "../../../core-logic/gateways/DataAdministration.gateway";

export class ApiDataAdministrationGateway implements DataAdministrationGateway {
  constructor(
    private readonly dataAdministrationApiClient: DataAdministrationClient,
  ) {}

  importTransparenceXlsx(
    nouvelleTransparenceDto: ImportNouvelleTransparenceDto,
    fichier: File,
  ) {
    return this.dataAdministrationApiClient.importNouvelleTransparenceXlsx(
      nouvelleTransparenceDto,
      fichier,
    );
  }

  importObservantsXlsx(
    observantsDto: ImportObservantsXlsxDto,
    fichier: File,
  ): ReturnType<DataAdministrationClient["importObservantsXlsx"]> {
    return this.dataAdministrationApiClient.importObservantsXlsx(
      observantsDto,
      fichier,
    );
  }
}
