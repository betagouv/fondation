import { AuthenticatedUser } from "../../../core-logic/gateways/authentication.gateway";
import { AuthenticationStorageProvider } from "../../../core-logic/providers/authenticationStorage.provider";

export class FakeAuthenticationStorageProvider
  implements AuthenticationStorageProvider
{
  _isAuthenticated: boolean = false;
  _user: AuthenticatedUser = null;

  storeAuthentication(payload: AuthenticatedUser): void {
    this._isAuthenticated = true;
    this._user = payload;
  }
  storeDisconnection(): void {
    this._isAuthenticated = false;
    this._user = null;
  }
  isAuthenticated() {
    return this._isAuthenticated;
  }

  getUser(): AuthenticatedUser {
    return this._user;
  }
}
