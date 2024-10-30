export interface AuthenticationStorageProvider {
  storeAuthentication(payload: { reporterName: string } | null): void;
  storeDisconnection(): void;
  isAuthenticated: () => boolean;
  getUser: () => { reporterName: string } | null;
}
