import { screen } from "@testing-library/react";
import { StubRouterProvider } from "../router/adapters/stubRouterProvider";

export const expectTransparenciesBreadcrumbFactory =
  (routerProvider: StubRouterProvider) => async () => {
    const transparencesLink = await screen.findByText("Transparences", {
      selector: "a",
    });

    expect(transparencesLink).toHaveAttribute(
      "href",
      routerProvider.transparenciesHref,
    );
    expect(transparencesLink).toHaveProperty("onclick");
  };

export type ExpectTransparenciesBreadcrumb = ReturnType<
  typeof expectTransparenciesBreadcrumbFactory
>;

export const expectSecretariatGeneralBreadcrumbFactory =
  (routerProvider: StubRouterProvider) => async () => {
    const secretariatGeneralLink = await screen.findByText(
      "Secretariat général",
      {
        selector: "a",
      },
    );

    expect(secretariatGeneralLink).toHaveAttribute(
      "href",
      routerProvider.secretariatGeneralHref,
    );
    expect(secretariatGeneralLink).toHaveProperty("onclick");
  };

export type ExpectSecretariatGeneralBreadcrumb = ReturnType<
  typeof expectSecretariatGeneralBreadcrumbFactory
>;
