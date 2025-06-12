import {
  interpolateUrlParams,
  DataAdministrationContextRestContract,
  ImportNouvelleTransparenceDto,
} from "shared-models";
import { DataAdministrationClient } from "../../../core-logic/gateways/DataAdministration.client";

type Endpoints = DataAdministrationContextRestContract["endpoints"];
type ClientFetchOptions = {
  [K in keyof Endpoints]: Omit<Endpoints[K], "response">;
};

const basePath: DataAdministrationContextRestContract["basePath"] =
  "api/data-administration";

export class ApiDataAdministrationClient implements DataAdministrationClient {
  constructor(private readonly baseUrl: string) {}

  async importNouvelleTransparenceXlsx(
    nouvelleTransparenceDto: ImportNouvelleTransparenceDto,
    fichier: File,
  ) {
    const formData = new FormData();
    formData.append("fichier", fichier, fichier.name);

    const {
      method,
      path,
      body,
      queryParams,
    }: ClientFetchOptions["importNouvelleTransparenceXlsx"] = {
      method: "POST",
      path: "import-nouvelle-transparence-xlsx",
      body: formData,
      queryParams: {
        nomTransparence: nouvelleTransparenceDto.nomTransparence,
        dateTransparence: nouvelleTransparenceDto.dateTransparence,
        formation: nouvelleTransparenceDto.formation,
        dateEcheance: nouvelleTransparenceDto.dateEcheance,
        datePriseDePosteCible: nouvelleTransparenceDto.datePriseDePosteCible,
        dateClotureDelaiObservation:
          nouvelleTransparenceDto.dateClotureDelaiObservation,
      },
    };
    const url = this.resolveUrl(path, undefined, queryParams);
    const resp = await this.fetch(url, {
      method,
      body,
    });

    return await resp.json();
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
      if (values === undefined) return;
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
