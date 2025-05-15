import { NouvelleTransparenceDto } from "shared-models";
import { DataAdministrationClient } from "./DataAdministration.client";

export interface DataAdministrationGateway {
  uploadTransparency(
    form: NouvelleTransparenceDto,
    file: File,
  ): ReturnType<DataAdministrationClient["uploadTransparency"]>;
}
