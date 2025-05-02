import { Gender, Role } from "shared-models";
import { initReduxStore, ReduxStore } from "../../../../store/reduxStore";
import { AuthenticatedUserSM } from "../../../core-logic/gateways/Authentication.gateway";
import {
  authenticate,
  AuthenticateParams,
} from "../../../core-logic/use-cases/authentication/authenticate";
import { selectAuthenticationFailed } from "./selectAuthenticationFailed";

describe("Select Authentication Failed", () => {
  let store: ReduxStore;
  let isFailed: boolean;

  beforeEach(() => {
    store = initReduxStore({}, {}, {});
  });

  it("selects the authentication failed state", () => {
    selectIsFailed();
    expectIsFailed(false);
  });

  it("selects a failed authentication", () => {
    dispatchRejectedAuthentication();
    selectIsFailed();
    expectIsFailed(true);
  });

  it("when authentication is pending, it says the authentication isn't failed", () => {
    dispatchPendingAuthentication();
    selectIsFailed();
    expectIsFailed(false);
  });

  it("when authentication is fulfilled, it says the authentication isn't failed", () => {
    dispatchFulfilledAuthentication();
    selectIsFailed();
    expectIsFailed(false);
  });

  const dispatchPendingAuthentication = () =>
    store.dispatch(authenticate.pending("", userCredentials));

  const dispatchFulfilledAuthentication = () =>
    store.dispatch(authenticate.fulfilled(user, "", userCredentials));

  const dispatchRejectedAuthentication = () =>
    store.dispatch(authenticate.rejected(new Error(), "", userCredentials));

  const selectIsFailed = () => {
    isFailed = selectAuthenticationFailed(store.getState());
  };

  const expectIsFailed = (expected: boolean) => expect(isFailed).toBe(expected);
});

const user: AuthenticatedUserSM = {
  firstName: "User",
  lastName: "Current",
  role: Role.MEMBRE_COMMUN,
  gender: Gender.M,
};
const userCredentials: AuthenticateParams = {
  email: "user@example.fr",
  password: "password",
};
