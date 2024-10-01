import { AuthenticationStorageProvider } from "../../../core-logic/providers/authenticationStorage.provider";

export class AuthenticationSessionStorageProvider
  implements AuthenticationStorageProvider
{
  isAuthenticated() {
    return sessionStorage.getItem("authenticated") === "true";
  }
}
