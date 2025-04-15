import { Role } from "shared-models";

export type AuthenticatedUserSM = {
  firstName: string;
  lastName: string;
  role: Role;
};

export interface AuthenticationGateway {
  authenticate(
    username: string,
    password: string,
  ): Promise<AuthenticatedUserSM>;
  validateSession(): Promise<AuthenticatedUserSM | null>;
  logout(): Promise<void>;
}
