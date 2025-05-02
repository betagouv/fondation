import { Gender, Role } from "shared-models";
import { AuthenticatedUserSM } from "../../../core-logic/gateways/Authentication.gateway";
import { ApiAuthenticationGateway } from "./ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "./FakeAuthentication.client";

describe("Api Authentication Gateway", () => {
  let apiClient: FakeAuthenticationApiClient;
  let gateway: ApiAuthenticationGateway;

  beforeEach(() => {
    apiClient = new FakeAuthenticationApiClient();
    apiClient.setEligibleAuthUser(
      userCredentials.email,
      userCredentials.password,
      user.firstName,
      user.lastName,
      user.role,
      user.gender,
    );

    gateway = new ApiAuthenticationGateway(apiClient);
  });

  it("authenticates a user and returns the reporter name", async () => {
    const authenticatedUser = await gateway.authenticate(
      userCredentials.email,
      userCredentials.password,
    );
    expect(authenticatedUser).toEqual<AuthenticatedUserSM>(user);
  });

  it("logs out a user", async () => {
    await gateway.logout();
    expect(apiClient.user).toBeNull();
  });
});

const user: AuthenticatedUserSM = {
  firstName: "john",
  lastName: "doe",
  role: Role.MEMBRE_COMMUN,
  gender: Gender.M,
};
const userCredentials = {
  email: "user@example.com",
  password: "password123",
};
