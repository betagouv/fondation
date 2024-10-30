export type AuthenticatedUser = {
  reporterName: string;
} | null;

export interface AuthenticationGateway {
  logout(): Promise<void>;
  authenticate(username: string, password: string): Promise<AuthenticatedUser>;
}
