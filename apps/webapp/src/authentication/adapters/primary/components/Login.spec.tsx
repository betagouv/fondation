import { render, screen, waitFor } from "@testing-library/react";
import { Login } from "./Login";
import userEvent from "@testing-library/user-event";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { Provider } from "react-redux";
import { ApiAuthenticationGateway } from "../../secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../../secondary/gateways/FakeAuthentication.client";

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
      "username@example.fr",
      "password",
      "John",
      "Doe",
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
          user: {
            reporterName: "DOE John",
          },
        },
      });
    });
  });

  const submitLogin = async () => {
    await userEvent.type(screen.getByLabelText("Email"), "username@example.fr");
    await userEvent.type(screen.getByLabelText("Mot de passe"), "password");
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
