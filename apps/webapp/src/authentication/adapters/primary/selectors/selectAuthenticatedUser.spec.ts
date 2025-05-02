import { Gender, Role } from "shared-models";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { AuthenticatedUserSM } from "../../../core-logic/gateways/Authentication.gateway";
import {
  authenticate,
  AuthenticateParams,
} from "../../../core-logic/use-cases/authentication/authenticate";
import { ApiAuthenticationGateway } from "../../secondary/gateways/ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "../../secondary/gateways/FakeAuthentication.client";
import { StubLoginNotifierProvider } from "../../secondary/providers/stubLoginNotifier.provider";
import { selectAuthenticatedUser } from "./selectAuthenticatedUser";

describe("Select Authenticated User", () => {
  it("should return empty user when store is not initialized", () => {
    const store = initReduxStore({}, {}, {});
    const user = selectAuthenticatedUser(store.getState());
    expect(user).toBeNull();
  });

  it("should return authenticated user when user is logged in", async () => {
    const user: AuthenticatedUserSM = {
      firstName: "John",
      lastName: "Doe",
      role: Role.MEMBRE_COMMUN,
      gender: Gender.M,
    };
    const userCredentials: AuthenticateParams = {
      email: "username",
      password: "password",
    };

    const apiClient = new FakeAuthenticationApiClient();
    apiClient.setEligibleAuthUser(
      userCredentials.email,
      userCredentials.password,
      user.firstName,
      user.lastName,
      user.role,
      user.gender,
    );

    const authenticationGateway = new ApiAuthenticationGateway(apiClient);
    const loginNotifierProvider = new StubLoginNotifierProvider();

    const store: ReduxStore = initReduxStore(
      {
        authenticationGateway,
      },
      {
        loginNotifierProvider,
      },
      {},
    );

    // Authenticate the user
    await store.dispatch(authenticate(userCredentials));

    const selectedUser = selectAuthenticatedUser(store.getState());
    expect(selectedUser).toEqual({
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      gender: user.gender,
    });
  });
});
