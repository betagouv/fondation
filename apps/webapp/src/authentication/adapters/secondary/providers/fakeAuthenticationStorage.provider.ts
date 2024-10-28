import { AuthenticationStorageProvider } from "../../../core-logic/providers/authenticationStorage.provider";

export class FakeAuthenticationStorageProvider
  implements AuthenticationStorageProvider
{
  _isAuthenticated: boolean = false;

  storeAuthentication(payload: boolean): void {
    this._isAuthenticated = payload;
  }
  storeDisconnection(): void {
    this.storeAuthentication(false);
  }

  isAuthenticated() {
    return this._isAuthenticated;
  }
}
