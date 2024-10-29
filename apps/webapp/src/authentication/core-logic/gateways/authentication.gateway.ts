export type AuthenticatedUser = {
  reporterName: string;
};

export interface AuthenticationGateway {
  getCurrentUser(): AuthenticatedUser | null;
  logout(): Promise<void>;
  authenticate(username: string, password: string): Promise<boolean>;
}
