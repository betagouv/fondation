import { AuthenticationStorageProvider } from "../../../core-logic/providers/authenticationStorage.provider";

export class AuthenticationSessionStorageProvider
  implements AuthenticationStorageProvider
{
  storeAuthentication(payload: boolean): void {
    sessionStorage.setItem("authenticated", payload.toString());
  }
  storeDisconnection(): void {
    this.storeAuthentication(false);
  }

  isAuthenticated() {
    return sessionStorage.getItem("authenticated") === "true";
  }
}
