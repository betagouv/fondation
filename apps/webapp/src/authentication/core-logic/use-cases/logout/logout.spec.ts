import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { ApiAuthenticationGateway } from "../../../adapters/secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../../../adapters/secondary/gateways/FakeAuthentication.client";
import { FakeAuthenticationStorageProvider } from "../../../adapters/secondary/providers/fakeAuthenticationStorage.provider";
import { storeDisconnectionOnLogout } from "../../listeners/logout.listeners";
import { logout } from "./logout";

describe("Logout", () => {
  let store: ReduxStore;
  let authenticationGateway: ApiAuthenticationGateway;
  let authenticationStorageProvider: FakeAuthenticationStorageProvider;
  let initialState: AppState;
  let apiClient: FakeAuthenticationApiClient;

  beforeEach(() => {
    apiClient = new FakeAuthenticationApiClient();
    apiClient.setEligibleAuthUser("username", "password", "John", "Doe");

    authenticationGateway = new ApiAuthenticationGateway(apiClient);
    authenticationStorageProvider = new FakeAuthenticationStorageProvider();

    store = initReduxStore(
      {
        authenticationGateway,
      },
      { authenticationStorageProvider },
      {},
      { storeDisconnectionOnLogout },
    );
    initialState = store.getState();
  });

  it("disconnects a user", async () => {
    await store.dispatch(logout());
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      authentication: {
        ...initialState.authentication,
        authenticated: false,
      },
    });
  });

  it("persists the disconnection", async () => {
    authenticationStorageProvider._isAuthenticated = true;

    store.dispatch(logout.fulfilled(undefined, "", undefined));

    expect(authenticationStorageProvider.isAuthenticated()).toBe(false);
  });
});
