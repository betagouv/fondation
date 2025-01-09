import { AuthenticatedUser } from "../../../core-logic/gateways/Authentication.gateway";
import { AuthenticationStorageProvider } from "../../../core-logic/providers/authenticationStorage.provider";

export class AuthenticationSessionStorageProvider
  implements AuthenticationStorageProvider
{
  storeAuthentication(payload: AuthenticatedUser): void {
    sessionStorage.setItem("authenticated", "true");
    if (payload) sessionStorage.setItem("user", JSON.stringify(payload));
  }
  storeDisconnection(): void {
    sessionStorage.setItem("authenticated", "false");
  }
  isAuthenticated() {
    return sessionStorage.getItem("authenticated") === "true";
  }

  getUser(): AuthenticatedUser {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  }
}
