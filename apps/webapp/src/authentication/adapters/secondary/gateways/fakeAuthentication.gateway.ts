import {
  AuthenticatedUser,
  AuthenticationGateway,
} from "../../../core-logic/gateways/authentication.gateway";

export class FakeAuthenticationGateway implements AuthenticationGateway {
  private eligibleAuthUsers: Record<string, boolean> = {};
  private currentUser: string | null = null;
  private currentUserReporterName: string | null = null;

  async authenticate(username: string, password: string): Promise<boolean> {
    this.currentUser = `${username}-${password}`;
    return this.eligibleAuthUsers[`${username}-${password}`] ?? false;
  }
  async logout(): Promise<void> {
    if (!this.currentUser) return;
    this.currentUser = null;
  }

  getCurrentUser(): AuthenticatedUser | null {
    return this.currentUserReporterName
      ? { reporterName: this.currentUserReporterName }
      : null;
  }

  setEligibleAuthUser(
    email: string,
    password: string,
    authenticated: boolean,
    options?: { reporterName: string },
  ) {
    this.currentUser = `${email}-${password}`;
    this.eligibleAuthUsers[`${email}-${password}`] = authenticated;
    if (options?.reporterName) {
      this.currentUserReporterName = options.reporterName;
    }
  }
}
