import {
  NouvelleTransparenceDto,
  SecretariatGeneralContextRestContract,
} from "shared-models";

export type EndpointResponse<
  T extends keyof SecretariatGeneralContextRestContract["endpoints"],
> = Promise<SecretariatGeneralContextRestContract["endpoints"][T]["response"]>;

export interface DataAdministrationClient {
  uploadTransparency(
    form: NouvelleTransparenceDto,
    file: File,
  ): EndpointResponse<"uploadTransparency">;
}
