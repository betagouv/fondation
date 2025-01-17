import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { AuthenticatedUserSM } from "../../../core-logic/gateways/Authentication.gateway";
import { AuthenticateParams } from "../../../core-logic/use-cases/authentication/authenticate";
import { ApiAuthenticationGateway } from "../../secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../../secondary/gateways/FakeAuthentication.client";
import { Login } from "./Login";

describe("Login Component", () => {
  let store: ReduxStore;
  let initialState: AppState;
  let authenticationGateway: ApiAuthenticationGateway;
  let apiClient: FakeAuthenticationApiClient;

  beforeEach(() => {
    apiClient = new FakeAuthenticationApiClient();
    authenticationGateway = new ApiAuthenticationGateway(apiClient);
    store = initReduxStore({ authenticationGateway }, {}, {});
    initialState = store.getState();
  });

  it("shows a login form", async () => {
    renderLogin();
    await screen.findByLabelText("Email");
    await screen.findByLabelText("Mot de passe");
  });

  it("authenticates a user", async () => {
    apiClient.setEligibleAuthUser(
      userCredentials.email,
      userCredentials.password,
      user.firstName,
      user.lastName,
    );

    renderLogin();
    await submitLogin();

    await waitFor(async () => {
      expect(store.getState()).not.toBe(initialState);
      expect(store.getState()).toEqual<AppState>({
        ...initialState,
        authentication: {
          ...initialState.authentication,
          authenticated: true,
          user,
        },
      });
    });
  });

  const submitLogin = async () => {
    await userEvent.type(screen.getByLabelText("Email"), userCredentials.email);
    await userEvent.type(
      screen.getByLabelText("Mot de passe"),
      userCredentials.password,
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
};
const userCredentials: AuthenticateParams = {
  email: "user@example.fr",
  password: "password",
};
