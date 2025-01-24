import { IndexedDbAuthenticationStorageProvider } from "./indexedDbAuthenticationStorage.provider";

declare const window: {
  storageProvider: IndexedDbAuthenticationStorageProvider;
};

export function IndexedDbAuthenticationStorageProviderForTest() {
  window.storageProvider = new IndexedDbAuthenticationStorageProvider();
  return null;
}
