import { AuthenticationStorageProvider } from "../../../core-logic/providers/authenticationStorage.provider";

export class FakeAuthenticationStorageProvider
  implements AuthenticationStorageProvider
{
  _isAuthenticated: boolean = false;
  _user: { reporterName: string } | null = null;

  storeAuthentication(payload: { reporterName: string } | null): void {
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
  getUser(): { reporterName: string } | null {
    return this._user;
  }
}
