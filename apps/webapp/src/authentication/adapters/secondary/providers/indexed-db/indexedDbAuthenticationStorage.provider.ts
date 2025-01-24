import { AuthenticatedUserSM } from "../../../../core-logic/gateways/Authentication.gateway";
import { AuthenticationStorageProvider } from "../../../../core-logic/providers/authenticationStorage.provider";
import { IndexedDb } from "./indexedDb";

export class IndexedDbAuthenticationStorageProvider
  extends IndexedDb
  implements AuthenticationStorageProvider
{
  isReady() {
    return !!this.db;
  }

  async storeAuthentication(payload: AuthenticatedUserSM): Promise<void> {
    this.guardDB(this.db);

    const store = this.storeFromTransaction("readwrite");

    const requestAuthenticated = store.put({
      key: IndexedDb.authenticatedKey,
      value: "true",
    });
    const requestUser = store.put({
      key: IndexedDb.userKey,
      value: JSON.stringify(payload),
    });

    await Promise.all([
      this.requestToPromise(requestAuthenticated),
      this.requestToPromise(requestUser),
    ]);
  }

  async storeDisconnection() {
    this.guardDB(this.db);

    const store = this.storeFromTransaction("readwrite");

    const authenticatedRequest = store.put({
      key: IndexedDb.authenticatedKey,
      value: "false",
    });
    const userRequest = store.delete(IndexedDb.userKey);

    await Promise.all([
      this.requestToPromise(authenticatedRequest),
      this.requestToPromise(userRequest),
    ]);
  }

  async isAuthenticated() {
    this.guardDB(this.db);

    const value = await this.getRequest(IndexedDb.authenticatedKey);

    return value === "true";
  }

  async getUser() {
    this.guardDB(this.db);

    const value = await this.getRequest(IndexedDb.userKey);

    return value ? JSON.parse(value) : null;
  }
}
