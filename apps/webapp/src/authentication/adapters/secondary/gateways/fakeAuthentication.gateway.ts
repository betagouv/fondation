import { AuthenticationGateway } from "../../../core-logic/gateways/authentication.gateway";

export class FakeAuthenticationGateway implements AuthenticationGateway {
  private eligibleAuthUsers: Record<string, { reporterName: string } | null> =
    {};
  private currentUser: string | null = null;

  async authenticate(
    email: string,
    password: string,
  ): Promise<{ reporterName: string } | null> {
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
    options?: { reporterName: string },
  ) {
    this.eligibleAuthUsers[`${email}-${password}`] = options || null;
  }
}
