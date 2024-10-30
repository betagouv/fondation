import { AuthenticatedUser } from "../gateways/authentication.gateway";

export interface AuthenticationStorageProvider {
  storeAuthentication(payload: AuthenticatedUser): void;
  storeDisconnection(): void;
  isAuthenticated: () => boolean;
  getUser: () => AuthenticatedUser;
}
