import { FilesContextRestContract } from "shared-models";

export type EndpointResponse<
  T extends keyof FilesContextRestContract["endpoints"],
> = Promise<FilesContextRestContract["endpoints"][T]["response"]>;

export interface FileApiClient {
  getSignedUrls(ids: string[]): EndpointResponse<"getSignedUrls">;
}
