export type AuthenticatedUserSM = {
  firstName: string;
  lastName: string;
};

export interface AuthenticationGateway {
  authenticate(
    username: string,
    password: string,
  ): Promise<AuthenticatedUserSM>;
  logout(): Promise<void>;
}
