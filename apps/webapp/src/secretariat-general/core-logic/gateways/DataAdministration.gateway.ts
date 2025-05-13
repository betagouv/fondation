import { DataAdministrationClient } from "./DataAdministration.client";

export interface DataAdministrationGateway {
  uploadTransparency(
    file: File,
  ): ReturnType<DataAdministrationClient["uploadTransparency"]>;
}
