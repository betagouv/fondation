import { render, screen, waitFor } from "@testing-library/react";
import { Login } from "./Login";
import userEvent from "@testing-library/user-event";
import { AppState } from "../../../../store/appState";
import { ReduxStore, initReduxStore } from "../../../../store/reduxStore";
import { Provider } from "react-redux";
import { FakeAuthenticationGateway } from "../../secondary/gateways/fakeAuthentication.gateway";

describe("Login Component", () => {
  let store: ReduxStore;
  let initialState: AppState;
  let authenticationGateway: FakeAuthenticationGateway;

  beforeEach(() => {
    authenticationGateway = new FakeAuthenticationGateway();
    store = initReduxStore({ authenticationGateway }, {}, {});
    initialState = store.getState();
  });

  it("shows a login form", async () => {
    renderLogin();
    await screen.findByLabelText("Email");
    await screen.findByLabelText("Mot de passe");
  });

  it("authenticates a user", async () => {
    authenticationGateway.setEligibleAuthUser(
      "username@example.fr",
      "password",
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
