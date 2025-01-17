import { AppState } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ApiAuthenticationGateway } from "../../../adapters/secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../../../adapters/secondary/gateways/FakeAuthentication.client";
import { FakeAuthenticationStorageProvider } from "../../../adapters/secondary/providers/fakeAuthenticationStorage.provider";
import { AuthenticatedUserSM } from "../../gateways/Authentication.gateway";
import { storeAuthenticationOnLoginSuccess } from "../../listeners/authentication.listeners";
import { authenticate, AuthenticateParams } from "./authenticate";

describe("Authenticate", () => {
  let store: ReduxStore;
  let authenticationGateway: ApiAuthenticationGateway;
  let authenticationStorageProvider: FakeAuthenticationStorageProvider;
  let initialState: AppState;
  let apiClient: FakeAuthenticationApiClient;

  beforeEach(() => {
    apiClient = new FakeAuthenticationApiClient();
    apiClient.setEligibleAuthUser(
      userCredentials.email,
      userCredentials.password,
      user.firstName,
      user.lastName,
    );

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
    await store.dispatch(authenticate(userCredentials));
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      authentication: {
        ...initialState.authentication,
        authenticated: true,
        user,
      },
    });
  });

  it("persists the authenticated state", async () => {
    store.dispatch(authenticate.fulfilled(user, "", userCredentials));

    expect(authenticationStorageProvider.isAuthenticated()).toBe(true);
  });
});

const user: AuthenticatedUserSM = {
  firstName: "John",
  lastName: "Doe",
};
const userCredentials: AuthenticateParams = {
  email: "username",
  password: "password",
};
