import { AppState } from "../../../../nomination-case/store/appState";
import {
  ReduxStore,
  initReduxStore,
} from "../../../../nomination-case/store/reduxStore";
import { FakeAuthenticationGateway } from "../../../adapters/secondary/gateways/fakeAuthentication.gateway";
import { authenticate } from "./authenticate";

describe("Authenticate", () => {
  let store: ReduxStore;
  let authenticationGateway: FakeAuthenticationGateway;
  let initialState: AppState;

  beforeEach(() => {
    authenticationGateway = new FakeAuthenticationGateway();
    store = initReduxStore({
      authenticationGateway,
    });
    initialState = store.getState();
  });

  it("authenticates a user", async () => {
    authenticationGateway.setEligibleAuthUser("username", "password", true);
    await store.dispatch(
      authenticate({ username: "username", password: "password" })
    );
    expect(store.getState()).toEqual<AppState>({
      ...initialState,
      authentication: {
        authenticated: true,
      },
    });
  });
});
