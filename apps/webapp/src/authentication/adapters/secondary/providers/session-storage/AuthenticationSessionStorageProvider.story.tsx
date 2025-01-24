import { AuthenticationSessionStorageProvider } from "./authenticationSessionStorage.provider";

declare const window: {
  storageProvider: AuthenticationSessionStorageProvider;
};

export function AuthenticationSessionStorageProviderForTest() {
  window.storageProvider = new AuthenticationSessionStorageProvider();
  return null;
}
