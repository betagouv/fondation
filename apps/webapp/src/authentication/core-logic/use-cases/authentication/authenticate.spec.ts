import { AppState } from "../../../../store/appState";
import { storeAuthenticationOnLoginSuccess } from "../../listeners/authentication.listeners";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { ApiAuthenticationGateway } from "../../../adapters/secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../../../adapters/secondary/gateways/FakeAuthentication.client";
import { FakeAuthenticationStorageProvider } from "../../../adapters/secondary/providers/fakeAuthenticationStorage.provider";
import { authenticate } from "./authenticate";

describe("Authenticate", () => {
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
      { storeAuthenticationOnLoginSuccess },
    );
    initialState = store.getState();
  });

  it("authenticates a user", async () => {
    await store.dispatch(
      authenticate({ email: "username", password: "password" }),
    );
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      authentication: {
        ...initialState.authentication,
        authenticated: true,
        user: {
          reporterName: "DOE John",
        },
      },
    });
  });

  it("persists the authenticated state", async () => {
    store.dispatch(
      authenticate.fulfilled(null, "", {
        email: "username",
        password: "password",
      }),
    );

    expect(authenticationStorageProvider.isAuthenticated()).toBe(true);
  });
});
