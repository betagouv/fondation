import { AuthenticationGateway } from "../../../core-logic/gateways/Authentication.gateway";
import { AuthenticationApiClient } from "../../../core-logic/gateways/AuthenticationApi.client";

export class ApiAuthenticationGateway implements AuthenticationGateway {
  constructor(private readonly apiClient: AuthenticationApiClient) {}

  async authenticate(email: string, password: string) {
    const authenticatedUser = await this.apiClient.login(email, password);
    return {
      firstName: authenticatedUser.firstName,
      lastName: authenticatedUser.lastName,
      role: authenticatedUser.role,
      gender: authenticatedUser.gender,
    };
  }

  async validateSession() {
    const user = await this.apiClient.validateSession();
    return user
      ? {
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          gender: user.gender,
        }
      : null;
  }

  logout() {
    return this.apiClient.logout();
  }
}
