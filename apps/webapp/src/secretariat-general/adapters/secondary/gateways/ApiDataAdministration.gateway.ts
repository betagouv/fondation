import { NouvelleTransparenceDto } from "shared-models";
import { DataAdministrationClient } from "../../../core-logic/gateways/DataAdministration.client";
import { DataAdministrationGateway } from "../../../core-logic/gateways/DataAdministration.gateway";

export class ApiDataAdministrationGateway implements DataAdministrationGateway {
  constructor(
    private readonly dataAdministrationApiClient: DataAdministrationClient,
  ) {}

  uploadTransparency(form: NouvelleTransparenceDto, file: File): Promise<void> {
    return this.dataAdministrationApiClient.uploadTransparency(form, file);
  }
}
