import { DataAdministrationContextRestContract } from "shared-models";
import { NouvelleTransparenceDto } from "../../adapters/primary/components/NouvelleTransparence/NouvelleTransparence";

export type EndpointResponse<
  T extends keyof DataAdministrationContextRestContract["endpoints"],
> = Promise<DataAdministrationContextRestContract["endpoints"][T]["response"]>;

export interface DataAdministrationClient {
  uploadTransparence(
    nouvelleTransparenceDto: NouvelleTransparenceDto,
  ): EndpointResponse<"nouvelleTransparence">;
}
