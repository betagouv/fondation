import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { ApiAuthenticationGateway } from "../authentication/adapters/secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../authentication/adapters/secondary/gateways/FakeAuthentication.client";
import { LocalStorageLogoutNotifierProvider } from "../authentication/adapters/secondary/providers/localStorageLogoutNotifier.provider";
import { AuthenticatedUserSM } from "../authentication/core-logic/gateways/Authentication.gateway";
import {
  authenticate,
  AuthenticateParams,
} from "../authentication/core-logic/use-cases/authentication/authenticate";
import { AppState } from "../store/appState";
import { initReduxStore, ReduxStore } from "../store/reduxStore";
import { AppHeader } from "./AppHeader";
import { expectUnauthenticatedStoreFactory } from "../test/authentication";
import { sleep } from "../shared-kernel/core-logic/sleep";

describe("Appheader Component", () => {
  let store: ReduxStore;
  let initialState: AppState;
  let authenticationGateway: ApiAuthenticationGateway;
  let apiClient: FakeAuthenticationApiClient;

  beforeEach(() => {
    localStorage.clear();

    apiClient = new FakeAuthenticationApiClient();
    authenticationGateway = new ApiAuthenticationGateway(apiClient);
    const logoutNotifierProvider = new LocalStorageLogoutNotifierProvider();

    store = initReduxStore(
      { authenticationGateway },
      {
        logoutNotifierProvider,
      },
      {},
    );
    initialState = store.getState();
  });

  it("informs the browser about a disconnected user", async () => {
    renderAppHeader();
    act(() => {
      givenAnAuthenticatedUser();
    });

    await userEvent.click(screen.getAllByText("Se déconnecter")[0]!);

    expectLocalStorageNotification();
    expectUnauthenticatedUser();

    await sleep(LocalStorageLogoutNotifierProvider.notificationDelay + 10);
    expectClearedLocalStorageItem();
  });

  const givenAnAuthenticatedUser = () => {
    store.dispatch(authenticate.fulfilled(user, "", userCredentials));
  };

  const expectUnauthenticatedUser = () =>
    expectUnauthenticatedStoreFactory(store, initialState);

  const expectLocalStorageNotification = () => {
    expect(
      localStorage.getItem(LocalStorageLogoutNotifierProvider.logoutKey),
    ).toEqual("true");
  };

  const expectClearedLocalStorageItem = () => {
    expect(
      localStorage.getItem(LocalStorageLogoutNotifierProvider.logoutKey),
    ).toBeNull();
  };

  const renderAppHeader = () => {
    render(
      <Provider store={store}>
        <AppHeader />
      </Provider>,
    );
  };
});

const user: AuthenticatedUserSM = {
  firstName: "John",
  lastName: "Doe",
};
const userCredentials: AuthenticateParams = {
  email: "user@example.fr",
  password: "password",
};
