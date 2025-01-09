import {
  IdentityAndAccessRestContract,
  interpolateUrlParams,
  loginDtoSchema,
  validateSessionDtoSchema,
} from "shared-models";
import { AuthenticationApiClient } from "../../../core-logic/gateways/AuthenticationApi.client";

type Endpoints = IdentityAndAccessRestContract["endpoints"];
type ClientFetchOptions = {
  [K in keyof Endpoints]: Omit<Endpoints[K], "response">;
};

const basePath: IdentityAndAccessRestContract["basePath"] = "/api/auth";

export class FetchAuthenticationApiClient implements AuthenticationApiClient {
  constructor(private readonly baseUrl: string) {}

  async login(email: string, password: string) {
    const data = { email, password };
    loginDtoSchema.parse(data);
    const { method, path, body }: ClientFetchOptions["login"] = {
      method: "POST",
      path: "/login",
      body: data,
    };
    const url = this.resolveUrl(path);
    const response = await this.fetch(url, {
      method: method,
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });

    return response.json();
  }

  async validateSession(sessionId: string) {
    const data = { sessionId };
    validateSessionDtoSchema.parse(data);
    const { method, path, body }: ClientFetchOptions["validateSession"] = {
      method: "POST",
      path: "/validate-session",
      body: data,
    };
    const url = this.resolveUrl(path);
    const response = await this.fetch(url, {
      method: method,
      body: JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.json();
  }

  async logout() {
    const { method, path }: ClientFetchOptions["logout"] = {
      method: "POST",
      path: "/logout",
    };
    const url = this.resolveUrl(path);
    await this.fetch(url, {
      method: method,
      credentials: "include", // Send sessionId cookie with the request
    });
  }

  private resolveUrl(path: string, params?: Record<string, string>): string {
    const fullPath = `${basePath}${path}`;
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
