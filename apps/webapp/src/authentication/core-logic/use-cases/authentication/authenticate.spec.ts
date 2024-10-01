import { AppState } from "../../../../nomination-case/store/appState";
import { storeAuthenticationOnLoginSuccess } from "../../listeners/authentication.listeners";
import {
  ReduxStore,
  initReduxStore,
} from "../../../../nomination-case/store/reduxStore";
import { FakeAuthenticationGateway } from "../../../adapters/secondary/gateways/fakeAuthentication.gateway";
import { FakeAuthenticationStorageProvider } from "../../../adapters/secondary/providers/fakeAuthenticationStorage.provider";
import { authenticate } from "./authenticate";

describe("Authenticate", () => {
  let store: ReduxStore;
  let authenticationGateway: FakeAuthenticationGateway;
  let authenticationStorageProvider: FakeAuthenticationStorageProvider;
  let initialState: AppState;

  beforeEach(() => {
    authenticationGateway = new FakeAuthenticationGateway();
    authenticationStorageProvider = new FakeAuthenticationStorageProvider();
    store = initReduxStore(
      {
        authenticationGateway,
      },
      { authenticationStorageProvider },
      [storeAuthenticationOnLoginSuccess]
    );
    initialState = store.getState();
  });

  it("authenticates a user", async () => {
    authenticationGateway.setEligibleAuthUser("username", "password", true);
    await store.dispatch(
      authenticate({ username: "username", password: "password" })
    );
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      authentication: {
        ...initialState.authentication,
        authenticated: true,
      },
    });
  });

  it("persists the authentication state", async () => {
    authenticationGateway.setEligibleAuthUser("username", "password", true);

    store.dispatch(
      authenticate.fulfilled(true, "", {
        username: "username",
        password: "password",
      })
    );

    expect(authenticationStorageProvider.isAuthenticated()).toBe(true);
  });
});
