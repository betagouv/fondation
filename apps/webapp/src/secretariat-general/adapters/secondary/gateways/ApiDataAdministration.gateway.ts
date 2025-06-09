import { ImportNouvelleTransparenceDto } from "shared-models";
import { DataAdministrationClient } from "../../../core-logic/gateways/DataAdministration.client";
import { DataAdministrationGateway } from "../../../core-logic/gateways/DataAdministration.gateway";

export class ApiDataAdministrationGateway implements DataAdministrationGateway {
  constructor(
    private readonly dataAdministrationApiClient: DataAdministrationClient,
  ) {}

  async importTransparenceXlsx(
    nouvelleTransparenceDto: ImportNouvelleTransparenceDto,
    fichier: File,
  ): Promise<void> {
    await this.dataAdministrationApiClient.importNouvelleTransparenceXlsx(
      nouvelleTransparenceDto,
      fichier,
    );
  }
}
