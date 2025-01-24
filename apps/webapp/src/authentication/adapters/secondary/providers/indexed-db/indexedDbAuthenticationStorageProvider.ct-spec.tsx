import { expect, MountResult, test } from "@playwright/experimental-ct-react";
import {
  logPlaywrightBrowser,
  Mount,
  Page,
} from "../../../../../test/playwright";
import { AuthenticatedUserSM } from "../../../../core-logic/gateways/Authentication.gateway";
import { IndexedDbAuthenticationStorageProviderForTest } from "./IndexedDbAuthenticationStorageProvider.story";
import { IndexedDbAuthenticationStorageProvider } from "./indexedDbAuthenticationStorage.provider";

declare const window: {
  storageProvider: IndexedDbAuthenticationStorageProvider;
} & Window;

const userAuthenticated: AuthenticatedUserSM = {
  firstName: "John",
  lastName: "Doe",
};

test("Indexed DB - should persist an authenticated user", async ({
  mount,
  page,
}) => {
  logPlaywrightBrowser(page);

  const component = await mount(
    <IndexedDbAuthenticationStorageProviderForTest />,
  );
  await storeAuthentication(component);

  await expectAuthenticated(component, true);
  await expectUser(component, userAuthenticated);
});

test("should remove authentication from store on disconnection", async ({
  mount,
}) => {
  const comp = await renderWithIndexedDbStorage(mount);
  await givenAnAuthenticatedUser(comp);

  await storeDisconnection(comp);

  await expectAuthenticated(comp, false);
  await expectUser(comp, null);
});

test("should return an authenticated state even if the store already exists", async ({
  mount,
  page,
}) => {
  logPlaywrightBrowser(page);
  await givenADatabaseWithStore(page);

  const comp = await renderWithIndexedDbStorage(mount);
  await givenAnAuthenticatedUser(comp);

  await expectAuthenticated(comp, true);
});

const givenAnAuthenticatedUser = async (comp: MountResult) => {
  await comp.evaluate(
    async (_, { userAuthenticated }) => {
      await window.storageProvider.storeAuthentication(userAuthenticated);
    },
    { userAuthenticated },
  );
};

async function givenADatabaseWithStore(page: Page) {
  await page.evaluate(
    async ({
      dbName,
      storeName,
      keyPath,
    }: {
      dbName: string;
      storeName: string;
      keyPath: string;
    }) => {
      const request = indexedDB.open(dbName, 1);

      return new Promise<void>((resolve, reject) => {
        const handleUpgradeNeeded = (event: IDBVersionChangeEvent): void => {
          const db = (event.target as IDBOpenDBRequest).result;
          const storeRequest = db.createObjectStore(storeName, { keyPath });

          storeRequest.transaction.oncomplete = () => {
            console.log("Store created");
            db.close();
            resolve();
          };
          storeRequest.transaction.onerror = (event) => {
            console.error("Store creation failed", event);
            reject(event);
          };

          console.log("DB created");
        };
        request.onupgradeneeded = handleUpgradeNeeded;
      });
    },
    {
      dbName: IndexedDbAuthenticationStorageProvider.dbName,
      storeName: IndexedDbAuthenticationStorageProvider.storeName,
      keyPath: IndexedDbAuthenticationStorageProvider.keyPath,
    },
  );
}

function renderWithIndexedDbStorage(mount: Mount) {
  return mount(<IndexedDbAuthenticationStorageProviderForTest />);
}

async function storeAuthentication(comp: MountResult) {
  await comp.evaluate(
    async (_, userAuthenticated) =>
      await window.storageProvider.storeAuthentication(userAuthenticated),
    userAuthenticated,
  );
}

async function storeDisconnection(comp: MountResult) {
  await comp.evaluate(
    async () => await window.storageProvider.storeDisconnection(),
  );
}

async function expectAuthenticated(
  comp: MountResult,
  expectedAuthenticated: boolean,
) {
  const authenticated = await comp.evaluate(async () =>
    window.storageProvider.isAuthenticated(),
  );
  expect(authenticated).toBe(expectedAuthenticated);
}

async function expectUser(
  comp: MountResult,
  expectedUser: { firstName: string; lastName: string } | null,
) {
  const user = await comp.evaluate(
    async () => await window.storageProvider.getUser(),
  );
  expect(user).toEqual(expectedUser);
}
