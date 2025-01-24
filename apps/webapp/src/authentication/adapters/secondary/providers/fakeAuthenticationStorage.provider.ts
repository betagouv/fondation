import { AuthenticatedUserSM } from "../../../core-logic/gateways/Authentication.gateway";
import { AuthenticationStorageProvider } from "../../../core-logic/providers/authenticationStorage.provider";

export class FakeAuthenticationStorageProvider
  implements AuthenticationStorageProvider
{
  _isAuthenticated: boolean = false;
  _user: AuthenticatedUserSM | null = null;

  async storeAuthentication(payload: AuthenticatedUserSM) {
    this._isAuthenticated = true;
    this._user = payload;
  }
  async storeDisconnection() {
    this._isAuthenticated = false;
    this._user = null;
  }
  async isAuthenticated() {
    return this._isAuthenticated;
  }
  async getUser() {
    return this._user;
  }
  isReady() {
    return true;
  }
}
