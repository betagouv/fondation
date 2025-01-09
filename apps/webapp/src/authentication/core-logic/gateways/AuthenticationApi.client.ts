import { IdentityAndAccessRestContract } from "shared-models";

type Endpoints = IdentityAndAccessRestContract["endpoints"];

export interface AuthenticationApiClient {
  login(
    email: string,
    password: string,
  ): Promise<Endpoints["login"]["response"]>;
  logout(): Promise<Endpoints["logout"]["response"]>;
}
