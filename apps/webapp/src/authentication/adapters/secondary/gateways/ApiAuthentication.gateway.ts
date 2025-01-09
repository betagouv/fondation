import _ from "lodash";
import { AuthenticationGateway } from "../../../core-logic/gateways/Authentication.gateway";
import { AuthenticationApiClient } from "../../../core-logic/gateways/AuthenticationApi.client";

export class ApiAuthenticationGateway implements AuthenticationGateway {
  constructor(private readonly apiClient: AuthenticationApiClient) {}

  async authenticate(email: string, password: string) {
    const authenticatedUser = await this.apiClient.login(email, password);

    if (!authenticatedUser) return null;

    const reporterName = `${_.upperCase(authenticatedUser.lastName)} ${_.capitalize(authenticatedUser.firstName)}`;
    return {
      reporterName,
    };
  }

  logout() {
    return this.apiClient.logout();
  }
}
