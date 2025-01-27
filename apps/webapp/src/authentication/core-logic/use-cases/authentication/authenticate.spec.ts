import { sleep } from "../../../../shared-kernel/core-logic/sleep";
import { AppState } from "../../../../store/appState";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { ApiAuthenticationGateway } from "../../../adapters/secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../../../adapters/secondary/gateways/FakeAuthentication.client";
import { FakeAuthenticationStorageProvider } from "../../../adapters/secondary/providers/fakeAuthenticationStorage.provider";
import { LocalStorageLoginNotifierProvider } from "../../../adapters/secondary/providers/localStorageLoginNotifier.provider";
import { StubLoginNotifierProvider } from "../../../adapters/secondary/providers/stubLoginNotifier.provider";
import { AuthenticatedUserSM } from "../../gateways/Authentication.gateway";
import { storeAuthenticationOnLoginSuccess } from "../../listeners/authentication.listeners";
import { LoginNotifierProvider } from "../../providers/loginNotifier.provider";
import { authenticate, AuthenticateParams } from "./authenticate";

describe("Authenticate", () => {
  let store: ReduxStore;
  let authenticationGateway: ApiAuthenticationGateway;
  let authenticationStorageProvider: FakeAuthenticationStorageProvider;
  let initialState: AppState;
  let apiClient: FakeAuthenticationApiClient;
  let loginNotifierProvider: StubLoginNotifierProvider;

  beforeEach(() => {
    localStorage.clear();

    apiClient = new FakeAuthenticationApiClient();
    apiClient.setEligibleAuthUser(
      userCredentials.email,
      userCredentials.password,
      user.firstName,
      user.lastName,
    );

    authenticationGateway = new ApiAuthenticationGateway(apiClient);
    authenticationStorageProvider = new FakeAuthenticationStorageProvider();
    loginNotifierProvider = new StubLoginNotifierProvider();

    store = initReduxStore(
      {
        authenticationGateway,
      },
      { authenticationStorageProvider, loginNotifierProvider },
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
    expect(await authenticationStorageProvider.isAuthenticated()).toBe(true);
  });

  it("informs the browser about a logged-in user", async () => {
    await store.dispatch(authenticate(userCredentials));
    expect(loginNotifierProvider.hasNotified).toBe(true);
  });
});

describe("Authenticate with local storage provider", () => {
  let store: ReduxStore;
  let authenticationGateway: ApiAuthenticationGateway;
  let authenticationStorageProvider: FakeAuthenticationStorageProvider;
  let apiClient: FakeAuthenticationApiClient;
  let loginNotifierProvider: LoginNotifierProvider;

  beforeEach(() => {
    localStorage.clear();

    apiClient = new FakeAuthenticationApiClient();
    apiClient.setEligibleAuthUser(
      userCredentials.email,
      userCredentials.password,
      user.firstName,
      user.lastName,
    );

    authenticationGateway = new ApiAuthenticationGateway(apiClient);
    authenticationStorageProvider = new FakeAuthenticationStorageProvider();
    loginNotifierProvider = new LocalStorageLoginNotifierProvider();

    store = initReduxStore(
      {
        authenticationGateway,
      },
      { authenticationStorageProvider, loginNotifierProvider },
      {},
      { storeAuthenticationOnLoginSuccess },
    );
  });

  it("informs the browser about a logged-in user", async () => {
    await store.dispatch(authenticate(userCredentials));

    expectLocalStorageNotification();

    await sleep(LocalStorageLoginNotifierProvider.notificationDelay + 10);
    expectClearedLocalStorageItem();
  });

  const expectLocalStorageNotification = () => {
    expect(
      localStorage.getItem(LocalStorageLoginNotifierProvider.loginKey),
    ).toEqual("true");
  };

  const expectClearedLocalStorageItem = () => {
    expect(
      localStorage.getItem(LocalStorageLoginNotifierProvider.loginKey),
    ).toBeNull();
  };
});

const user: AuthenticatedUserSM = {
  firstName: "John",
  lastName: "Doe",
};
const userCredentials: AuthenticateParams = {
  email: "username",
  password: "password",
};
