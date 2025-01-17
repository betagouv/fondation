import { AuthenticatedUserSM } from "../gateways/Authentication.gateway";

export interface AuthenticationStorageProvider {
  storeAuthentication(payload: AuthenticatedUserSM): void;
  storeDisconnection(): void;
  isAuthenticated: () => boolean;
  getUser: () => AuthenticatedUserSM | null;
}
