import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { Gender, Role } from "shared-models";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import {
  ExpectAuthenticatedUser,
  expectAuthenticatedUserFactory,
} from "../../../../test/authentication";
import { AuthenticatedUserSM } from "../../../core-logic/gateways/Authentication.gateway";
import { AuthenticateParams } from "../../../core-logic/use-cases/authentication/authenticate";
import { ApiAuthenticationGateway } from "../../secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../../secondary/gateways/FakeAuthentication.client";
import { LocalStorageLoginNotifierProvider } from "../../secondary/providers/localStorageLoginNotifier.provider";
import { Login } from "./Login";

describe("Login Component", () => {
  let store: ReduxStore;
  let initialState: AppState<true>;
  let authenticationGateway: ApiAuthenticationGateway;
  let apiClient: FakeAuthenticationApiClient;
  let loginNotifierProvider: LocalStorageLoginNotifierProvider;
  let expectAuthenticatedUser: ExpectAuthenticatedUser;

  beforeEach(() => {
    apiClient = new FakeAuthenticationApiClient();
    authenticationGateway = new ApiAuthenticationGateway(apiClient);
    loginNotifierProvider = new LocalStorageLoginNotifierProvider();

    store = initReduxStore(
      { authenticationGateway },
      { loginNotifierProvider },
      {},
    );
    initialState = store.getState();

    expectAuthenticatedUser = expectAuthenticatedUserFactory(
      store,
      initialState,
    );
  });

  it("shows a login form", async () => {
    renderLogin();
    await screen.findByLabelText("Email");
    await screen.findByLabelText("Mot de passe");
  });

  it("doesn't show an alert message by default", async () => {
    renderLogin();
    await expect(screen.findByText("Échec de la connexion")).rejects.toThrow();
  });

  describe("Given an allowed user", () => {
    beforeEach(() => {
      apiClient.setEligibleAuthUser(
        userCredentials.email,
        userCredentials.password,
        user.firstName,
        user.lastName,
        user.role,
        user.gender,
      );
    });

    it("authenticates a user", async () => {
      renderLogin();
      await submitLogin();
      expectAuthenticatedUser(user);
    });

    it("shows an alert message when authentication fails", async () => {
      renderLogin();
      await submitLogin({ ...userCredentials, password: "wrong-password" });
      screen.getByText("Échec de la connexion");
    });
  });

  const submitLogin = async (credentials = userCredentials) => {
    await userEvent.type(screen.getByLabelText("Email"), credentials.email);
    await userEvent.type(
      screen.getByLabelText("Mot de passe"),
      credentials.password,
    );
    await userEvent.click(screen.getByRole("button"));
  };

  const renderLogin = () => {
    render(
      <Provider store={store}>
        <Login />
      </Provider>,
    );
  };
});

const user: AuthenticatedUserSM = {
  firstName: "John",
  lastName: "Doe",
  role: Role.MEMBRE_COMMUN,
  gender: Gender.M,
};
const userCredentials: AuthenticateParams = {
  email: "user@example.fr",
  password: "password",
};
