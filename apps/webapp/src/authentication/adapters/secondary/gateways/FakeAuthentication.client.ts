import { AuthenticatedUser } from "shared-models";
import { AuthenticationApiClient } from "../../../core-logic/gateways/AuthenticationApi.client";

export class FakeAuthenticationApiClient implements AuthenticationApiClient {
  user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  } | null = null;

  async login(email: string, password: string) {
    if (
      !this.user ||
      this.user.email !== email ||
      this.user.password !== password
    ) {
      throw new Error("Invalid credentials");
    }
    const authenticatedUser: AuthenticatedUser = {
      userId: "user-id",
      firstName: this.user.firstName,
      lastName: this.user.lastName,
    };
    return authenticatedUser;
  }

  async logout() {
    this.user = null;
  }

  setEligibleAuthUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    this.user = { email, password, firstName, lastName };
  }
}
