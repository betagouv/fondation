import { AuthenticatedUser, Gender, Role } from "shared-models";
import { AuthenticationApiClient } from "../../../core-logic/gateways/AuthenticationApi.client";

export class FakeAuthenticationApiClient implements AuthenticationApiClient {
  user: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Role;
    gender: Gender;
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
      role: this.user.role,
      gender: this.user.gender,
    };
    return authenticatedUser;
  }

  async validateSession(): Promise<AuthenticatedUser | null> {
    if (!this.user) return null;
    return {
      userId: "user-id",
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      role: this.user.role,
      gender: this.user.gender,
    };
  }

  async logout() {
    this.user = null;
  }

  setEligibleAuthUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: Role,
    gender: Gender,
  ) {
    this.user = { email, password, firstName, lastName, role, gender };
  }
}
