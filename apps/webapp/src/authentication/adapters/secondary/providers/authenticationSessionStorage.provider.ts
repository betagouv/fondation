import { AuthenticatedUserSM } from "../../../core-logic/gateways/Authentication.gateway";
import { AuthenticationStorageProvider } from "../../../core-logic/providers/authenticationStorage.provider";

export class AuthenticationSessionStorageProvider
  implements AuthenticationStorageProvider
{
  storeAuthentication(payload: AuthenticatedUserSM): void {
    sessionStorage.setItem("authenticated", "true");
    if (payload) sessionStorage.setItem("user", JSON.stringify(payload));
  }
  storeDisconnection(): void {
    sessionStorage.setItem("authenticated", "false");
  }
  isAuthenticated() {
    return sessionStorage.getItem("authenticated") === "true";
  }

  getUser(): AuthenticatedUserSM {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  }
}
