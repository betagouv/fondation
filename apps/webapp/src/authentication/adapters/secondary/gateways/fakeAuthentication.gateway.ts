import { AuthenticationGateway } from "../../../core-logic/gateways/authentication.gateway";

export class FakeAuthenticationGateway implements AuthenticationGateway {
  private eligibleAuthUsers: Record<string, boolean> = {};

  async authenticate(username: string, password: string): Promise<boolean> {
    return this.eligibleAuthUsers[`${username}-${password}`] ?? false;
  }
  async logout(): Promise<void> {}

  setEligibleAuthUser(
    username: string,
    password: string,
    authenticated: boolean,
  ) {
    this.eligibleAuthUsers[`${username}-${password}`] = authenticated;
  }
}
