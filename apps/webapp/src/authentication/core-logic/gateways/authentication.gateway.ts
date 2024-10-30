export type AuthenticatedUser = {
  reporterName: string;
};

export interface AuthenticationGateway {
  logout(): Promise<void>;
  authenticate(
    username: string,
    password: string,
  ): Promise<{ reporterName: string } | null>;
}
