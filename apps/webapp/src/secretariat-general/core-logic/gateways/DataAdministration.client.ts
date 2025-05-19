import { SecretariatGeneralContextRestContract } from "shared-models";
import { NouvelleTransparenceDto } from "../../adapters/primary/components/NouvelleTransparence/NouvelleTransparence";

export type EndpointResponse<
  T extends keyof SecretariatGeneralContextRestContract["endpoints"],
> = Promise<SecretariatGeneralContextRestContract["endpoints"][T]["response"]>;

export interface DataAdministrationClient {
  uploadTransparence(
    nouvelleTransparenceDto: NouvelleTransparenceDto,
  ): EndpointResponse<"nouvelleTransparence">;
}
