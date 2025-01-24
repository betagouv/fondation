import { AuthenticatedUserSM } from "../../../core-logic/gateways/Authentication.gateway";
import { AuthenticationStorageProvider } from "../../../core-logic/providers/authenticationStorage.provider";

export class AuthenticationSessionStorageProvider
  implements AuthenticationStorageProvider
{
  async storeAuthentication(payload: AuthenticatedUserSM) {
    sessionStorage.setItem("authenticated", "true");
    if (payload) sessionStorage.setItem("user", JSON.stringify(payload));
  }
  async storeDisconnection() {
    sessionStorage.setItem("authenticated", "false");
  }
  async isAuthenticated() {
    return sessionStorage.getItem("authenticated") === "true";
  }
  async getUser() {
    return JSON.parse(sessionStorage.getItem("user") || "null");
  }
}
