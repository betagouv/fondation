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
