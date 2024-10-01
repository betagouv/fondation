import { AuthenticationStorageProvider } from "../../../core-logic/providers/authenticationStorage.provider";

export class AuthenticationSessionStorageProvider
  implements AuthenticationStorageProvider
{
  storeAuthentication(payload: boolean): void {
    sessionStorage.setItem("authenticated", payload.toString());
  }
  isAuthenticated() {
    return sessionStorage.getItem("authenticated") === "true";
  }
}
