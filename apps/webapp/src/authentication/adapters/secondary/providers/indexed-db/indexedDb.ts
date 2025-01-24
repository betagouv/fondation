export class IndexedDb {
  static readonly authenticatedKey = "authenticated";
  static readonly userKey = "user";
  static readonly dbName = "fondation";
  static readonly storeName = "authentication";
  static readonly keyPath = "key";
  protected db: IDBDatabase | null = null;

  constructor() {
    if (!IndexedDb.browserSupportsIndexedDB()) {
      console.warn("Your browser doesn't support IndexedDB.");
      return;
    }

    if (!this.db) this.initDB();
  }

  protected guardDB(db: IDBDatabase | null): asserts db is IDBDatabase {
    if (!db) throw new Error("DB not initialized");
  }

  protected getRequest(key: string) {
    return this.requesToPromiseValue(
      this.storeFromTransaction("readonly").get(key),
    );
  }

  protected storeFromTransaction(
    mode: Extract<IDBTransactionMode, "readonly" | "readwrite">,
  ) {
    this.guardDB(this.db);

    return this.db
      .transaction(IndexedDb.storeName, mode)
      .objectStore(IndexedDb.storeName);
  }

  protected async requesToPromiseValue(request: IDBRequest) {
    const result = await this.requestToPromise(request);
    return result?.value;
  }

  protected requestToPromise(
    request: IDBRequest,
  ): Promise<IDBRequest["result"]> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async initDB() {
    const request = indexedDB.open(IndexedDb.dbName, 1);
    this.db = await this.requestDbToPromise(request);
    console.debug("DB initialized");
  }

  private async requestDbToPromise(
    request: IDBOpenDBRequest,
  ): Promise<IDBOpenDBRequest["result"]> {
    return new Promise((resolve, reject) => {
      request.onupgradeneeded = async (event) => {
        const db = this.eventToDb(event);
        await this.createStore(db);
        return resolve(db);
      };
      request.onsuccess = (event) => {
        const db = this.eventToDb(event);
        return resolve(db);
      };
      request.onerror = () => {
        console.error("Error opening DB", request.error);
        return reject(request.error);
      };
    });
  }

  private eventToDb(event: Event) {
    return (event.target as IDBOpenDBRequest).result;
  }

  private async createStore(db: IDBDatabase) {
    try {
      const request = db.createObjectStore(IndexedDb.storeName, {
        keyPath: IndexedDb.keyPath,
      });
      return this.transactionToPromise(request.transaction);
    } catch (error) {
      console.error("Store creation failed", error);
      throw error;
    }
  }

  private transactionToPromise(request: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      request.oncomplete = () => {
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  static browserSupportsIndexedDB() {
    return !!indexedDB;
  }
}
