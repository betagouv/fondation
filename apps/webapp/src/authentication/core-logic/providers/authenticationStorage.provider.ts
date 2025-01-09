import { AuthenticatedUser } from "../gateways/Authentication.gateway";

export interface AuthenticationStorageProvider {
  storeAuthentication(payload: AuthenticatedUser): void;
  storeDisconnection(): void;
  isAuthenticated: () => boolean;
  getUser: () => AuthenticatedUser;
}
