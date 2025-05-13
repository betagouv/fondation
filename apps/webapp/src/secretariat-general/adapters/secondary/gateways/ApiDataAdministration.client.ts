import {
  interpolateUrlParams,
  SecretariatGeneralContextRestContract,
} from "shared-models";
import { DataAdministrationClient } from "../../../core-logic/gateways/DataAdministration.client";

type Endpoints = SecretariatGeneralContextRestContract["endpoints"];
type ClientFetchOptions = {
  [K in keyof Endpoints]: Omit<Endpoints[K], "response">;
};

const basePath: SecretariatGeneralContextRestContract["basePath"] =
  "api/secretariat-general";

export class ApiDataAdministrationClient implements DataAdministrationClient {
  constructor(private readonly baseUrl: string) {}

  uploadTransparency(file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    const { method, path, body }: ClientFetchOptions["uploadTransparency"] = {
      method: "POST",
      path: "transparency",
      body: formData,
    };

    const url = this.resolveUrl(path);
    return this.fetch(url, {
      method,
      body,
    }).then(() => {});
  }

  private resolveUrl(path: string, params?: Record<string, string>): string {
    const fullPath = `${basePath}/${path}`;
    const url = new URL(fullPath, this.baseUrl);
    if (!params) return url.href;
    return interpolateUrlParams(url, params);
  }

  private async fetch(url: string, requestInit: RequestInit) {
    const response = await fetch(url, requestInit);
    if (!response.ok) {
      throw new Error(`Error: ${response.status} ${response.statusText}`);
    }
    return response;
  }
}
