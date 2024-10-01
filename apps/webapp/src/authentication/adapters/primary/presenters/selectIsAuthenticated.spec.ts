import {
  initReduxStore,
  ReduxStore,
} from "../../../../nomination-case/store/reduxStore";
import { authenticate } from "../../../core-logic/use-cases/authentication/authenticate";
import { FakeAuthenticationGateway } from "../../secondary/gateways/fakeAuthentication.gateway";
import { selectIsAuthenticated } from "./selectIsAuthenticated";

describe("Select Is Authenticated", () => {
  let store: ReduxStore;
  let authenticationGateway: FakeAuthenticationGateway;

  beforeEach(() => {
    authenticationGateway = new FakeAuthenticationGateway();
    store = initReduxStore({
      authenticationGateway,
    });
  });

  it("by defaut, user is anonymous", () => {
    expect(selectIsAuthenticated(store.getState())).toBe(false);
  });

  describe("Authenticated", () => {
    beforeEach(() => {
      store.dispatch(
        authenticate.fulfilled(true, "", {
          username: "username",
          password: "password",
        })
      );
    });

    it("selects an authenticated user", () => {
      expect(selectIsAuthenticated(store.getState())).toBe(true);
    });
  });
});
