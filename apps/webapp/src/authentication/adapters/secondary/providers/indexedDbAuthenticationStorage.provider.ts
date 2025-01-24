import { AuthenticatedUserSM } from "../../../core-logic/gateways/Authentication.gateway";
import { AuthenticationStorageProvider } from "../../../core-logic/providers/authenticationStorage.provider";

export class IndexedDbAuthenticationStorageProvider
  implements AuthenticationStorageProvider
{
  private readonly dbName = "fondation";
  private readonly storeName = "authentication";
  private db: IDBDatabase | null = null;

  constructor() {
    if (!IndexedDbAuthenticationStorageProvider.browserSupportsIndexedDB()) {
      console.warn("Your browser doesn't support IndexedDB.");
      return;
    }

    this.initDB();
  }

  private async initDB() {
    const request = indexedDB.open(this.dbName, 1);
    this.db = await this.requestDbToPromise(request);
  }

  async storeAuthentication(payload: AuthenticatedUserSM): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction(this.storeName, "readwrite");
    const store = transaction.objectStore(this.storeName);
    const requestAuthenticated = store.put({
      key: "authenticated",
      value: "true",
    });
    const requestUser = store.put({
      key: "user",
      value: JSON.stringify(payload),
    });

    await this.requestToPromise(requestAuthenticated);
    await this.requestToPromise(requestUser);
  }

  async storeDisconnection() {
    if (!this.db) return;

    const transaction = this.db.transaction(this.storeName, "readwrite");
    const store = transaction.objectStore(this.storeName);
    store.put({ key: "authenticated", value: "false" });
    const request = store.delete("user");

    await this.requestToPromise(request);
  }

  async isAuthenticated() {
    if (!this.db) return false;

    const transaction = this.db.transaction(this.storeName, "readonly");
    const store = transaction.objectStore(this.storeName);
    const request = store.get("authenticated");
    const value = await this.requesToPromiseValue(request);

    return value === "true";
  }

  async getUser() {
    if (!this.db) {
      return null;
    }

    const transaction = this.db.transaction(this.storeName, "readonly");
    const store = transaction.objectStore(this.storeName);
    const request = store.get("user");
    const value = await this.requesToPromiseValue(request);

    return value ? JSON.parse(value) : null;
  }

  private requestDbToPromise(
    request: IDBRequest,
  ): Promise<IDBOpenDBRequest["result"]> {
    return new Promise((resolve, reject) => {
      request.onsuccess = (event) =>
        resolve((event.target as IDBOpenDBRequest).result);
      request.onerror = () => reject(request.error);
    });
  }

  private async requesToPromiseValue(request: IDBRequest) {
    const result = await this.requestToPromise(request);
    return result?.value;
  }

  private requestToPromise(request: IDBRequest): Promise<IDBRequest["result"]> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  static browserSupportsIndexedDB() {
    return !!indexedDB;
  }
}
