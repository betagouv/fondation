import { NouvelleTransparenceDto } from "../../adapters/primary/components/NouvelleTransparence/NouvelleTransparence";
import { DataAdministrationClient } from "./DataAdministration.client";

export interface DataAdministrationGateway {
  uploadTransparence(
    nouvelleTransparenceDto: NouvelleTransparenceDto,
  ): ReturnType<DataAdministrationClient["uploadTransparence"]>;
}
