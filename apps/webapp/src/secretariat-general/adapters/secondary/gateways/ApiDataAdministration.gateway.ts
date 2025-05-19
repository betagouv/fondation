import { DataAdministrationClient } from "../../../core-logic/gateways/DataAdministration.client";
import { DataAdministrationGateway } from "../../../core-logic/gateways/DataAdministration.gateway";
import { NouvelleTransparenceDto } from "../../primary/components/NouvelleTransparence/NouvelleTransparence";

export class ApiDataAdministrationGateway implements DataAdministrationGateway {
  constructor(
    private readonly dataAdministrationApiClient: DataAdministrationClient,
  ) {}

  async uploadTransparence(
    nouvelleTransparenceDto: NouvelleTransparenceDto,
  ): Promise<void> {
    await this.dataAdministrationApiClient.uploadTransparence(
      nouvelleTransparenceDto,
    );
  }
}
