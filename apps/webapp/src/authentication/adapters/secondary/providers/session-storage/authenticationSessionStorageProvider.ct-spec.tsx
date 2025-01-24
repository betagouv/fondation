import { expect, MountResult, test } from "@playwright/experimental-ct-react";
import { AuthenticationStorageProvider } from "../../../../core-logic/providers/authenticationStorage.provider";
import { AuthenticationSessionStorageProviderForTest } from "./AuthenticationSessionStorageProvider.story";
import { AuthenticationSessionStorageProvider } from "./authenticationSessionStorage.provider";
import { AuthenticatedUserSM } from "../../../../core-logic/gateways/Authentication.gateway";
import { Mount } from "../../../../../test/playwright";

declare const window: {
  storageProvider: AuthenticationStorageProvider;
} & Window;

const userAuthenticated: AuthenticatedUserSM = {
  firstName: "John",
  lastName: "Doe",
};

test("should persist an authenticated user", async ({ mount }) => {
  const component = await mount(
    <AuthenticationSessionStorageProviderForTest />,
  );

  await storeAuthentication(component);

  await expectAuthenticated(component, true);
  await expectUser(component, userAuthenticated);
});

test("should removes authentication from store on disconnection", async ({
  mount,
}) => {
  const comp = await renderWithSessionStorage(mount);
  await givenAnAuthenticatedUser(comp);

  await storeDisconnection(comp);

  await expectAuthenticated(comp, false);
  await expectUser(comp, null);
});

const givenAnAuthenticatedUser = async (comp: MountResult) => {
  await comp.evaluate(
    (_, { userAuthenticated, authenticatedKey, userKey }) => {
      window.sessionStorage.setItem(authenticatedKey, "true");
      window.sessionStorage.setItem(userKey, JSON.stringify(userAuthenticated));
    },
    {
      userAuthenticated,
      authenticatedKey: AuthenticationSessionStorageProvider.authenticatedKey,
      userKey: AuthenticationSessionStorageProvider.userKey,
    },
  );
};

function renderWithSessionStorage(mount: Mount) {
  return mount(<AuthenticationSessionStorageProviderForTest />);
}

async function storeAuthentication(comp: MountResult) {
  await comp.evaluate(
    (_, userAuthenticated) =>
      window.storageProvider.storeAuthentication(userAuthenticated),
    userAuthenticated,
  );
}

async function storeDisconnection(comp: MountResult) {
  await comp.evaluate(() => window.storageProvider.storeDisconnection());
}

async function expectAuthenticated(
  comp: MountResult,
  expectedAuthenticated: boolean,
) {
  const authenticated = await comp.evaluate(() =>
    window.storageProvider.isAuthenticated(),
  );
  expect(authenticated).toBe(expectedAuthenticated);
}

async function expectUser(
  comp: MountResult,
  expectedUser: { firstName: string; lastName: string } | null,
) {
  const user = await comp.evaluate(() => window.storageProvider.getUser());
  expect(user).toEqual(expectedUser);
}
