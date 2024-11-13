import { AppState } from "../../../../reports/store/appState";
import {
  ReduxStore,
  initReduxStore,
} from "../../../../reports/store/reduxStore";
import { FakeAuthenticationGateway } from "../../../adapters/secondary/gateways/fakeAuthentication.gateway";
import { FakeAuthenticationStorageProvider } from "../../../adapters/secondary/providers/fakeAuthenticationStorage.provider";
import { storeDisconnectionOnLogout } from "../../listeners/logout.listeners";
import { logout } from "./logout";

describe("Authenticate", () => {
  let store: ReduxStore;
  let authenticationGateway: FakeAuthenticationGateway;
  let authenticationStorageProvider: FakeAuthenticationStorageProvider;
  let initialState: AppState;

  beforeEach(() => {
    authenticationGateway = new FakeAuthenticationGateway();
    authenticationGateway.setEligibleAuthUser("username", "password");

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
