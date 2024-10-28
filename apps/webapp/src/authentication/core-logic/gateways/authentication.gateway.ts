export interface AuthenticationGateway {
  logout(): Promise<void>;
  authenticate(username: string, password: string): Promise<boolean>;
}
