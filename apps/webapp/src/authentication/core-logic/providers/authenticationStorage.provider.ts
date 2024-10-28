export interface AuthenticationStorageProvider {
  storeAuthentication(payload: boolean): void;
  storeDisconnection(): void;
  isAuthenticated: () => boolean;
}
