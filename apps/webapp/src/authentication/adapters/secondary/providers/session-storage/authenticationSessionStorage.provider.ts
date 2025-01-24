import { AuthenticatedUserSM } from "../../../../core-logic/gateways/Authentication.gateway";
import { AuthenticationStorageProvider } from "../../../../core-logic/providers/authenticationStorage.provider";

export class AuthenticationSessionStorageProvider
  implements AuthenticationStorageProvider
{
  static authenticatedKey = "authenticated";
  static userKey = "user";

  private setAuthenticated(value: string) {
    sessionStorage.setItem(
      AuthenticationSessionStorageProvider.authenticatedKey,
      value,
    );
  }

  async storeAuthentication(payload: AuthenticatedUserSM) {
    this.setAuthenticated("true");
    this.setUser(payload);
  }

  async storeDisconnection() {
    this.setAuthenticated("false");
    this.removeUser();
  }

  async isAuthenticated() {
    return this.getAuthenticatedItem() === "true";
  }

  async getUser() {
    return JSON.parse(this.getUserItem() || "null");
  }

  isReady() {
    return sessionStorage !== null;
  }

  private setUser(payload: AuthenticatedUserSM) {
    sessionStorage.setItem(
      AuthenticationSessionStorageProvider.userKey,
      JSON.stringify(payload),
    );
  }

  private removeUser() {
    sessionStorage.removeItem(AuthenticationSessionStorageProvider.userKey);
  }

  private getAuthenticatedItem() {
    return sessionStorage.getItem(
      AuthenticationSessionStorageProvider.authenticatedKey,
    );
  }

  private getUserItem() {
    return sessionStorage.getItem(AuthenticationSessionStorageProvider.userKey);
  }
}
