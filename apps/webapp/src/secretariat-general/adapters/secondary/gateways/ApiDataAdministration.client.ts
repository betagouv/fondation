import {
  interpolateUrlParams,
  DataAdministrationContextRestContract,
} from "shared-models";
import { DataAdministrationClient } from "../../../core-logic/gateways/DataAdministration.client";
import { NouvelleTransparenceDto } from "../../primary/components/NouvelleTransparence/NouvelleTransparence";

type Endpoints = DataAdministrationContextRestContract["endpoints"];
type ClientFetchOptions = {
  [K in keyof Endpoints]: Omit<Endpoints[K], "response">;
};

const basePath: DataAdministrationContextRestContract["basePath"] =
  "api/data-administration";

export class ApiDataAdministrationClient implements DataAdministrationClient {
  constructor(private readonly baseUrl: string) {}

  async uploadTransparence(
    nouvelleTransparenceDto: NouvelleTransparenceDto,
  ): Promise<void> {
    const formData = new FormData();
    Object.entries(nouvelleTransparenceDto).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append("fichier", value);
      } else {
        formData.append(key, value.toString());
      }
    });

    const {
      method,
      path,
    }: Omit<ClientFetchOptions["nouvelleTransparence"], "body"> = {
      method: "POST",
      path: "nouvelle-transparence",
    };
    const url = this.resolveUrl(path);

    const response = await this.fetch(url, {
      method,
      credentials: "include",
      body: formData,
    });
    return response.json();
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
