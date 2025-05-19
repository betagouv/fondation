import {
  interpolateUrlParams,
  SecretariatGeneralContextRestContract,
} from "shared-models";
import { DataAdministrationClient } from "../../../core-logic/gateways/DataAdministration.client";
import { NouvelleTransparenceDto } from "../../primary/components/NouvelleTransparence/NouvelleTransparence";

type Endpoints = SecretariatGeneralContextRestContract["endpoints"];
type ClientFetchOptions = {
  [K in keyof Endpoints]: Omit<Endpoints[K], "response">;
};

const basePath: SecretariatGeneralContextRestContract["basePath"] =
  "api/secretariat-general";

// TODO AEB CREER LES TESTS E2E DU ENDPOINT
// TODO AEB CONVERTIR LE FICHIER RECU EN TSV
// TODO CENTRALISER LE FETCH QUELQUE PART dans un FETCHSERVICE-UTILS
// TESTER LE USE CASE data administration upload - CF MAXIME
export class ApiDataAdministrationClient implements DataAdministrationClient {
  constructor(private readonly baseUrl: string) {}

  async uploadTransparence(
    nouvelleTransparenceDto: NouvelleTransparenceDto,
  ): Promise<void> {
    const formData = new FormData();
    formData.append("file", nouvelleTransparenceDto.fichier);
    const { method, path, body }: ClientFetchOptions["nouvelleTransparence"] = {
      method: "POST",
      path: "nouvelle-transparence",
      body: nouvelleTransparenceDto,
    };

    const url = this.resolveUrl(path);

    const promise = await this.fetch(url, {
      method,
      credentials: "include",
      body: JSON.stringify(body),
    });
    return promise.json();
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
