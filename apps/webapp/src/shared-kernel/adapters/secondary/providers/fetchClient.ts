import { interpolateUrlParams, RestContract } from "shared-models";

type ClientFetchOptions<C extends RestContract> = {
  [K in keyof C["endpoints"]]: Omit<C["endpoints"][K], "response">;
};

const baseUrl = import.meta.env.VITE_API_URL;

export class FetchClient<Contract extends RestContract> {
  constructor(private readonly basePath: Contract["basePath"]) {}

  async fetch<P extends keyof Contract["endpoints"]>(
    endpointFetchOptions: ClientFetchOptions<Contract>[P],
  ): Promise<Contract["endpoints"][P]["response"]> {
    const url = this.resolveUrl(
      endpointFetchOptions.path,
      endpointFetchOptions.params,
      endpointFetchOptions.queryParams,
    );

    const resp = await this._fetch(url, {
      method: endpointFetchOptions.method,
      body: endpointFetchOptions.body
        ? endpointFetchOptions.body instanceof FormData
          ? endpointFetchOptions.body
          : JSON.stringify(endpointFetchOptions.body)
        : undefined,

      headers:
        endpointFetchOptions.body instanceof FormData
          ? undefined
          : {
              "Content-Type": "application/json",
            },
    });

    if (resp.headers.get("Content-Type")?.includes("application/json"))
      return (await resp.json()) as Contract["endpoints"][P]["response"];
    else return await resp.text();
  }

  private resolveUrl(
    path: string,
    params?: Record<string, string>,
    queryParams?: Record<string, string | string[] | number>,
  ): string {
    const fullPath = `${this.basePath}/${path}`;
    const url = new URL(fullPath, baseUrl);
    if (queryParams) this.buildQueryParams(url, queryParams);

    if (!params) return url.href;
    return interpolateUrlParams(url, params);
  }

  private buildQueryParams(
    url: URL,
    searchParams: Record<string, string | string[] | number>,
  ) {
    Object.entries(searchParams).forEach(([key, values]) => {
      if (typeof values === "number")
        url.searchParams.append(key, String(values));
      else if (typeof values === "string") url.searchParams.append(key, values);
      else values.forEach((value) => url.searchParams.append(key, value));
    });
  }

  private async _fetch(url: string, requestInit: RequestInit) {
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
