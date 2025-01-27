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
  let loginNotifierProvider: LoginNotifierProvider;

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
  });

  describe("With fake storage provider", () => {
    beforeEach(() => {
      loginNotifierProvider = new StubLoginNotifierProvider();
      initStore();
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
      expect(
        (loginNotifierProvider as StubLoginNotifierProvider).hasNotified,
      ).toBe(true);
    });
  });

  describe("With local storage provider", () => {
    beforeEach(() => {
      localStorage.clear();
      loginNotifierProvider = new LocalStorageLoginNotifierProvider();
      initStore();
    });

    afterAll(() => localStorage.clear());

    it("informs the browser about a logged-in user", async () => {
      await store.dispatch(authenticate(userCredentials));

      expectLocalStorageNotification();
      await expectEndOfLocalStorageNotification();
    });

    const expectLocalStorageNotification = () => {
      expect(
        localStorage.getItem(LocalStorageLoginNotifierProvider.loginKey),
      ).toEqual("true");
    };

    const expectEndOfLocalStorageNotification = async () => {
      await sleep(LocalStorageLoginNotifierProvider.notificationDelay + 10);
      expect(
        localStorage.getItem(LocalStorageLoginNotifierProvider.loginKey),
      ).toBeNull();
    };
  });

  const initStore = () => {
    store = initReduxStore(
      {
        authenticationGateway,
      },
      { authenticationStorageProvider, loginNotifierProvider },
      {},
      { storeAuthenticationOnLoginSuccess },
    );
    initialState = store.getState();
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
