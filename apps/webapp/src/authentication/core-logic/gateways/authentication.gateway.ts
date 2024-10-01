export interface AuthenticationGateway {
  authenticate(username: string, password: string): Promise<boolean>;
}
