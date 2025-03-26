import { FilesContextRestContract, interpolateUrlParams } from "shared-models";
import { FileApiClient } from "../../../core-logic/gateways/File.client";

type Endpoints = FilesContextRestContract["endpoints"];
type ClientFetchOptions = {
  [K in keyof Endpoints]: Omit<Endpoints[K], "response">;
};

const basePath: FilesContextRestContract["basePath"] = "api/files";

export class FetchFileApiClient implements FileApiClient {
  constructor(private readonly baseUrl: string) {}

  async getSignedUrls(ids: string[]) {
    const { method, path, queryParams }: ClientFetchOptions["getSignedUrls"] = {
      method: "GET",
      path: "signed-urls",
      queryParams: { ids },
    };
    const url = this.resolveUrl(path, undefined, queryParams);
    const response = await this.fetch(url, {
      method,
    });
    return response.json();
  }

  private resolveUrl(
    path: string,
    params?: Record<string, string>,
    queryParams?: Record<string, string | string[]>,
  ): string {
    const fullPath = `${basePath}/${path}`;
    const url = new URL(fullPath, this.baseUrl);
    if (queryParams) this.buildQueryParams(url, queryParams);

    if (!params) return url.href;
    return interpolateUrlParams(url, params);
  }

  private buildQueryParams(
    url: URL,
    searchParams: Record<string, string | string[]>,
  ) {
    Object.entries(searchParams).forEach(([key, values]) => {
      if (typeof values === "string") url.searchParams.append(key, values);
      else values.forEach((value) => url.searchParams.append(key, value));
    });
  }

  private async fetch(url: string, requestInit: RequestInit) {
    const response = await fetch(url, {
      ...requestInit,
      credentials: "include",
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return response;
  }
}
