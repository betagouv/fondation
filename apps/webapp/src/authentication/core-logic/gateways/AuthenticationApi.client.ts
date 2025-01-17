import { IdentityAndAccessRestContract } from "shared-models";

type Endpoints = IdentityAndAccessRestContract["endpoints"];

type EndpointResponse<T extends keyof Endpoints> = Promise<
  Endpoints[T]["response"]
>;

export interface AuthenticationApiClient {
  login(email: string, password: string): EndpointResponse<"login">;
  logout(): EndpointResponse<"logout">;
}
