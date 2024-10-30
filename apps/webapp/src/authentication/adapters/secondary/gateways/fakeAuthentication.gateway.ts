import {
  AuthenticatedUser,
  AuthenticationGateway,
} from "../../../core-logic/gateways/authentication.gateway";

export class FakeAuthenticationGateway implements AuthenticationGateway {
  private eligibleAuthUsers: Record<string, AuthenticatedUser> = {};
  private currentUser: string | null = null;

  async authenticate(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser> {
    const isAuthUser = `${email}-${password}` in this.eligibleAuthUsers;

    if (!isAuthUser) throw new Error("Invalid credentials");
    const currentUser = this.eligibleAuthUsers[`${email}-${password}`];
    return currentUser || null;
  }
  async logout(): Promise<void> {
    if (!this.currentUser) return;
    this.currentUser = null;
  }

  setEligibleAuthUser(
    email: string,
    password: string,
    user?: AuthenticatedUser,
  ) {
    this.eligibleAuthUsers[`${email}-${password}`] = user || null;
  }
}
