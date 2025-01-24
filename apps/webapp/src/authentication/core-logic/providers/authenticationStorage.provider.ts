import { AuthenticatedUserSM } from "../gateways/Authentication.gateway";

export interface AuthenticationStorageProvider {
  storeAuthentication(payload: AuthenticatedUserSM): Promise<void>;
  storeDisconnection(): Promise<void>;
  isAuthenticated: () => Promise<boolean>;
  getUser: () => Promise<AuthenticatedUserSM | null>;
}
