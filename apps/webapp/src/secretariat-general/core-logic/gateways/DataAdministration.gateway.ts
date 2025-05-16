import { NouvelleTransparenceDto } from "shared-models";
import { DataAdministrationClient } from "./DataAdministration.client";

export interface DataAdministrationGateway {
  uploadTransparency(
    nouvelleTransparenceDto: NouvelleTransparenceDto,
  ): ReturnType<DataAdministrationClient["uploadTransparency"]>;
}
