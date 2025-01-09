import { AuthenticatedUser } from "../../../core-logic/gateways/Authentication.gateway";
import { ApiAuthenticationGateway } from "./ApiAuthentication.gateway";
import { FakeAuthenticationApiClient } from "./FakeAuthentication.client";

describe("Api Authentication Gateway", () => {
  let apiClient: FakeAuthenticationApiClient;
  let gateway: ApiAuthenticationGateway;

  beforeEach(() => {
    apiClient = new FakeAuthenticationApiClient();
    apiClient.setEligibleAuthUser(
      "user@example.com",
      "password123",
      "John",
      "Doe",
    );

    gateway = new ApiAuthenticationGateway(apiClient);
  });

  it("authenticates a user and returns the reporter name", async () => {
    const authenticatedUser = await gateway.authenticate(
      "user@example.com",
      "password123",
    );
    expect(authenticatedUser).toEqual<AuthenticatedUser>({
      reporterName: "DOE John",
    });
  });

  it("logs out a user", async () => {
    await gateway.logout();
    expect(apiClient.user).toBeNull();
  });
});
