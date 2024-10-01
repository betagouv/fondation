export interface AuthenticationStorageProvider {
  storeAuthentication(payload: boolean): void;
  isAuthenticated: () => boolean;
}
